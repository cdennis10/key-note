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
      {clef === 'treble' ? (
        <g className="clef-mark" transform="translate(78 49) scale(.78)">
          <path d="M37 5c-18 16-25 38-14 58 8 15 30 21 42 8 13-14 3-38-17-36-17 2-25 23-14 37 9 12 30 9 35-7 5-18-6-35-20-43 1-11 6-20 12-23 8 17 7 35-3 53-12 22-25 43-22 67 2 18 20 30 36 22 12-6 13-25 2-32-9-6-20 1-18 11 2 8 12 11 18 6 9-7 5-22-8-25-17-4-31 12-29 31 2 22 28 34 47 22 22-14 24-45 4-61C61 39 46 35 33 42 25 27 28 14 37 5Z" />
        </g>
      ) : (
        <g className="clef-mark" transform="translate(74 74)">
          <path d="M5 32C8 5 45 1 52 23c7 25-17 50-47 59 18-12 31-28 29-44C31 18 13 17 5 32Z" />
          <circle cx="66" cy="24" r="5" /><circle cx="66" cy="48" r="5" />
        </g>
      )}
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
