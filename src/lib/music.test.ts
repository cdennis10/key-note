import { describe, expect, it } from 'vitest'
import { NOTE_RANGES, frequencyToMidi, makeChoices, noteFromMidi, pickNote, pitchResult, staffStep, validateTypedAnswer } from './music'

describe('music model', () => {
  it('maps middle C and concert A to standard MIDI/octaves', () => {
    expect(noteFromMidi(60).label).toBe('C4')
    expect(noteFromMidi(69).label).toBe('A4')
    expect(frequencyToMidi(440)).toBeCloseTo(69, 5)
  })
  it('defines documented staff ranges', () => {
    expect(NOTE_RANGES.treble.beginner.at(0)?.label).toBe('E4')
    expect(NOTE_RANGES.treble.expanded.at(-1)?.label).toBe('A5')
    expect(NOTE_RANGES.bass.beginner.at(0)?.label).toBe('G2')
    expect(NOTE_RANGES.bass.expanded.at(-1)?.label).toBe('C4')
  })
  it('maps bottom and top staff lines to eight diatonic steps', () => {
    expect(staffStep(noteFromMidi(64), 'treble')).toBe(0)
    expect(staffStep(noteFromMidi(77), 'treble')).toBe(8)
    expect(staffStep(noteFromMidi(43), 'bass')).toBe(0)
    expect(staffStep(noteFromMidi(57), 'bass')).toBe(8)
  })
  it('avoids an immediate repeat', () => {
    for (let i = 0; i < 20; i++) expect(pickNote('treble', 'beginner', 64).midi).not.toBe(64)
  })
  it('creates four unique choices with exactly one answer', () => {
    const choices = makeChoices(noteFromMidi(60))
    expect(choices).toHaveLength(4)
    expect(new Set(choices).size).toBe(4)
    expect(choices.filter((choice) => choice === 'C')).toHaveLength(1)
  })
  it('validates typed answers without counting malformed input', () => {
    expect(validateTypedAnswer(' g ')).toEqual({ valid: true, value: 'G' })
    expect(validateTypedAnswer('C4').valid).toBe(false)
    expect(validateTypedAnswer('').valid).toBe(false)
  })
  it('enforces cents tolerance and octave unless relaxed', () => {
    expect(pitchResult(440, 69, false).correct).toBe(true)
    expect(pitchResult(220, 69, false).correct).toBe(false)
    expect(pitchResult(220, 69, true).correct).toBe(true)
    expect(pitchResult(440 * 2 ** (50 / 1200), 69, false).correct).toBe(false)
  })
})
