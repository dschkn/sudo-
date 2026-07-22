import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { registerLocalAccount, signInLocalAccount } from './localAuth'

type AuthMode = 'sign-in' | 'register'

type AuthScreenProps = {
  onAuthenticated: (username: string) => void
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setMessage('')
    setPassword('')
    setPasswordRepeat('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    if (mode === 'register' && password !== passwordRepeat) {
      setMessage('passwords do not match')
      return
    }

    setSubmitting(true)
    const result =
      mode === 'register'
        ? await registerLocalAccount(username, password)
        : await signInLocalAccount(username, password)
    setSubmitting(false)

    if (!result.ok) {
      setMessage(result.message)
      return
    }

    onAuthenticated(result.username)
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-label="sudo account">
        <div className="auth-brand">
          <div className="auth-brand-line" aria-hidden="true">
            <span>9 × 9</span>
            <span>quiet mode</span>
            <span>progress saved</span>
          </div>
          <h1 className="auth-logo">sudo</h1>
          <p className="auth-intro">a small sudoku with a very short memory form.</p>
        </div>

        <div className="auth-mode" role="tablist" aria-label="account action">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'sign-in'}
            className={mode === 'sign-in' ? 'is-active' : ''}
            onClick={() => changeMode('sign-in')}
          >
            sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => changeMode('register')}
          >
            register
          </button>
        </div>

        <div className="auth-guide" aria-live="polite">
          {mode === 'register' ? (
            <>
              <p><span>01</span> choose a login</p>
              <p><span>02</span> set a password</p>
              <p><span>03</span> keep your progress</p>
            </>
          ) : (
            <p className="auth-guide-single">
              <span>→</span> use the login and password you created on this device
            </p>
          )}
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>login</span>
            <input
              name="username"
              type="text"
              placeholder={mode === 'register' ? 'choose a login' : 'your login'}
              value={username}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              minLength={3}
              maxLength={24}
              required
            />
          </label>

          <label>
            <span>password</span>
            <input
              name="password"
              type="password"
              placeholder={mode === 'register' ? 'at least 4 characters' : 'your password'}
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={4}
              required
            />
          </label>

          {mode === 'register' && (
            <label>
              <span>repeat password</span>
              <input
                name="password-repeat"
                type="password"
                placeholder="one more time"
                value={passwordRepeat}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPasswordRepeat(event.target.value)}
                autoComplete="new-password"
                minLength={4}
                required
              />
            </label>
          )}

          <p className={`auth-message ${message ? 'is-visible' : ''}`} role="status">
            {message || '\u00a0'}
          </p>

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'one moment…' : mode === 'register' ? 'create my account' : 'continue'}
          </button>
        </form>

        <p className="auth-footnote">
          no email. no ceremony. for now, this browser remembers the account and the game.
        </p>
      </section>
    </main>
  )
}
