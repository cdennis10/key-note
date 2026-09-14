export interface Score { answered: number; firstTryCorrect: number; streak: number; bestStreak: number }
export const initialScore = (): Score => ({ answered: 0, firstTryCorrect: 0, streak: 0, bestStreak: 0 })

export function finishQuestion(score: Score, firstTry: boolean, assisted: boolean): Score {
  const credited = firstTry && !assisted
  const streak = credited ? score.streak + 1 : 0
  return {
    answered: score.answered + 1,
    firstTryCorrect: score.firstTryCorrect + (credited ? 1 : 0),
    streak,
    bestStreak: Math.max(score.bestStreak, streak),
  }
}

export type AttemptGateState = { sounding: boolean; candidate: number | null; since: number }
export function updateAttemptGate(
  state: AttemptGateState,
  midi: number | null,
  confidence: number,
  now: number,
  stableMs = 300,
): { state: AttemptGateState; accepted: number | null } {
  if (midi === null || confidence < 0.8) return { state: { sounding: false, candidate: null, since: now }, accepted: null }
  if (state.sounding) return { state, accepted: null }
  if (state.candidate !== midi) return { state: { sounding: false, candidate: midi, since: now }, accepted: null }
  if (now - state.since >= stableMs) return { state: { sounding: true, candidate: midi, since: state.since }, accepted: midi }
  return { state, accepted: null }
}
