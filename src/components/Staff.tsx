import type { Clef, Note } from '../lib/music'
import { noteFromMidi, staffStep } from '../lib/music'

interface Props { note: Note; clef: Clef; showHint?: boolean; compact?: boolean }

// Exact Bravura SMuFL outlines (gClef U+E050 and fClef U+E062), licensed OFL-1.1.
const TREBLE_CLEF_PATH = 'M376 415C374 427 376 428 382 434C490 535 572 662 572 815C572 902 548 988 507 1048C492 1070 466 1098 455 1098C441 1098 410 1072 390 1050C316 968 292 843 292 739C292 681 299 616 306 575C308 563 309 561 297 551C153 432 0 289 0 87C0 -87 119 -252 364 -252C387 -252 413 -250 433 -246C444 -244 446 -243 448 -255C460 -322 475 -409 475 -456C475 -604 375 -622 316 -622C262 -622 236 -606 236 -593C236 -586 245 -583 268 -576C299 -567 335 -540 335 -482C335 -427 300 -380 239 -380C172 -380 132 -433 132 -495C132 -560 171 -658 322 -658C389 -658 519 -628 519 -458C519 -401 501 -306 490 -244C488 -232 489 -233 503 -227C604 -187 671 -102 671 11C671 139 577 252 430 252C404 252 404 252 401 270ZM470 943C503 943 530 916 530 861C530 750 435 660 356 591C349 585 345 586 343 599C339 625 337 659 337 691C337 847 409 943 470 943ZM361 262C364 243 364 244 346 238C258 208 201 129 201 44C201 -46 248 -110 316 -133C324 -136 336 -139 343 -139C351 -139 355 -134 355 -128C355 -121 347 -118 340 -115C298 -97 268 -54 268 -8C268 49 307 92 368 109C384 113 386 112 388 101L438 -197C440 -208 439 -208 424 -211C408 -214 388 -216 368 -216C193 -216 80 -119 80 20C80 79 90 158 173 252C233 319 279 356 326 394C336 402 338 401 340 390ZM430 103C428 115 429 118 441 117C522 110 589 42 589 -46C589 -109 551 -160 495 -188C483 -194 481 -194 479 -182Z'
const BASS_CLEF_PATH = 'M252 262C78 262 0 135 0 39C0 -41 42 -110 123 -110C186 -110 229 -66 229 -4C229 60 182 100 133 100C106 100 96 93 83 93C70 93 67 101 67 111C67 151 127 224 229 224C335 224 381 120 381 -37C381 -316 243 -472 10 -605C1 -610 -5 -615 -5 -623C-5 -629 -1 -635 8 -635C13 -635 19 -633 25 -630C271 -510 531 -332 531 -28C531 146 425 262 252 262ZM629 180C598 180 574 156 574 125C574 94 598 70 629 70C660 70 684 94 684 125C684 156 660 180 629 180ZM630 -71C599 -71 576 -94 576 -125C576 -156 599 -179 630 -179C661 -179 684 -156 684 -125C684 -94 661 -71 630 -71Z'

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
      <path
        d={clef === 'treble' ? TREBLE_CLEF_PATH : BASS_CLEF_PATH}
        transform={`translate(${clef === 'treble' ? 76 : 74} ${clef === 'treble' ? 123 : 85}) scale(.076 -.076)`}
        className="clef-vector"
        aria-hidden="true"
      />
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
