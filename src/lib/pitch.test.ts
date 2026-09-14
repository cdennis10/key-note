import { describe, expect, it } from 'vitest'
import { detectPitch } from './pitch'

const sine = (frequency: number, sampleRate = 48000, size = 4096) => Float32Array.from({ length: size }, (_, i) => Math.sin(2 * Math.PI * frequency * i / sampleRate) * .5)
const pianoLike = (frequency: number, amplitude = .08, sampleRate = 48000, size = 4096) => Float32Array.from({ length: size }, (_, i) => {
  const time = i / sampleRate
  const envelope = Math.exp(-time * 2.2)
  const harmonics = .38 * Math.sin(2 * Math.PI * frequency * time) + .75 * Math.sin(2 * Math.PI * frequency * 2 * time) + .32 * Math.sin(2 * Math.PI * frequency * 3 * time)
  const deterministicNoise = Math.sin(i * 12.9898) * .012
  return amplitude * envelope * (harmonics + deterministicNoise)
})

describe('pitch detection with synthetic audio', () => {
  it('detects a clean A4 without selecting an FFT bin', () => {
    const result = detectPitch(sine(440), 48000)
    expect(result.frequency).toBeCloseTo(440, 0)
    expect(result.confidence).toBeGreaterThan(.9)
  })
  it('ignores silence and low-level noise', () => {
    expect(detectPitch(new Float32Array(4096), 48000).frequency).toBeNull()
    expect(detectPitch(sine(440).map((x) => x * .005), 48000).frequency).toBeNull()
  })
  it('finds the fundamental in quiet, harmonic-rich piano-like notes', () => {
    expect(detectPitch(pianoLike(220), 48000).frequency).toBeCloseTo(220, 0)
    expect(detectPitch(pianoLike(82.41, .12), 48000).frequency).toBeCloseTo(82.41, 0)
    expect(Math.abs(detectPitch(pianoLike(880, .055), 48000).frequency! - 880)).toBeLessThan(1)
  })
})
