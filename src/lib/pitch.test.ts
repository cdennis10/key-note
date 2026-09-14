import { describe, expect, it } from 'vitest'
import { detectPitch } from './pitch'

const sine = (frequency: number, sampleRate = 48000, size = 4096) => Float32Array.from({ length: size }, (_, i) => Math.sin(2 * Math.PI * frequency * i / sampleRate) * .5)

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
})
