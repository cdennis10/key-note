import { useEffect, useMemo, useRef, useState } from 'react'
import { MicrophoneInput } from './components/MicrophoneInput'
import { Piano } from './components/Piano'
import { AccessGate, type Identity } from './components/AccessGate'
import { Roster } from './components/Roster'
import { Staff } from './components/Staff'
import { makeChoices, noteFromMidi, pickClef, pickNote, validateTypedAnswer, type Clef, type Note } from './lib/music'
import { finishQuestion, initialScore, type Score } from './lib/session'
import { DEFAULT_SETTINGS, practiceUrl, settingsFromSearch, type Settings } from './lib/sharing'
import { loadRoster, recordQuestion, recordSession, saveRoster, type Student } from './lib/roster'

type Screen = 'setup' | 'practice' | 'summary' | 'roster'
type InputMode = 'microphone' | 'piano'
type Question = { note: Note; clef: Clef; choices: string[] }

const safeLoad = (): Settings => {
  const fromUrl = settingsFromSearch(location.search)
  if (location.search) return fromUrl
  try { const saved = localStorage.getItem('piano-note-trainer:settings'); return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : fromUrl } catch { return fromUrl }
}

function makeQuestion(settings: Settings, previous?: Question): Question {
  const clef = pickClef(settings.clef)
  const note = pickNote(clef, settings.range, previous?.note.midi)
  return { note, clef, choices: makeChoices(note) }
}

function App() {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [roster, setRoster] = useState<Student[]>(loadRoster)
  const [settings, setSettings] = useState<Settings>(safeLoad)
  const [screen, setScreen] = useState<Screen>('setup')
  const [question, setQuestion] = useState(() => makeQuestion(settings))
  const [score, setScore] = useState<Score>(initialScore)
  const [attempted, setAttempted] = useState(false)
  const [assisted, setAssisted] = useState(false)
  const [complete, setComplete] = useState(false)
  const [feedback, setFeedback] = useState('Choose the note you see.')
  const [typed, setTyped] = useState('')
  const [hint, setHint] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('microphone')
  const [missed, setMissed] = useState<string[]>([])
  const [copyState, setCopyState] = useState('Copy practice link')
  const [audioPaused, setAudioPaused] = useState(false)
  const [savedProgress, setSavedProgress] = useState<Score | null>(() => { try { const raw = localStorage.getItem('piano-note-trainer:progress'); return raw ? JSON.parse(raw) : null } catch { return null } })
  const advanceTimer = useRef<number | undefined>(undefined)

  useEffect(() => { try { localStorage.setItem('piano-note-trainer:settings', JSON.stringify(settings)) } catch { /* preferences still work for this visit */ } }, [settings])
  useEffect(() => { if (score.answered) { setSavedProgress(score); try { localStorage.setItem('piano-note-trainer:progress', JSON.stringify(score)) } catch { /* progress remains visible for this visit */ } } }, [score])
  useEffect(() => () => clearTimeout(advanceTimer.current), [])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }))
  const accuracy = score.answered ? Math.round(score.firstTryCorrect / score.answered * 100) : 0
  const total = settings.sessionLength === 'free' ? null : settings.sessionLength
  const activeStudent = identity?.role === 'student' ? roster.find((student) => student.id === identity.studentId) : undefined

  const changeRoster = (students: Student[]) => { setRoster(students); saveRoster(students) }
  const updateActiveStudent = (update: (student: Student) => Student) => {
    if (identity?.role !== 'student') return
    setRoster((current) => {
      const nextRoster = current.map((student) => student.id === identity.studentId ? update(student) : student)
      saveRoster(nextRoster)
      return nextRoster
    })
  }

  const authenticate = (nextIdentity: Identity) => {
    setIdentity(nextIdentity)
    setScreen(nextIdentity.role === 'admin' ? 'roster' : 'setup')
  }

  const start = () => {
    setQuestion(makeQuestion(settings)); setScore(initialScore()); setAttempted(false); setAssisted(false); setComplete(false); setHint(false); setMissed([]); setTyped('')
    setFeedback(settings.difficulty === 'medium' ? 'Type the note name. Octave numbers are not needed.' : settings.difficulty === 'hard' ? 'Play the exact note shown, including its octave.' : 'Choose the note you see.')
    setScreen('practice')
  }

  const markCorrect = (message = 'That’s it — nicely read!') => {
    if (complete) return
    const firstTry = !attempted
    const nextScore = finishQuestion(score, firstTry, assisted)
    setScore(nextScore); setComplete(true); setFeedback(message)
    updateActiveStudent((student) => recordQuestion(student, settings.difficulty, firstTry && !assisted, nextScore.streak))
    if (!firstTry || assisted) setMissed((items) => items.includes(question.note.label) ? items : [...items, question.note.label])
    if (settings.autoAdvance) advanceTimer.current = window.setTimeout(() => next(nextScore), 1100)
  }

  const wrong = (message: string) => {
    setAttempted(true); setFeedback(message); setMissed((items) => items.includes(question.note.label) ? items : [...items, question.note.label])
  }

  const submitLetter = (letter: string) => letter === question.note.letter ? markCorrect() : wrong(`${letter} is a thoughtful try. Look at the line or space and try again.`)

  const submitTyped = () => {
    const result = validateTypedAnswer(typed)
    if (!result.valid) { setFeedback(result.message!); return }
    submitLetter(result.value!); setTyped('')
  }

  const next = (latestScore = score) => {
    if (total && latestScore.answered >= total) { updateActiveStudent(recordSession); setScreen('summary'); return }
    setQuestion((previous) => makeQuestion(settings, previous)); setAttempted(false); setAssisted(false); setComplete(false); setHint(false); setTyped('')
    setFeedback(settings.difficulty === 'medium' ? 'Type one letter, A–G.' : settings.difficulty === 'hard' ? 'Play the note shown.' : 'Choose the note you see.')
  }

  const reveal = () => {
    if (complete) return
    setAssisted(true); setComplete(true); setFeedback(`This note is ${question.note.label}. Find it on the keyboard below.`)
    const nextScore = finishQuestion(score, false, true); setScore(nextScore)
    updateActiveStudent((student) => recordQuestion(student, settings.difficulty, false, 0))
    setMissed((items) => items.includes(question.note.label) ? items : [...items, question.note.label])
  }

  const useHint = () => { setHint(true); setAssisted(true); setFeedback(`Start at the labeled reference note, then count each line and space to the target.`) }

  const hear = () => {
    setAssisted(true); setAudioPaused(true)
    const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain()
    oscillator.type = 'sine'; oscillator.frequency.value = question.note.frequency
    gain.gain.setValueAtTime(0, context.currentTime); gain.gain.linearRampToValueAtTime(.18, context.currentTime + .03); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .8)
    oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .82)
    window.setTimeout(() => { setAudioPaused(false); void context.close() }, 1150)
  }

  const copy = async () => {
    const url = practiceUrl(settings, location.href)
    try { await navigator.clipboard.writeText(url); setCopyState('Link copied!') }
    catch { window.prompt('Copy this practice link:', url); setCopyState('Link ready') }
    window.setTimeout(() => setCopyState('Copy practice link'), 1800)
  }

  useEffect(() => {
    if (screen !== 'practice' || settings.difficulty !== 'easy' || complete) return
    const onKey = (event: KeyboardEvent) => { const index = Number(event.key) - 1; if (index >= 0 && index < 4) submitLetter(question.choices[index]) }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (screen !== 'practice' || settings.difficulty !== 'hard' || inputMode !== 'piano' || complete) return
    const keyMap: Record<string, number> = { a: 60, s: 62, d: 64, f: 65, g: 67, h: 69, j: 71, k: 72 }
    const onKey = (event: KeyboardEvent) => { const midi = keyMap[event.key.toLowerCase()]; if (midi) handlePiano(midi) }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  })

  const handlePiano = (midi: number) => midi === question.note.midi || (settings.anyOctave && midi % 12 === question.note.midi % 12)
    ? markCorrect(`Yes — ${noteFromMidi(midi).label} matches!`)
    : wrong(`${noteFromMidi(midi).label} is not the displayed note. Try moving ${midi < question.note.midi ? 'higher' : 'lower'}.`)

  const learnPanel = useMemo(() => <details className="learn-panel"><summary>Learn the staff</summary><div className="learn-grid">
    <div><strong>Treble clef</strong><p>Lines, bottom to top: <b>E G B D F</b>. Spaces spell <b>F A C E</b>.</p></div>
    <div><strong>Bass clef</strong><p>Lines: <b>G B D F A</b>. Spaces: <b>A C E G</b>.</p></div>
    <div><strong>How to count</strong><p>Each move to the next line or space advances one letter. After G, begin again at A.</p></div>
  </div></details>, [])

  if (!identity) return <div className="app-shell"><AccessGate students={roster} onAuthenticated={authenticate} /><footer id="privacy"><div><strong>Private by design</strong><p>No accounts, analytics, or ads. Classroom data stays in this browser and does not sync between devices.</p></div></footer></div>

  return <div className="app-shell">
    <header className="site-header"><button className="brand" onClick={() => setScreen(identity.role === 'admin' ? 'roster' : 'setup')} aria-label="Key Note home"><span className="brand-mark">♪</span><span>Key Note<small>Read it. Find it. Play it.</small></span></button><div className="account-actions"><span className="user-chip">{identity.role === 'admin' ? 'Admin' : identity.name}</span>{identity.role === 'admin' && screen !== 'roster' && <button className="text-button" onClick={() => setScreen('roster')}>Roster</button>}<button className="text-button" onClick={() => { setIdentity(null); setScreen('setup') }}>Sign out</button></div></header>

    {screen === 'roster' && identity.role === 'admin' && <Roster students={roster} onChange={changeRoster} onPractice={() => setScreen('setup')} />}

    {screen === 'setup' && <main className="setup-page">
      <section className="hero"><p className="eyebrow">{identity.role === 'student' ? `Welcome, ${identity.name}` : 'Administrator practice'}</p><h1>Meet every note<br/><em>with confidence.</em></h1><p>Choose a practice style, then read one clear note at a time. No timer, no pressure.</p>{activeStudent && <div className="student-progress-callout"><strong>{activeStudent.progress.answered}</strong><span>notes practiced</span><strong>{activeStudent.progress.answered ? Math.round(activeStudent.progress.firstTryCorrect / activeStudent.progress.answered * 100) : 0}%</strong><span>first-try accuracy</span></div>}</section>
      <section className="setup-card" aria-labelledby="setup-title"><div className="card-heading"><span>01</span><div><h2 id="setup-title">Set up your practice</h2><p>You can change these any time.</p></div></div>
        <fieldset><legend>How would you like to answer?</legend><div className="segmented three">
          {([['easy','Easy','Choose'],['medium','Medium','Type'],['hard','Hard','Play']] as const).map(([value,title,sub]) => <button type="button" key={value} className={settings.difficulty === value ? 'selected' : ''} onClick={() => updateSetting('difficulty', value)}><strong>{title}</strong><small>{sub}</small></button>)}
        </div></fieldset>
        <div className="setup-row"><fieldset><legend>Clef</legend><div className="segmented">{(['treble','bass','mixed'] as const).map((value) => <button type="button" className={settings.clef === value ? 'selected' : ''} onClick={() => updateSetting('clef', value)} key={value}>{value[0].toUpperCase()+value.slice(1)}</button>)}</div></fieldset>
        <fieldset><legend>Note range</legend><div className="segmented">{(['beginner','expanded'] as const).map((value) => <button type="button" className={settings.range === value ? 'selected' : ''} onClick={() => updateSetting('range', value)} key={value}>{value[0].toUpperCase()+value.slice(1)}</button>)}</div></fieldset></div>
        <fieldset><legend>Session length</legend><div className="segmented">{([10,20,'free'] as const).map((value) => <button type="button" className={settings.sessionLength === value ? 'selected' : ''} onClick={() => updateSetting('sessionLength', value)} key={value}>{value === 'free' ? 'Free practice' : `${value} notes`}</button>)}</div></fieldset>
        {settings.difficulty === 'hard' && <label className="check-row"><input type="checkbox" checked={settings.anyOctave} onChange={(e) => updateSetting('anyOctave', e.target.checked)} /> Accept the correct letter in any octave <small>Off by default for exact pitch practice</small></label>}
        <div className="setup-actions"><button className="button button--primary button--large" onClick={start}>Begin practice <span>→</span></button><button className="button button--ghost" onClick={copy}>{copyState}</button></div>
      </section>
      <section className="range-note"><strong>Exact ranges</strong><p>Beginner stays inside the staff: treble E4–F5; bass G2–A3. Expanded adds nearby ledger notes and middle C: treble C4–A5; bass E2–C4. Natural notes only.</p>{savedProgress && <p><strong>Last local progress:</strong> {savedProgress.firstTryCorrect} of {savedProgress.answered} unassisted first-try answers; best streak {savedProgress.bestStreak}.</p>}</section>
      {learnPanel}
    </main>}

    {screen === 'practice' && <main className="practice-page">
      <div className="practice-top"><button className="back-button" onClick={() => setScreen('setup')}>← Setup</button><div className="progress-copy"><strong>{total ? `Note ${Math.min(score.answered + 1, total)} of ${total}` : `Free practice · ${score.answered} read`}</strong><span>{accuracy}% first-try accuracy · {score.streak} note streak</span></div><label className="auto-toggle"><input type="checkbox" checked={settings.autoAdvance} onChange={(e) => updateSetting('autoAdvance', e.target.checked)} /> Auto-next</label></div>
      {total && <div className="progress-track" aria-label={`${score.answered} of ${total} complete`}><span style={{ width: `${score.answered / total * 100}%` }} /></div>}
      <section className="question-card">
        <div className="question-heading"><p className="eyebrow">{settings.difficulty} · {settings.range}</p><h1>What note is this?</h1></div>
        <Staff note={question.note} clef={question.clef} showHint={hint} />
        <div className="answer-zone">
          {settings.difficulty === 'easy' && <div className="choice-grid">{question.choices.map((choice, index) => <button disabled={complete} className="choice" key={choice} onClick={() => submitLetter(choice)}><kbd>{index + 1}</kbd><span>{choice}</span></button>)}</div>}
          {settings.difficulty === 'medium' && <form className="type-answer" onSubmit={(e) => { e.preventDefault(); submitTyped() }}><label htmlFor="note-input">Type one letter, A–G <small>Octave numbers aren’t needed</small></label><div><input id="note-input" autoFocus maxLength={5} value={typed} disabled={complete} onChange={(e) => setTyped(e.target.value)} autoComplete="off" inputMode="text" /><button className="button button--primary" disabled={complete}>Submit</button></div></form>}
          {settings.difficulty === 'hard' && <div className="hard-mode"><div className="mode-switch" role="group" aria-label="Hard mode input"><button className={inputMode === 'microphone' ? 'selected' : ''} onClick={() => setInputMode('microphone')}>Microphone</button><button className={inputMode === 'piano' ? 'selected' : ''} onClick={() => setInputMode('piano')}>On-screen piano</button></div>
            {inputMode === 'microphone' ? <MicrophoneInput target={question.note} anyOctave={settings.anyOctave} paused={audioPaused || complete} onAttempt={(correct, detected) => correct ? markCorrect(`Yes — I heard ${detected}!`) : wrong(`I heard ${detected}. That’s a clear note, but not the one shown. Try again.`)} /> : <><p className="center-copy">Alternative input mode: click or tap a key. Computer keys A–K play C4–C5.</p><Piano interactive onPlay={handlePiano} /></>}
          </div>}
          <p className={`feedback ${complete ? 'feedback--success' : attempted ? 'feedback--try' : ''}`} role="status">{feedback}</p>
          <div className="learning-actions"><button type="button" className="button button--ghost" disabled={complete || hint} onClick={useHint}>◎ Hint</button><button type="button" className="button button--ghost" onClick={hear}>♫ Hear this note</button><button type="button" className="button button--ghost" disabled={complete} onClick={reveal}>Show answer</button></div>
          {complete && <div className="answer-reveal"><div><span>The answer is</span><strong>{question.note.label}</strong></div><Piano target={question.note} /><button autoFocus className="button button--primary button--large" onClick={() => next()}>Next note →</button></div>}
        </div>
      </section>
      {learnPanel}
    </main>}

    {screen === 'summary' && <main className="summary-page"><section className="summary-card"><span className="summary-icon">♪</span><p className="eyebrow">Session complete</p><h1>Wonderful work.</h1><p>You gave every note your attention. That’s how fluent reading grows.</p><div className="score-grid"><div><strong>{score.firstTryCorrect}/{score.answered}</strong><span>First try</span></div><div><strong>{accuracy}%</strong><span>Accuracy</span></div><div><strong>{score.bestStreak}</strong><span>Best streak</span></div></div>
      {missed.length > 0 ? <div className="review"><strong>Notes to revisit</strong><p>{missed.join(' · ')}</p></div> : <p className="perfect">Every answer was unassisted on the first try!</p>}
      <div className="summary-actions"><button className="button button--primary button--large" onClick={start}>Practice again</button><button className="button button--secondary" onClick={() => { updateSetting('sessionLength','free'); setScreen('setup') }}>Review in free practice</button></div></section></main>}

    <footer id="privacy"><div><strong>Private by design</strong><p>Roster, PINs, preferences, and progress stay in this browser and do not sync between devices. Microphone audio is processed live on this device—never recorded, saved, or uploaded. Your hosting provider may keep standard access logs.</p></div>{identity.role === 'student' && <button className="text-button" onClick={() => { if (activeStudent && window.confirm(`Reset all locally stored progress for ${activeStudent.name}?`)) { changeRoster(roster.map((student) => student.id === activeStudent.id ? { ...student, progress: { answered: 0, firstTryCorrect: 0, bestStreak: 0, sessions: 0, lastPracticed: null, byDifficulty: { easy: 0, medium: 0, hard: 0 } } } : student)); setSavedProgress(null) } }}>Reset my progress</button>}</footer>
  </div>
}

export default App
