export type Clef = 'treble' | 'bass'
export type ClefSetting = Clef | 'mixed'
export type RangeSetting = 'beginner' | 'expanded'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type SessionLength = 10 | 20 | 'free'

export interface Note {
  midi: number
  letter: string
  octave: number
  label: string
  frequency: number
}

const NATURAL_PCS: Record<number, string> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' }

export function noteFromMidi(midi: number): Note {
  const pc = ((midi % 12) + 12) % 12
  const letter = NATURAL_PCS[pc]
  if (!letter) throw new Error(`MIDI ${midi} is not a natural note`)
  const octave = Math.floor(midi / 12) - 1
  return { midi, letter, octave, label: `${letter}${octave}`, frequency: 440 * 2 ** ((midi - 69) / 12) }
}

const midiRange = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)
    .filter((midi) => NATURAL_PCS[midi % 12])
    .map(noteFromMidi)

export const NOTE_RANGES: Record<Clef, Record<RangeSetting, Note[]>> = {
  treble: {
    beginner: midiRange(64, 77), // E4–F5: the five lines and four spaces
    expanded: midiRange(60, 81), // C4–A5: middle C through one ledger line above
  },
  bass: {
    beginner: midiRange(43, 57), // G2–A3: the five lines and four spaces
    expanded: midiRange(40, 60), // E2–C4: one ledger line below through middle C
  },
}

export function pickClef(setting: ClefSetting, random = Math.random): Clef {
  return setting === 'mixed' ? (random() < 0.5 ? 'treble' : 'bass') : setting
}

export function pickNote(clef: Clef, range: RangeSetting, previousMidi?: number, random = Math.random): Note {
  const all = NOTE_RANGES[clef][range]
  const choices = all.length > 1 ? all.filter((note) => note.midi !== previousMidi) : all
  return choices[Math.floor(random() * choices.length)]
}

export function makeChoices(correct: Note, random = Math.random): string[] {
  const pool = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].filter((name) => name !== correct.letter)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const result = [correct.letter, ...pool.slice(0, 3)]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function validateTypedAnswer(raw: string): { valid: boolean; value?: string; message?: string } {
  const value = raw.trim().toUpperCase()
  return /^[A-G]$/.test(value)
    ? { valid: true, value }
    : { valid: false, message: 'Enter one letter from A to G. Octave numbers are not needed.' }
}

const letterOrder: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }
export const diatonicIndex = (note: Note) => note.octave * 7 + letterOrder[note.letter]

export function staffStep(note: Note, clef: Clef): number {
  const bottom = clef === 'treble' ? noteFromMidi(64) : noteFromMidi(43)
  return diatonicIndex(note) - diatonicIndex(bottom)
}

export function frequencyToMidi(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440)
}

export function pitchResult(frequency: number, targetMidi: number, anyOctave: boolean, toleranceCents = 40) {
  const floatMidi = frequencyToMidi(frequency)
  const nearestMidi = Math.round(floatMidi)
  const cents = (floatMidi - nearestMidi) * 100
  const pitchClassMatches = ((nearestMidi - targetMidi) % 12 + 12) % 12 === 0
  return {
    midi: nearestMidi,
    cents,
    inTune: Math.abs(cents) <= toleranceCents,
    correct: Math.abs(cents) <= toleranceCents && (anyOctave ? pitchClassMatches : nearestMidi === targetMidi),
  }
}

export const noteNameFromAnyMidi = (midi: number) => {
  const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
  return `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`
}
