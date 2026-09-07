-- ============================================================================
-- Seed data — courses/modules/lessons/quizzes/challenges + demo learners.
-- Safe to re-run (uses upserts). Run after schema.sql.
--
-- The three demo users mirror services/ai-tutor/tools/learner_profile_tool.py
-- DEMO_PROFILES (beginner_alex / intermediate_sam / advanced_elena) so that
-- once SUPABASE_URL/KEY are set for the AI Tutor service, it starts reading
-- these same profiles from `user_profiles` instead of its hardcoded dict —
-- no code change needed on Role 4's side.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Course / modules / lessons
-- ---------------------------------------------------------------------------
insert into public.courses (id, title, description, order_index) values
  ('quantum-foundations', 'Quantum Algorithm Foundations', 'Qubits through Grover''s algorithm.', 0)
on conflict (id) do update set title = excluded.title, description = excluded.description;

insert into public.modules (id, course_id, title, order_index) values
  ('module_1_qubits', 'quantum-foundations', 'Qubits & Superposition', 1),
  ('module_2_entanglement', 'quantum-foundations', 'Entanglement', 2),
  ('module_3_deutsch_jozsa', 'quantum-foundations', 'Deutsch–Jozsa', 3),
  ('module_4_quantum_teleportation', 'quantum-foundations', 'Quantum Teleportation', 4),
  ('module_5_grovers_algorithm', 'quantum-foundations', 'Grover''s Algorithm', 5)
on conflict (id) do update set title = excluded.title, order_index = excluded.order_index;

insert into public.lessons (id, module_id, title, summary, order_index) values
  ('module_1_qubits_intro', 'module_1_qubits', 'Qubits & Superposition', 'The basic unit of quantum information.', 1),
  ('module_1_superposition_basics', 'module_1_qubits', 'Superposition Basics', 'Why a qubit is not just a fancy bit.', 2),
  ('module_2_entanglement_intro', 'module_2_entanglement', 'What Is Entanglement', 'Correlated qubits and Bell states.', 1)
on conflict (id) do update set title = excluded.title, summary = excluded.summary;

-- ---------------------------------------------------------------------------
-- Quizzes + questions
-- ---------------------------------------------------------------------------
insert into public.quizzes (id, module_id, title, passing_score) values
  ('q1_superposition', 'module_1_qubits', 'Superposition & Hadamard', 70),
  ('q2_bell_states', 'module_2_entanglement', 'Introduction to Entanglement', 70),
  ('q4_teleportation', 'module_4_quantum_teleportation', 'Quantum Teleportation Protocol', 70),
  ('q5_grover_oracle', 'module_5_grovers_algorithm', 'Oracle Formulation', 70)
on conflict (id) do update set title = excluded.title;

insert into public.quiz_questions (quiz_id, order_index, prompt, choices, correct_choice, concept_id, topic, explanation) values
  ('q1_superposition', 1,
   'What does the Hadamard gate do to |0⟩?',
   '[{"id":"a","text":"Leaves it unchanged"},{"id":"b","text":"Flips it to |1⟩"},{"id":"c","text":"Produces an equal superposition of |0⟩ and |1⟩"},{"id":"d","text":"Measures it"}]'::jsonb,
   'c', 'gate-h', 'Phase vs amplitude',
   'H maps |0⟩ to (|0⟩ + |1⟩)/√2 — a 50/50 superposition.'),
  ('q2_bell_states', 1,
   'In a CX (CNOT) gate, when does the target qubit flip?',
   '[{"id":"a","text":"Always"},{"id":"b","text":"Only when the control qubit is |1⟩"},{"id":"c","text":"Only when the target qubit is |1⟩"},{"id":"d","text":"Never"}]'::jsonb,
   'b', 'gate-cx', 'CNOT control/target order',
   'CX flips the target only if the control qubit is |1⟩ — mixing up control and target is the most common bug when building entangling circuits.'),
  ('q2_bell_states', 2,
   'After H(0) then CX(0,1) on |00⟩, which outcomes are possible on measurement?',
   '[{"id":"a","text":"Only 00"},{"id":"b","text":"00 and 11, each 50%"},{"id":"c","text":"00, 01, 10, 11 equally"},{"id":"d","text":"Only 11"}]'::jsonb,
   'b', 'bell-state', 'Bell measurement',
   'This circuit produces the Bell state (|00⟩ + |11⟩)/√2 — 01 and 10 have zero probability.')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Coding challenges — graded by the content-progress service via the
-- Simulation Service (Role 3), using the shared circuit JSON contract.
-- ---------------------------------------------------------------------------
insert into public.coding_challenges
  (id, module_id, title, description, starter_circuit, grading_mode, expected_result, tolerance, required_gate_types)
values
  (
    'build-a-bell-state',
    'module_2_entanglement',
    'Build a Bell state circuit',
    'Construct a 2-qubit circuit that produces the entangled Bell state (|00⟩ + |11⟩)/√2.',
    '{"num_qubits": 2, "gates": []}'::jsonb,
    'probabilities',
    '{"00": 0.5, "11": 0.5}'::jsonb,
    0.05,
    array['h', 'cx']
  ),
  (
    'grover-2-qubit-search',
    'module_5_grovers_algorithm',
    'Grover search (2-qubit)',
    'Build a 2-qubit Grover circuit that amplifies the |11⟩ marked state.',
    '{"num_qubits": 2, "gates": []}'::jsonb,
    'probabilities',
    '{"11": 1.0}'::jsonb,
    0.1,
    array['h']
  )
on conflict (id) do update set
  description = excluded.description,
  expected_result = excluded.expected_result;

-- ---------------------------------------------------------------------------
-- Demo cohort + instructor
-- ---------------------------------------------------------------------------
insert into public.cohorts (id, name, course_id) values
  ('00000000-0000-0000-0000-0000000000c1', 'Section A — Week 6', 'quantum-foundations')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- NOTE on demo users:
-- Supabase requires auth.users rows to be created via the Auth API/Admin API
-- (GoTrue), not plain SQL inserts, because passwords must go through its
-- hashing + identity flow. Use scripts/seed_demo_users.py (in
-- services/content-progress/) to create:
--   beginner_alex@demo.quantum.edu / intermediate_sam@demo.quantum.edu /
--   advanced_elena@demo.quantum.edu
-- That script also inserts the matching profiles/quiz_attempts/concept_mastery
-- rows below so `user_profiles` returns data identical to ai-tutor's
-- DEMO_PROFILES dict.
-- ---------------------------------------------------------------------------
