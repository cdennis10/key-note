import { useCallback, useEffect, useRef, useState } from 'react'
import { detectPitch } from '../lib/pitch'
import { updateAttemptGate, type AttemptGateState } from '../lib/session'
import { frequencyToMidi, noteNameFromAnyMidi, pitchResult, type Note } from '../lib/music'

type MicState = 'needed' | 'starting' | 'listening' | 'sound' | 'uncertain' | 'denied' | 'unavailable' | 'paused'

export function MicrophoneInput({ target, anyOctave, paused, onAttempt }: { target: Note; anyOctave: boolean; paused: boolean; onAttempt: (correct: boolean, detected: string) => void }) {
  const [state, setState] = useState<MicState>('needed')
  const [detail, setDetail] = useState('Microphone access starts only when you choose.')
  const [level, setLevel] = useState(0)
  const resources = useRef<{ stream: MediaStream; context: AudioContext; frame: number; lastAnalysis: number } | null>(null)
  const gate = useRef<AttemptGateState>({ sounding: false, candidate: null, since: 0, quietSince: null })
  const targetRef = useRef(target); targetRef.current = target
  const pausedRef = useRef(paused); pausedRef.current = paused
  const onAttemptRef = useRef(onAttempt); onAttemptRef.current = onAttempt

  const stop = useCallback(() => {
    const current = resources.current
    if (current) { cancelAnimationFrame(current.frame); current.stream.getTracks().forEach((track) => track.stop()); void current.context.close(); resources.current = null }
    setLevel(0); setState('needed'); setDetail('Listening stopped. Choose Enable microphone to resume.')
  }, [])

  useEffect(() => stop, [stop])
  useEffect(() => {
    const hide = () => { if (document.hidden && resources.current) stop() }
    document.addEventListener('visibilitychange', hide)
    return () => document.removeEventListener('visibilitychange', hide)
  }, [stop])

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) { setState('unavailable'); setDetail('Microphone pitch detection is not supported here. Use the on-screen piano instead.'); return }
    if (!window.isSecureContext && location.hostname !== 'localhost') { setState('unavailable'); setDetail('Microphone access requires a secure HTTPS page. Use the on-screen piano instead.'); return }
    setState('starting'); setDetail('Waiting for microphone permission…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false })
      const context = new AudioContext()
      await context.resume()
      const analyser = context.createAnalyser(); analyser.fftSize = 4096
      context.createMediaStreamSource(stream).connect(analyser)
      const buffer = new Float32Array(analyser.fftSize)
      const current = { stream, context, frame: 0, lastAnalysis: 0 }; resources.current = current
      setState('listening'); setDetail('Listening… play one note at a time and let it ring briefly.')
      const loop = () => {
        if (resources.current !== current) return
        const now = performance.now()
        if (pausedRef.current) { setLevel(0); setState('paused'); setDetail('Listening is paused while the app plays sound.'); gate.current = { sounding: false, candidate: null, since: now, quietSince: null }; current.frame = requestAnimationFrame(loop); return }
        if (now - current.lastAnalysis < 50) { current.frame = requestAnimationFrame(loop); return }
        current.lastAnalysis = now
        analyser.getFloatTimeDomainData(buffer)
        const estimate = detectPitch(buffer, context.sampleRate)
        setLevel(Math.round(Math.min(100, Math.max(0, (estimate.rms - 0.002) / 0.078 * 100))))
        if (!estimate.frequency) {
          const hadSound = estimate.rms >= 0.006
          setState(hadSound ? 'uncertain' : 'listening')
          setDetail(hadSound ? 'I hear sound, but the pitch is uncertain. Hold one clear note or move closer.' : 'Listening… play one note at a time.')
          gate.current = updateAttemptGate(gate.current, null, estimate.confidence, now).state
        } else {
          const result = pitchResult(estimate.frequency, targetRef.current.midi, anyOctave)
          const rounded = Math.round(frequencyToMidi(estimate.frequency))
          const update = updateAttemptGate(gate.current, rounded, estimate.confidence, now)
          gate.current = update.state
          setState('sound'); setDetail(`Sound detected: ${noteNameFromAnyMidi(rounded)}. Hold it steady…`)
          if (update.accepted !== null) onAttemptRef.current(result.correct, noteNameFromAnyMidi(rounded))
        }
        current.frame = requestAnimationFrame(loop)
      }
      loop()
    } catch (error) {
      const denied = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      setState(denied ? 'denied' : 'unavailable')
      setDetail(denied ? 'Microphone permission was not granted. You can retry after changing browser permissions, or use the on-screen piano.' : 'The microphone could not start. Check that it is connected, or use the on-screen piano.')
    }
  }

  return <section className="mic-panel" aria-live="polite">
    <div className={`mic-status mic-status--${state}`}><span className="status-dot" /> <strong>{state === 'needed' ? 'Permission needed' : state === 'starting' ? 'Starting' : state === 'listening' ? 'Listening' : state === 'sound' ? 'Sound detected' : state === 'uncertain' ? 'Uncertain pitch' : state === 'paused' ? 'Paused' : 'Microphone unavailable'}</strong></div>
    <div className="input-meter" role="meter" aria-label="Microphone input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level}><span style={{ width: `${level}%` }} /></div>
    <span className="meter-label">Input level</span>
    <p>{detail}</p>
    {resources.current ? <button className="button button--secondary" type="button" onClick={stop}>Stop listening</button> : <button className="button button--primary" type="button" onClick={start}>Enable microphone</button>}
    <p className="microcopy">Audio is analyzed on this device. It is never recorded, saved, or uploaded.</p>
  </section>
}
