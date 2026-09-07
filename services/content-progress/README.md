# Role 5 — Content, Auth & Progress Service

This delivers everything from Section 8.5 of the design doc:

- Supabase schema (courses/lessons/quizzes/challenges + progress tables) with Row-Level Security
- Supabase Auth wired into the Next.js frontend (sign up / sign in / sign out)
- Assessment and coding-challenge grading logic
- Progress-tracking and instructor-facing aggregation APIs

## What's here

```
supabase/
  schema.sql            # tables, enums, RLS policies, triggers, the user_profiles view
  seed.sql              # demo course/module/lesson/quiz/challenge content
services/content-progress/
  main.py                # FastAPI app — run with: uvicorn main:app --reload --port 8002
  config.py
  auth.py                 # Supabase JWT verification (+ documented dev-mode fallback)
  db/
    supabase_client.py    # PostgREST wrapper (service-role key)
    memory_store.py        # in-memory fallback, seeded with the same 3 demo learners
    repository.py          # picks Supabase or memory store automatically
  grading/
    quiz_grading.py        # scoring + concept-mastery status
    challenge_grading.py   # calls the Simulation Service, compares real output to target
  services/
    progress_service.py    # learner progress + InstructorDashboard-shaped cohort rollups
  scripts/seed_demo_users.py  # creates the 3 demo Supabase Auth users + their profile rows
  tests/                  # 18 tests, all passing (`pytest -q`)
apps/web/
  lib/supabase/client.ts, AuthProvider.tsx   # browser auth
  app/login/page.tsx                          # sign in / sign up
  lib/api-client/content.ts                   # typed client for this service
  components/visualizations/InstructorDashboard.jsx  # now has a "Live — Content Service" option
```

## Quick start (no Supabase project yet)

The service runs out of the box against an in-memory demo store — nobody
else on the team needs real Supabase credentials to build against it:

```bash
cd services/content-progress
pip install -r requirements.txt --break-system-packages
uvicorn main:app --reload --port 8002
```

Try it:

```bash
curl localhost:8002/api/courses
curl localhost:8002/api/user_profiles/beginner_alex
curl localhost:8002/api/instructor/cohort/00000000-0000-0000-0000-0000000000c1
```

## Wiring up a real Supabase project

1. Create a project at supabase.com.
2. Paste `supabase/schema.sql` into the SQL editor and run it.
3. Paste `supabase/seed.sql` and run it (content only — auth users can't be
   created via plain SQL).
4. Set `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` in
   `services/content-progress/.env` and run
   `python scripts/seed_demo_users.py` to create the three demo learners.
5. Copy the project's URL/publishable key into the root `.env` as
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and (for
  `services/content-progress` and `services/ai-tutor`) the service-role key
  as `SUPABASE_SERVICE_ROLE_KEY`.
6. Optional but recommended before a real deploy: set
   `SUPABASE_JWT_SECRET` (Settings → API in the Supabase dashboard) so the
   service verifies learner tokens instead of trusting the request body.

Once `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are set, `repository.py`
switches from the in-memory store to real Supabase automatically — no code
changes needed anywhere else.

## Integration points with other roles

- **Role 4 (AI Tutor)**: `learner_profile_tool.py` already queries
  `GET {SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.<id>`. The
  `user_profiles` view in `schema.sql` returns exactly the shape
  `LearnerProfile` expects. It also works as
  `GET http://localhost:8002/api/user_profiles/<id>` if Role 4 prefers
  calling this service directly instead of PostgREST.
- **Role 3 (Simulation)**: `challenge_grading.py` POSTs the learner's
  circuit to `{SIMULATION_SERVICE_URL}/simulate` using the shared circuit
  JSON contract and grades the real result — it never guesses from the
  code.
- **Roles 1/2 (Frontend)**: `lib/api-client/content.ts` has typed calls for
  quiz/challenge submission, lesson completion, and progress reads.
  `InstructorDashboard.jsx`'s new "Live — Content Service" button is a
  working example of wiring a component to this service with a graceful
  fallback to demo data.

## Notes / known follow-ups

- `progress_service._challenge_status_for` currently infers coding-challenge
  status from related quiz results as a stand-in, since per-user
  `challenge_submissions` aren't joined into the cohort rollup yet — swap
  this for a real join once end-to-end auth sessions exist in the demo.
- The dev-mode auth fallback (trusting `user_id` in the request body when
  `SUPABASE_JWT_SECRET` is unset) is meant for local development only —
  set the JWT secret before a real deploy.
- Heads up: the root `.env.example` currently has what looks like a real
  (not placeholder) `GEMINI_API_KEY` value checked in. Worth rotating that
  key and swapping in a placeholder before this goes anywhere public — flagging
  since it's not something I should silently "fix" without you knowing about it.
