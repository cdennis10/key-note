import { useEffect, useRef, useState } from 'react'
import { ADMIN_PIN, type Student } from '../lib/roster'

export type Identity = { role: 'admin'; name: 'Administrator' } | { role: 'student'; name: string; studentId: string }

export function AccessGate({ students, onAuthenticated }: { students: Student[]; onAuthenticated: (identity: Identity) => void }) {
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('Enter your four-digit PIN to continue.')
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  useEffect(() => { inputs.current[0]?.focus() }, [])

  const attempt = (value = pin) => {
    if (value.length !== 4) { setMessage('Please enter all four digits.'); return }
    if (value === ADMIN_PIN) { onAuthenticated({ role: 'admin', name: 'Administrator' }); return }
    const student = students.find((entry) => entry.pin === value)
    if (student) { onAuthenticated({ role: 'student', name: student.name, studentId: student.id }); return }
    setMessage('That PIN was not recognized. Check the digits or ask your teacher.'); setPin(''); inputs.current[0]?.focus()
  }

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = Array.from({ length: 4 }, (_, position) => pin[position] || '')
    next[index] = digit
    const joined = next.join('')
    setPin(joined)
    if (digit && index < 3) inputs.current[index + 1]?.focus()
    if (digit && index === 3 && joined.length === 4) window.setTimeout(() => attempt(joined), 0)
  }

  const onKey = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !event.currentTarget.value && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === 'Enter') attempt()
  }

  const digits = Array.from({ length: 4 }, (_, index) => pin[index] || '')
  return <main className="access-page">
    <section className="access-card" aria-labelledby="access-title">
      <span className="access-mark">♪</span>
      <p className="eyebrow">Piano Note Trainer</p>
      <h1 id="access-title">Welcome back</h1>
      <p className="access-intro">Enter your classroom PIN to begin practicing.</p>
      <div className="pin-inputs" role="group" aria-label="Four-digit PIN">
        {digits.map((digit, index) => <input key={index} ref={(element) => { inputs.current[index] = element }} aria-label={`PIN digit ${index + 1}`} value={digit} onChange={(event) => setDigit(index, event.target.value)} onKeyDown={(event) => onKey(index, event)} onPaste={(event) => { const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4); if (pasted.length === 4) { event.preventDefault(); setPin(pasted); attempt(pasted) } }} inputMode="numeric" pattern="[0-9]*" maxLength={1} autoComplete="off" />)}
      </div>
      <p className="pin-message" role="status">{message}</p>
      <button className="button button--primary button--large access-submit" onClick={() => attempt()}>Continue →</button>
      <p className="local-notice"><strong>On this device only.</strong> This classroom roster and progress do not sync to other browsers or devices.</p>
    </section>
  </main>
}
