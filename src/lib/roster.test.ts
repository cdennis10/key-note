import { beforeEach, describe, expect, it } from 'vitest'
import { ADMIN_PIN, createStudent, emptyProgress, generatePin, loadRoster, recordQuestion, recordSession, saveRoster, validPin } from './roster'

describe('local student roster', () => {
  beforeEach(() => localStorage.clear())

  it('validates and generates unique four-digit student PINs', () => {
    const existing = [createStudent('Ada', '1234')]
    expect(validPin('0042')).toBe(true)
    expect(validPin('42')).toBe(false)
    let calls = 0
    expect(generatePin(existing, () => calls++ ? .5678 : .1234)).toBe('5678')
    calls = 0
    expect(generatePin([], () => calls++ ? .9999 : .0842)).toBe('9999')
  })

  it('stores and loads roster entries on the device', () => {
    const roster = [createStudent('Maya', '2718')]
    expect(saveRoster(roster)).toBe(true)
    expect(loadRoster()[0]).toMatchObject({ name: 'Maya', pin: '2718' })
  })

  it('records cumulative questions, difficulty, streak, and sessions', () => {
    const student = createStudent('Leo', '3141')
    const afterFirst = recordQuestion(student, 'easy', true, 1, new Date('2026-01-01'))
    const afterSecond = recordQuestion(afterFirst, 'medium', false, 0, new Date('2026-01-02'))
    const finished = recordSession(afterSecond)
    expect(finished.progress).toMatchObject({ answered: 2, firstTryCorrect: 1, bestStreak: 1, sessions: 1, byDifficulty: { easy: 1, medium: 1, hard: 0 } })
    expect(finished.progress.lastPracticed).toBe('2026-01-02T00:00:00.000Z')
  })

  it('creates independent empty progress records', () => {
    const one = emptyProgress(); const two = emptyProgress()
    one.byDifficulty.easy = 9
    expect(two.byDifficulty.easy).toBe(0)
  })
})
