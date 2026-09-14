export interface PitchEstimate { frequency: number | null; confidence: number; rms: number }

// Normalized autocorrelation with parabolic interpolation; suited to one note at a time.
export function detectPitch(samples: Float32Array, sampleRate: number): PitchEstimate {
  let sum = 0
  for (const sample of samples) sum += sample * sample
  const rms = Math.sqrt(sum / samples.length)
  if (rms < 0.012) return { frequency: null, confidence: 0, rms }

  const minLag = Math.floor(sampleRate / 1100)
  const maxLag = Math.min(Math.floor(sampleRate / 55), samples.length / 2)
  let bestLag = -1, best = -1
  const correlations = new Float32Array(maxLag + 1)
  for (let lag = minLag; lag <= maxLag; lag++) {
    let cross = 0, a = 0, b = 0
    for (let i = 0; i < samples.length - lag; i++) {
      cross += samples[i] * samples[i + lag]
      a += samples[i] ** 2; b += samples[i + lag] ** 2
    }
    const value = cross / Math.sqrt(a * b || 1)
    correlations[lag] = value
    if (value > best) { best = value; bestLag = lag }
  }
  if (bestLag < 0 || best < 0.8) return { frequency: null, confidence: Math.max(0, best), rms }
  const left = correlations[bestLag - 1] || best
  const right = correlations[bestLag + 1] || best
  const shift = (left - right) / (2 * (left - 2 * best + right) || 1)
  return { frequency: sampleRate / (bestLag + Math.max(-0.5, Math.min(0.5, shift))), confidence: best, rms }
}
