import type { Clef, Note } from '../lib/music'
import { noteFromMidi, staffStep } from '../lib/music'

interface Props { note: Note; clef: Clef; showHint?: boolean; compact?: boolean }

export function Staff({ note, clef, showHint = false, compact = false }: Props) {
  const step = staffStep(note, clef)
  const y = 142 - step * 9.5
  const reference = clef === 'treble' ? noteFromMidi(64) : noteFromMidi(43)
  const ledgers: number[] = []
  if (step <= -2) for (let s = -2; s >= step; s -= 2) ledgers.push(s)
  if (step >= 10) for (let s = 10; s <= step; s += 2) ledgers.push(s)
  return (
    <svg className={`staff ${compact ? 'staff--compact' : ''}`} viewBox="0 0 520 220" role="img" aria-label={`${note.label} on the ${clef} staff`}>
      <title>{note.label} on the {clef} staff</title>
      <rect x="1" y="1" width="518" height="218" rx="22" fill="#fffdf8" />
      {[66, 85, 104, 123, 142].map((lineY) => <line key={lineY} x1="54" y1={lineY} x2="478" y2={lineY} className="staff-line" />)}
      <text
        x={clef === 'treble' ? 76 : 74}
        y={clef === 'treble' ? 123 : 85}
        className={`clef-glyph clef-glyph--${clef}`}
        aria-hidden="true"
      >{clef === 'treble' ? '\uE050' : '\uE062'}</text>
      <text x="260" y="34" className="clef-label">{clef === 'treble' ? 'TREBLE CLEF' : 'BASS CLEF'}</text>
      {ledgers.map((s) => <line key={s} x1="245" y1={142 - s * 9.5} x2="303" y2={142 - s * 9.5} className="ledger-line" />)}
      {showHint && (
        <g className="reference-note">
          <ellipse cx="190" cy="142" rx="14" ry="9" transform="rotate(-12 190 142)" />
          <text x="190" y="174">Start: {reference.label}</text>
        </g>
      )}
      <g className="target-note">
        <ellipse cx="274" cy={y} rx="16" ry="10.5" transform={`rotate(-12 274 ${y})`} />
        <line x1="288" y1={y - 2} x2="288" y2={step >= 4 ? y + 62 : y - 62} />
      </g>
    </svg>
  )
}
