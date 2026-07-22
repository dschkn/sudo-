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
          <p className="auth-eyebrow">a small sudoku</p>
          <h1 className="auth-logo">sudo</h1>
          <p className="auth-intro">quiet grids. your progress, kept.</p>
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

        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>username</span>
            <input
              name="username"
              type="text"
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
            {submitting ? 'one moment…' : mode === 'register' ? 'create account' : 'continue'}
          </button>
        </form>

        <p className="auth-footnote">
          no email. no ceremony. this device remembers the account for now.
        </p>
      </section>
    </main>
  )
}
