import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, practiceUrl, settingsFromSearch } from './sharing'

describe('practice links', () => {
  it('parses validated settings and rejects unsupported values', () => {
    expect(settingsFromSearch('?difficulty=hard&clef=mixed&range=expanded&length=20')).toMatchObject({ difficulty: 'hard', clef: 'mixed', range: 'expanded', sessionLength: 20 })
    expect(settingsFromSearch('?difficulty=expert&clef=alto&range=huge&length=99')).toMatchObject(DEFAULT_SETTINGS)
  })
  it('shares configuration but no results or personal data', () => {
    const url = new URL(practiceUrl({ ...DEFAULT_SETTINGS, difficulty: 'medium' }, 'https://example.com/repo/?old=yes#x'))
    expect(url.searchParams.get('difficulty')).toBe('medium')
    expect([...url.searchParams.keys()].sort()).toEqual(['clef', 'difficulty', 'length', 'range'])
    expect(url.hash).toBe('')
  })
})
