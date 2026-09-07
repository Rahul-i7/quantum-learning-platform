-- ============================================================================
-- QMentor — Content, Auth & Progress schema (Role 5)
-- ============================================================================
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh
-- project. Supabase Auth (auth.users) already exists — everything here hangs
-- off auth.uid().
--
-- Design notes for the rest of the team:
--   * `profiles` is the source of truth for who a learner is. It is kept
--     separate from `auth.users` (Supabase convention) so we can add app
--     fields without touching the managed auth schema.
--   * `user_profiles` (view, bottom of this file) reshapes profiles +
--     quiz_attempts + concept_mastery into EXACTLY the JSON shape the AI
--     Tutor's `learner_profile_tool.py` expects from
--     `GET /rest/v1/user_profiles?user_id=eq.<id>`. Do not rename its
--     columns without updating that tool too (Role 4).
--   * Every table has row-level security enabled. Learners can only ever
--     read/write their own rows; instructors get read access to their
--     cohort's data via the `instructor_of` table.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type skill_level as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null; end $$;

do $$ begin
  create type learning_style as enum ('visual', 'intuitive', 'mathematical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type concept_status as enum ('not_started', 'struggling', 'learning', 'mastered');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('student', 'instructor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type challenge_status as enum ('not_started', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users row
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  name                text not null default 'Learner',
  role                app_role not null default 'student',
  skill_level         skill_level not null default 'beginner',
  learning_style      learning_style not null default 'intuitive',
  current_module      text,
  preferred_hint_depth smallint not null default 1 check (preferred_hint_depth between 1 and 3),
  known_struggles     text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.profiles is 'App-level learner/instructor profile, 1:1 with auth.users.';

-- ---------------------------------------------------------------------------
-- courses / modules / lessons — content hierarchy
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id           text primary key,                 -- e.g. 'quantum-foundations'
  title        text not null,
  description  text,
  order_index  int not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.modules (
  id           text primary key,                 -- e.g. 'module_2_entanglement'
  course_id    text not null references public.courses(id) on delete cascade,
  title        text not null,
  order_index  int not null default 0
);

create table if not exists public.lessons (
  id           text primary key,                 -- e.g. 'module_1_qubits_intro'
  module_id    text not null references public.modules(id) on delete cascade,
  title        text not null,
  summary      text,
  content_ref  text,                              -- key into apps/web content data, or a CMS ref
  order_index  int not null default 0
);

-- ---------------------------------------------------------------------------
-- quizzes / questions
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id           text primary key,                 -- e.g. 'q2_bell_states'
  module_id    text references public.modules(id) on delete set null,
  title        text not null,
  passing_score numeric not null default 70.0 check (passing_score between 0 and 100),
  created_at   timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         text not null references public.quizzes(id) on delete cascade,
  order_index     int not null default 0,
  prompt          text not null,
  choices         jsonb not null,                 -- [{ "id": "a", "text": "..." }, ...]
  correct_choice  text not null,                  -- matches a choices[].id — never exposed to clients
  concept_id      text,                            -- links wrong answers back to a concept (see concept_mastery)
  topic           text,                            -- free-text "weak topic" label, e.g. "CNOT control/target order"
  explanation     text
);

-- ---------------------------------------------------------------------------
-- coding challenges — circuit-building exercises, graded by simulation
-- ---------------------------------------------------------------------------
create table if not exists public.coding_challenges (
  id                text primary key,             -- e.g. 'build-a-bell-state'
  module_id         text references public.modules(id) on delete set null,
  title             text not null,
  description       text,
  starter_circuit   jsonb,                         -- optional starter circuit JSON (shared contract, section 4)
  grading_mode      text not null default 'probabilities'
                      check (grading_mode in ('probabilities', 'counts', 'statevector')),
  expected_result   jsonb not null,                 -- shape depends on grading_mode, see grading/challenge_grading.py
  tolerance         numeric not null default 0.05,  -- allowed absolute deviation per outcome
  required_gate_types text[],                       -- optional: gates that MUST appear (e.g. ['h','cx'])
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Attempts / submissions / progress — one row per learner action
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  quiz_id       text not null references public.quizzes(id) on delete cascade,
  score         numeric not null check (score between 0 and 100),
  passed        boolean not null,
  weak_topics   text[] not null default '{}',
  answers       jsonb not null default '{}',        -- { question_id: choice_id }
  created_at    timestamptz not null default now()
);

create table if not exists public.challenge_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  challenge_id  text not null references public.coding_challenges(id) on delete cascade,
  circuit       jsonb not null,                     -- the submitted circuit JSON (shared contract)
  status        challenge_status not null default 'in_progress',
  score         numeric check (score between 0 and 100),
  passed        boolean not null default false,
  feedback      text,
  sim_result    jsonb,                               -- raw simulation-service output, cached for review
  created_at    timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id       uuid not null references auth.users(id) on delete cascade,
  lesson_id     text not null references public.lessons(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.concept_mastery (
  user_id         uuid not null references auth.users(id) on delete cascade,
  concept_id      text not null,
  concept_name    text not null,
  status          concept_status not null default 'not_started',
  accuracy_rate   numeric not null default 0.0 check (accuracy_rate between 0 and 1),
  attempts        int not null default 0,
  last_practiced  timestamptz,
  primary key (user_id, concept_id)
);

-- ---------------------------------------------------------------------------
-- Cohorts — how instructors see aggregated progress without seeing raw PII
-- they shouldn't
-- ---------------------------------------------------------------------------
create table if not exists public.cohorts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,                       -- e.g. 'Section A — Week 6'
  course_id    text references public.courses(id) on delete set null,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create table if not exists public.cohort_members (
  cohort_id    uuid not null references public.cohorts(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (cohort_id, user_id)
);

create table if not exists public.instructor_of (
  cohort_id    uuid not null references public.cohorts(id) on delete cascade,
  instructor_id uuid not null references auth.users(id) on delete cascade,
  primary key (cohort_id, instructor_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_quiz_attempts_user on public.quiz_attempts(user_id);
create index if not exists idx_quiz_attempts_quiz on public.quiz_attempts(quiz_id);
create index if not exists idx_challenge_submissions_user on public.challenge_submissions(user_id);
create index if not exists idx_challenge_submissions_challenge on public.challenge_submissions(challenge_id);
create index if not exists idx_lesson_progress_user on public.lesson_progress(user_id);
create index if not exists idx_concept_mastery_user on public.concept_mastery(user_id);
create index if not exists idx_cohort_members_user on public.cohort_members(user_id);
create index if not exists idx_cohort_members_cohort on public.cohort_members(cohort_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for profiles
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Learner'))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.concept_mastery enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.instructor_of enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.coding_challenges enable row level security;

-- Content tables (courses/modules/lessons/quizzes/challenges) are readable
-- by any signed-in user, writable only via the service role (backend).
create policy "content readable by authenticated users" on public.courses
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated users" on public.modules
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated users" on public.lessons
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated users" on public.quizzes
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated users" on public.coding_challenges
  for select using (auth.role() = 'authenticated');

-- Quiz questions: readable, but correct_choice is stripped out in a view
-- (see quiz_questions_public below) — never expose this table directly to
-- the browser client. The service role (grading service) reads this table
-- directly to grade submissions.
create policy "questions readable by authenticated users" on public.quiz_questions
  for select using (auth.role() = 'authenticated');

-- profiles: a user can read/update only their own row. Instructors can read
-- profiles of learners in a cohort they teach.
create policy "own profile select" on public.profiles
  for select using (auth.uid() = user_id);
create policy "own profile update" on public.profiles
  for update using (auth.uid() = user_id);
create policy "instructor reads cohort profiles" on public.profiles
  for select using (
    exists (
      select 1
      from public.cohort_members cm
      join public.instructor_of io on io.cohort_id = cm.cohort_id
      where cm.user_id = public.profiles.user_id
        and io.instructor_id = auth.uid()
    )
  );

-- quiz_attempts: own rows only, plus instructor visibility over their cohort.
create policy "own quiz attempts select" on public.quiz_attempts
  for select using (auth.uid() = user_id);
create policy "own quiz attempts insert" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);
create policy "instructor reads cohort quiz attempts" on public.quiz_attempts
  for select using (
    exists (
      select 1 from public.cohort_members cm
      join public.instructor_of io on io.cohort_id = cm.cohort_id
      where cm.user_id = public.quiz_attempts.user_id
        and io.instructor_id = auth.uid()
    )
  );

-- challenge_submissions: same pattern.
create policy "own submissions select" on public.challenge_submissions
  for select using (auth.uid() = user_id);
create policy "own submissions insert" on public.challenge_submissions
  for insert with check (auth.uid() = user_id);
create policy "own submissions update" on public.challenge_submissions
  for update using (auth.uid() = user_id);
create policy "instructor reads cohort submissions" on public.challenge_submissions
  for select using (
    exists (
      select 1 from public.cohort_members cm
      join public.instructor_of io on io.cohort_id = cm.cohort_id
      where cm.user_id = public.challenge_submissions.user_id
        and io.instructor_id = auth.uid()
    )
  );

-- lesson_progress
create policy "own lesson progress select" on public.lesson_progress
  for select using (auth.uid() = user_id);
create policy "own lesson progress insert" on public.lesson_progress
  for insert with check (auth.uid() = user_id);
create policy "instructor reads cohort lesson progress" on public.lesson_progress
  for select using (
    exists (
      select 1 from public.cohort_members cm
      join public.instructor_of io on io.cohort_id = cm.cohort_id
      where cm.user_id = public.lesson_progress.user_id
        and io.instructor_id = auth.uid()
    )
  );

-- concept_mastery
create policy "own concept mastery select" on public.concept_mastery
  for select using (auth.uid() = user_id);
create policy "own concept mastery upsert" on public.concept_mastery
  for insert with check (auth.uid() = user_id);
create policy "own concept mastery update" on public.concept_mastery
  for update using (auth.uid() = user_id);
create policy "instructor reads cohort concept mastery" on public.concept_mastery
  for select using (
    exists (
      select 1 from public.cohort_members cm
      join public.instructor_of io on io.cohort_id = cm.cohort_id
      where cm.user_id = public.concept_mastery.user_id
        and io.instructor_id = auth.uid()
    )
  );

-- cohorts / membership / instructor_of: members can see their own cohort;
-- instructors can see cohorts they teach.
create policy "member reads own cohort" on public.cohorts
  for select using (
    exists (
      select 1 from public.cohort_members cm
      where cm.cohort_id = public.cohorts.id and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.instructor_of io
      where io.cohort_id = public.cohorts.id and io.instructor_id = auth.uid()
    )
  );

create policy "member reads own membership" on public.cohort_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.instructor_of io
      where io.cohort_id = public.cohort_members.cohort_id and io.instructor_id = auth.uid()
    )
  );

create policy "instructor reads own assignments" on public.instructor_of
  for select using (instructor_id = auth.uid());

-- Note: all INSERT/UPDATE/DELETE on content tables (courses, modules,
-- lessons, quizzes, quiz_questions, coding_challenges) and on cohorts /
-- cohort_members / instructor_of intentionally has NO policy, which means
-- only the service role key (used by the content-progress backend, never
-- shipped to the browser) can write to them. This keeps grading answer
-- keys and roster management server-side only.

-- ============================================================================
-- user_profiles view — the exact contract expected by the AI Tutor's
-- learner_profile_tool.py (services/ai-tutor/tools/learner_profile_tool.py)
-- via GET {SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.<id>&select=*
-- ============================================================================
create or replace view public.user_profiles
with (security_invoker = true) as
select
  p.user_id::text as user_id,
  p.name,
  p.skill_level::text as skill_level,
  p.learning_style::text as learning_style,
  coalesce(
    (select array_agg(lp.lesson_id order by lp.completed_at)
     from public.lesson_progress lp where lp.user_id = p.user_id),
    '{}'
  ) as completed_lessons,
  p.current_module,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
        'quiz_id', qa.quiz_id,
        'title', q.title,
        'score', qa.score,
        'passed', qa.passed,
        'weak_topics', qa.weak_topics
      ) order by qa.created_at)
     from public.quiz_attempts qa
     join public.quizzes q on q.id = qa.quiz_id
     where qa.user_id = p.user_id),
    '[]'::jsonb
  ) as quizzes,
  coalesce(
    (select jsonb_object_agg(cm.concept_id, jsonb_build_object(
        'concept_id', cm.concept_id,
        'concept_name', cm.concept_name,
        'status', cm.status,
        'accuracy_rate', cm.accuracy_rate,
        'attempts', cm.attempts,
        'last_practiced', cm.last_practiced
      ))
     from public.concept_mastery cm where cm.user_id = p.user_id),
    '{}'::jsonb
  ) as concepts,
  p.known_struggles,
  p.preferred_hint_depth
from public.profiles p;

comment on view public.user_profiles is
  'Flat JSON contract consumed by the AI Tutor service (Role 4). Keep column '
  'names/shape in sync with services/ai-tutor/models/learner.py::LearnerProfile.';

-- Quiz questions without the answer key, safe to send to the browser client.
create or replace view public.quiz_questions_public
with (security_invoker = true) as
select id, quiz_id, order_index, prompt, choices, concept_id, topic
from public.quiz_questions;
