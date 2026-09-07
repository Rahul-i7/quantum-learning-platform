// Client for the Content, Auth & Progress Service (Role 5).
// Set NEXT_PUBLIC_CONTENT_SERVICE_URL in .env.local once the service is
// running (defaults to http://localhost:8002, matching services/content-progress).

const BASE_URL = process.env.NEXT_PUBLIC_CONTENT_SERVICE_URL || 'http://localhost:8002'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Content service ${path} failed: ${res.status} ${body}`)
  }
  return res.json() as Promise<T>
}

export interface QuizQuestion {
  id: string
  prompt: string
  choices: { id: string; text: string }[]
  topic?: string
}

export interface QuizSubmitResult {
  quiz_id: string
  score: number
  passed: boolean
  weak_topics: string[]
  per_question: Record<string, unknown>[]
}

export interface ChallengeSubmitResult {
  challenge_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  score: number | null
  passed: boolean
  feedback: string
  sim_result: Record<string, unknown> | null
}

export interface CohortStudent {
  id: string
  name: string
  completionPct: number
  moduleProgress: number[]
  quizzes: { name: string; score: number; max: number }[]
  challenges: { name: string; status: string }[]
  lastActive: string
}

export interface CohortSummary {
  cohortName: string
  modules: string[]
  students: CohortStudent[]
}

export const contentApi = {
  getCourses: () => request<Record<string, unknown>[]>('/api/courses'),

  getQuizQuestions: (quizId: string) =>
    request<{ quiz: Record<string, unknown>; questions: QuizQuestion[] }>(`/api/quizzes/${quizId}/questions`),

  submitQuiz: (quizId: string, userId: string, answers: Record<string, string>) =>
    request<QuizSubmitResult>(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, answers }),
    }),

  getChallenge: (challengeId: string) => request<Record<string, unknown>>(`/api/challenges/${challengeId}`),

  submitChallenge: (
    challengeId: string,
    userId: string,
    circuit: { num_qubits: number; gates: unknown[]; shots?: number }
  ) =>
    request<ChallengeSubmitResult>(`/api/challenges/${challengeId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, circuit }),
    }),

  completeLesson: (userId: string, lessonId: string) =>
    request<{ completed: boolean }>('/api/lessons/complete', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, lesson_id: lessonId }),
    }),

  getProgress: (userId: string) => request<Record<string, unknown>>(`/api/progress/${userId}`),

  getCohortSummary: (cohortId: string) => request<CohortSummary>(`/api/instructor/cohort/${cohortId}`),
}
