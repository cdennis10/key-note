import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { noteFromMidi } from '../lib/music'
import { Staff } from './Staff'

describe('standard clef rendering', () => {
  it('anchors the Bravura treble-clef vector on the G line', () => {
    const { container } = render(<Staff note={noteFromMidi(71)} clef="treble" />)
    const clef = container.querySelector('.clef-vector')
    expect(clef?.getAttribute('transform')).toBe('translate(76 123) scale(.076 -.076)')
    expect(clef?.getAttribute('d')?.length).toBeGreaterThan(1200)
  })

  it('anchors the Bravura bass-clef vector on the F line', () => {
    const { container } = render(<Staff note={noteFromMidi(53)} clef="bass" />)
    const clef = container.querySelector('.clef-vector')
    expect(clef?.getAttribute('transform')).toBe('translate(74 85) scale(.076 -.076)')
    expect(clef?.getAttribute('d')?.length).toBeGreaterThan(500)
  })
})
