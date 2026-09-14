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

export type AttemptGateState = { sounding: boolean; candidate: number | null; since: number; quietSince: number | null }
export function updateAttemptGate(
  state: AttemptGateState,
  midi: number | null,
  confidence: number,
  now: number,
  stableMs = 300,
  minimumConfidence = 0.7,
  releaseMs = 160,
): { state: AttemptGateState; accepted: number | null } {
  if (midi === null || confidence < minimumConfidence) {
    if (!state.sounding) return { state: { sounding: false, candidate: null, since: now, quietSince: null }, accepted: null }
    const quietSince = state.quietSince ?? now
    if (now - quietSince >= releaseMs) return { state: { sounding: false, candidate: null, since: now, quietSince: null }, accepted: null }
    return { state: { ...state, quietSince }, accepted: null }
  }
  if (state.sounding) return { state: { ...state, quietSince: null }, accepted: null }
  if (state.candidate !== midi) return { state: { sounding: false, candidate: midi, since: now, quietSince: null }, accepted: null }
  if (now - state.since >= stableMs) return { state: { sounding: true, candidate: midi, since: state.since, quietSince: null }, accepted: midi }
  return { state: { ...state, quietSince: null }, accepted: null }
}
