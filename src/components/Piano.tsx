import { noteFromMidi, type Note } from '../lib/music'

const WHITE_MIDIS = Array.from({ length: 42 }, (_, i) => i + 40).filter((midi) => [0, 2, 4, 5, 7, 9, 11].includes(midi % 12))
const KEY_HINTS: Record<number, string> = { 60: 'A', 62: 'S', 64: 'D', 65: 'F', 67: 'G', 69: 'H', 71: 'J', 72: 'K' }

export function Piano({ target, interactive = false, onPlay }: { target?: Note; interactive?: boolean; onPlay?: (midi: number) => void }) {
  return (
    <div className={`piano ${interactive ? 'piano--interactive' : ''}`} role={interactive ? 'group' : 'img'} aria-label={interactive ? 'On-screen piano, natural notes E2 through C5' : `Piano showing ${target?.label}`}>
      {WHITE_MIDIS.map((midi) => {
        const note = noteFromMidi(midi)
        return <button key={midi} type="button" disabled={!interactive} className={`piano-key ${target?.midi === midi ? 'is-target' : ''}`} onClick={() => onPlay?.(midi)} aria-label={`${note.label}${target?.midi === midi ? ', correct answer' : ''}`}>
          <span>{midi % 12 === 0 ? note.label : ''}</span>{interactive && KEY_HINTS[midi] && <kbd>{KEY_HINTS[midi]}</kbd>}
        </button>
      })}
    </div>
  )
}
