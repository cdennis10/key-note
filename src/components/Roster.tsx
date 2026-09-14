import { useMemo, useState } from 'react'
import { ADMIN_PIN, createStudent, emptyProgress, generatePin, validPin, type Student } from '../lib/roster'

export function Roster({ students, onChange, onPractice }: { students: Student[]; onChange: (students: Student[]) => void; onPractice: () => void }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState(() => generatePin(students))
  const [message, setMessage] = useState('')
  const totals = useMemo(() => students.reduce((sum, student) => sum + student.progress.answered, 0), [students])

  const add = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) { setMessage('Enter the student’s name.'); return }
    if (!validPin(pin)) { setMessage('Student PINs must contain exactly four digits.'); return }
    if (pin === ADMIN_PIN || students.some((student) => student.pin === pin)) { setMessage('That PIN is already assigned. Choose another.'); return }
    const nextRoster = [...students, createStudent(name, pin)]
    onChange(nextRoster)
    setName(''); setPin(generatePin(nextRoster))
    setMessage('Student added. Give the PIN directly to the student.')
  }

  const remove = (student: Student) => {
    if (window.confirm(`Remove ${student.name} and all progress stored on this device?`)) onChange(students.filter((entry) => entry.id !== student.id))
  }

  const reset = (student: Student) => {
    if (window.confirm(`Reset all progress for ${student.name}?`)) onChange(students.map((entry) => entry.id === student.id ? { ...entry, progress: emptyProgress() } : entry))
  }

  return <main className="roster-page">
    <section className="roster-heading"><div><p className="eyebrow">Administrator dashboard</p><h1>Student roster</h1><p>Add students, assign a private classroom PIN, and see progress saved in this browser.</p></div><button className="button button--secondary" onClick={onPractice}>Open practice setup</button></section>
    <div className="roster-stats"><div><strong>{students.length}</strong><span>Students</span></div><div><strong>{totals}</strong><span>Notes practiced</span></div><div><strong>{students.reduce((sum, s) => sum + s.progress.sessions, 0)}</strong><span>Sessions completed</span></div></div>
    <section className="add-student-card"><h2>Add a student</h2><form onSubmit={add}><label>Student name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} autoComplete="off" placeholder="First name or classroom label" /></label><label>Four-digit PIN<div className="pin-create"><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} aria-describedby="pin-help" /><button type="button" className="button button--ghost" onClick={() => setPin(generatePin(students))}>Generate</button></div><small id="pin-help">Must be unique. Administrator PIN cannot be assigned.</small></label><button className="button button--primary">Add student</button></form>{message && <p className="form-message" role="status">{message}</p>}</section>
    <section className="student-list" aria-labelledby="students-title"><div className="list-title"><h2 id="students-title">Progress</h2><span>{students.length ? 'First-try accuracy includes unassisted answers only.' : 'Your roster is empty.'}</span></div>
      {students.length === 0 ? <div className="empty-roster"><span>♫</span><h3>No students yet</h3><p>Add the first student above. Their progress will appear here after they practice on this device.</p></div> : <div className="student-table-wrap"><table><thead><tr><th>Student</th><th>PIN</th><th>Notes</th><th>Accuracy</th><th>Best streak</th><th>Last practiced</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{students.map((student) => {
        const accuracy = student.progress.answered ? Math.round(student.progress.firstTryCorrect / student.progress.answered * 100) : 0
        return <tr key={student.id}><td><strong>{student.name}</strong><small>{student.progress.sessions} completed session{student.progress.sessions === 1 ? '' : 's'}</small></td><td><code>{student.pin}</code></td><td>{student.progress.answered}</td><td>{accuracy}%</td><td>{student.progress.bestStreak}</td><td>{student.progress.lastPracticed ? new Date(student.progress.lastPracticed).toLocaleDateString() : 'Not yet'}</td><td><div className="row-actions"><button className="text-button" onClick={() => reset(student)}>Reset</button><button className="text-button danger" onClick={() => remove(student)}>Remove</button></div></td></tr>
      })}</tbody></table></div>}
    </section>
    <aside className="security-note"><strong>About classroom PINs</strong><p>This static app stores the roster and PINs in this browser. PINs provide a simple classroom access gate, not high-security authentication. Do not reuse sensitive personal PINs.</p></aside>
  </main>
}
