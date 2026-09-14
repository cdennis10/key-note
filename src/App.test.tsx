import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

async function openSetupAsAdmin() {
  const inputs = screen.getAllByLabelText(/PIN digit/)
  ;['0', '8', '4', '2'].forEach((digit, index) => fireEvent.change(inputs[index], { target: { value: digit } }))
  fireEvent.click(await screen.findByRole('button', { name: 'Open practice setup' }))
}

async function enterPin(pin: string) {
  const inputs = screen.getAllByLabelText(/PIN digit/)
  pin.split('').forEach((digit, index) => fireEvent.change(inputs[index], { target: { value: digit } }))
}

describe('app practice flows', () => {
  beforeEach(() => {
    localStorage.clear()
    history.replaceState({}, '', '/')
  })

  it('starts with the requested child-friendly defaults', async () => {
    render(<App />)
    await openSetupAsAdmin()
    expect(screen.getByRole('button', { name: /Easy\s*Choose/i })).toHaveClass('selected')
    expect(screen.getByRole('button', { name: 'Treble' })).toHaveClass('selected')
    expect(screen.getByRole('button', { name: 'Beginner' })).toHaveClass('selected')
    expect(screen.getByRole('button', { name: '10 notes' })).toHaveClass('selected')
  })

  it('offers helpful typed validation without completing the question', async () => {
    render(<App />)
    await openSetupAsAdmin()
    fireEvent.click(screen.getByRole('button', { name: /Medium\s*Type/i }))
    fireEvent.click(screen.getByRole('button', { name: /Begin practice/i }))
    const input = screen.getByRole('textbox', { name: /Type one letter/i })
    fireEvent.change(input, { target: { value: 'C4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.getByRole('status')).toHaveTextContent('Enter one letter from A to G')
    expect(screen.queryByText('The answer is')).not.toBeInTheDocument()
  })

  it('does not request the microphone on load and keeps piano fallback usable', async () => {
    const getUserMedia = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
    render(<App />)
    await openSetupAsAdmin()
    fireEvent.click(screen.getByRole('button', { name: /Hard\s*Play/i }))
    fireEvent.click(screen.getByRole('button', { name: /Begin practice/i }))
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Enable microphone' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'On-screen piano' }))
    expect(screen.getByRole('group', { name: /On-screen piano/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^[A-G][2-5]/ }).some((button) => !button.hasAttribute('disabled'))).toBe(true)
  })

  it('handles denied microphone permission with a usable fallback', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: class {} })
    render(<App />)
    await openSetupAsAdmin()
    fireEvent.click(screen.getByRole('button', { name: /Hard\s*Play/i }))
    fireEvent.click(screen.getByRole('button', { name: /Begin practice/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Enable microphone' }))
    expect(await screen.findByText(/permission was not granted/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'On-screen piano' })).toBeEnabled()
  })

  it('lets an administrator add a student and tracks that student’s answer', async () => {
    render(<App />)
    await enterPin('0842')
    await screen.findByRole('heading', { name: 'Student roster' })
    fireEvent.change(screen.getByRole('textbox', { name: 'Student name' }), { target: { value: 'Jordan' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Four-digit PIN/i }), { target: { value: '1357' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add student' }))
    expect(screen.getByText('Jordan')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    await enterPin('1357')
    expect(await screen.findByText('Welcome, Jordan')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Begin practice/i }))
    const staff = screen.getByRole('img', { name: /on the treble staff/i })
    const answer = staff.getAttribute('aria-label')![0]
    const correctChoice = screen.getAllByRole('button').find((button) => button.classList.contains('choice') && button.textContent?.endsWith(answer))!
    fireEvent.click(correctChoice)
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    await enterPin('0842')
    const row = (await screen.findByText('Jordan')).closest('tr')!
    expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('1')
    expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('100%')
  })
})
