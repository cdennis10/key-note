import type { ClefSetting, Difficulty, RangeSetting, SessionLength } from './music'

export interface Settings { difficulty: Difficulty; clef: ClefSetting; range: RangeSetting; sessionLength: SessionLength; anyOctave: boolean; autoAdvance: boolean }
export const DEFAULT_SETTINGS: Settings = { difficulty: 'easy', clef: 'treble', range: 'beginner', sessionLength: 10, anyOctave: false, autoAdvance: false }

export function settingsFromSearch(search: string): Settings {
  const p = new URLSearchParams(search)
  const difficulty = ['easy', 'medium', 'hard'].includes(p.get('difficulty') || '') ? p.get('difficulty') as Difficulty : DEFAULT_SETTINGS.difficulty
  const clef = ['treble', 'bass', 'mixed'].includes(p.get('clef') || '') ? p.get('clef') as ClefSetting : DEFAULT_SETTINGS.clef
  const range = ['beginner', 'expanded'].includes(p.get('range') || '') ? p.get('range') as RangeSetting : DEFAULT_SETTINGS.range
  const lengthRaw = p.get('length')
  const sessionLength: SessionLength = lengthRaw === '20' ? 20 : lengthRaw === 'free' ? 'free' : 10
  return { ...DEFAULT_SETTINGS, difficulty, clef, range, sessionLength }
}

export function practiceUrl(settings: Settings, href: string): string {
  const url = new URL(href)
  url.search = new URLSearchParams({ difficulty: settings.difficulty, clef: settings.clef, range: settings.range, length: String(settings.sessionLength) }).toString()
  url.hash = ''
  return url.toString()
}
