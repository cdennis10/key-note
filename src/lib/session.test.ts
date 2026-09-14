import { describe, expect, it } from 'vitest'
import { finishQuestion, initialScore, updateAttemptGate } from './session'

describe('session scoring', () => {
  it('credits only an unassisted first try and maintains streaks', () => {
    const first = finishQuestion(initialScore(), true, false)
    expect(first).toMatchObject({ answered: 1, firstTryCorrect: 1, streak: 1 })
    const retry = finishQuestion(first, false, false)
    expect(retry).toMatchObject({ answered: 2, firstTryCorrect: 1, streak: 0, bestStreak: 1 })
    const assisted = finishQuestion(first, true, true)
    expect(assisted).toMatchObject({ firstTryCorrect: 1, streak: 0 })
  })
})

describe('deliberate-note gate', () => {
  it('ignores silence and uncertain input', () => {
    const initial = { sounding: false, candidate: null, since: 0, quietSince: null }
    expect(updateAttemptGate(initial, null, 1, 100).accepted).toBeNull()
    expect(updateAttemptGate(initial, 69, .4, 100).accepted).toBeNull()
  })
  it('requires stability, scores once per sustain, and resets on release', () => {
    let state = { sounding: false, candidate: null as number | null, since: 0, quietSince: null as number | null }
    let update = updateAttemptGate(state, 69, .95, 100); state = update.state
    update = updateAttemptGate(state, 69, .95, 250); state = update.state
    expect(update.accepted).toBeNull()
    update = updateAttemptGate(state, 69, .95, 410); state = update.state
    expect(update.accepted).toBe(69)
    expect(updateAttemptGate(state, 69, .95, 800).accepted).toBeNull()
    state = updateAttemptGate(state, null, 0, 900).state
    expect(updateAttemptGate(state, 69, .95, 950).accepted).toBeNull()
    state = updateAttemptGate(state, null, 0, 1070).state
    state = updateAttemptGate(state, 69, .95, 1100).state
    expect(updateAttemptGate(state, 69, .95, 1410).accepted).toBe(69)
  })
})
