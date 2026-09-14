export interface PitchEstimate { frequency: number | null; confidence: number; rms: number }

const SILENCE_RMS = 0.006

// YIN-style cumulative mean normalized difference. It follows the waveform's
// repeating period instead of choosing a loud FFT bin, which is important for
// piano tones whose upper harmonics can be louder than the fundamental.
export function detectPitch(samples: Float32Array, sampleRate: number): PitchEstimate {
  let sum = 0
  for (const sample of samples) sum += sample * sample
  const rms = Math.sqrt(sum / samples.length)
  if (rms < SILENCE_RMS) return { frequency: null, confidence: 0, rms }

  let signal = samples
  let effectiveRate = sampleRate
  if (samples.length >= 4096) {
    signal = new Float32Array(samples.length / 2)
    for (let i = 0; i < signal.length; i++) signal[i] = (samples[i * 2] + samples[i * 2 + 1]) * 0.5
    effectiveRate /= 2
  }

  const minLag = Math.max(2, Math.floor(effectiveRate / 1100))
  const maxLag = Math.min(Math.floor(effectiveRate / 55), Math.floor(signal.length / 2))
  const compareLength = signal.length - maxLag
  const difference = new Float32Array(maxLag + 1)

  for (let lag = 1; lag <= maxLag; lag++) {
    let value = 0
    for (let i = 0; i < compareLength; i++) {
      const delta = signal[i] - signal[i + lag]
      value += delta * delta
    }
    difference[lag] = value
  }

  let runningSum = 0
  difference[0] = 1
  for (let lag = 1; lag <= maxLag; lag++) {
    runningSum += difference[lag]
    difference[lag] = runningSum ? difference[lag] * lag / runningSum : 1
  }

  let bestLag = -1
  let bestValue = 1
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (difference[lag] < bestValue) { bestValue = difference[lag]; bestLag = lag }
    if (difference[lag] < 0.2) {
      while (lag + 1 <= maxLag && difference[lag + 1] < difference[lag]) lag++
      bestLag = lag; bestValue = difference[lag]
      break
    }
  }

  const confidence = Math.max(0, Math.min(1, 1 - bestValue))
  if (bestLag < 0 || bestValue > 0.35) return { frequency: null, confidence, rms }

  const left = difference[bestLag - 1] ?? bestValue
  const right = difference[bestLag + 1] ?? bestValue
  const denominator = left - 2 * bestValue + right
  const shift = denominator ? 0.5 * (left - right) / denominator : 0
  const refinedLag = bestLag + Math.max(-0.5, Math.min(0.5, shift))
  return { frequency: effectiveRate / refinedLag, confidence, rms }
}
