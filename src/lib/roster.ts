import type { Difficulty } from './music'

export const ADMIN_PIN = '0842'
export const ROSTER_KEY = 'piano-note-trainer:roster'

export interface StudentProgress {
  answered: number
  firstTryCorrect: number
  bestStreak: number
  sessions: number
  lastPracticed: string | null
  byDifficulty: Record<Difficulty, number>
}

export interface Student {
  id: string
  name: string
  pin: string
  createdAt: string
  progress: StudentProgress
}

export const emptyProgress = (): StudentProgress => ({
  answered: 0,
  firstTryCorrect: 0,
  bestStreak: 0,
  sessions: 0,
  lastPracticed: null,
  byDifficulty: { easy: 0, medium: 0, hard: 0 },
})

export function loadRoster(): Student[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ROSTER_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export function saveRoster(students: Student[]): boolean {
  try { localStorage.setItem(ROSTER_KEY, JSON.stringify(students)); return true }
  catch { return false }
}

export const validPin = (pin: string) => /^\d{4}$/.test(pin)

export function generatePin(students: Student[], random = Math.random): string {
  const used = new Set([ADMIN_PIN, ...students.map((student) => student.pin)])
  for (let tries = 0; tries < 10_000; tries++) {
    const pin = String(Math.floor(random() * 10_000)).padStart(4, '0')
    if (!used.has(pin)) return pin
  }
  throw new Error('No PIN is available')
}

export function createStudent(name: string, pin: string, now = new Date()): Student {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    pin,
    createdAt: now.toISOString(),
    progress: emptyProgress(),
  }
}

export function recordQuestion(student: Student, difficulty: Difficulty, credited: boolean, streak: number, now = new Date()): Student {
  return {
    ...student,
    progress: {
      ...student.progress,
      answered: student.progress.answered + 1,
      firstTryCorrect: student.progress.firstTryCorrect + (credited ? 1 : 0),
      bestStreak: Math.max(student.progress.bestStreak, streak),
      lastPracticed: now.toISOString(),
      byDifficulty: { ...student.progress.byDifficulty, [difficulty]: student.progress.byDifficulty[difficulty] + 1 },
    },
  }
}

export function recordSession(student: Student): Student {
  return { ...student, progress: { ...student.progress, sessions: student.progress.sessions + 1 } }
}
