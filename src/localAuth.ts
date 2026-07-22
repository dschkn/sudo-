const ACCOUNTS_KEY = 'sudo.accounts.v1'
const SESSION_KEY = 'sudo.session.v1'

export type AuthResult =
  | { ok: true; username: string }
  | { ok: false; message: string }

type StoredAccount = {
  username: string
  passwordHash: string
  createdAt: string
}

type StoredAccounts = Record<string, StoredAccount>

function normalizeUsername(username: string) {
  return username.trim().toLocaleLowerCase()
}

function readAccounts(): StoredAccounts {
  try {
    const value = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '{}')
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

function writeAccounts(accounts: StoredAccounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

async function hashPassword(password: string) {
  const input = new TextEncoder().encode(`sudo-local:${password}`)

  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', input)
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  let hash = 2166136261
  input.forEach((byte) => {
    hash ^= byte
    hash = Math.imul(hash, 16777619)
  })
  return `fallback-${(hash >>> 0).toString(16)}`
}

function validateUsername(username: string) {
  const trimmed = username.trim()
  if (trimmed.length < 3 || trimmed.length > 24) {
    return 'username must be 3–24 characters'
  }
  if (!/^[\p{L}\p{N}_.-]+$/u.test(trimmed)) {
    return 'use letters, numbers, dots, dashes or underscores'
  }
  return null
}

function validatePassword(password: string) {
  if (password.length < 4) return 'password must be at least 4 characters'
  if (password.length > 128) return 'password is too long'
  return null
}

export function getStoredSession() {
  const username = localStorage.getItem(SESSION_KEY)?.trim()
  return username || null
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
}

export async function registerLocalAccount(username: string, password: string): Promise<AuthResult> {
  const usernameError = validateUsername(username)
  if (usernameError) return { ok: false, message: usernameError }

  const passwordError = validatePassword(password)
  if (passwordError) return { ok: false, message: passwordError }

  const key = normalizeUsername(username)
  const accounts = readAccounts()
  if (accounts[key]) return { ok: false, message: 'this username already exists' }

  const displayName = username.trim()
  accounts[key] = {
    username: displayName,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  writeAccounts(accounts)
  localStorage.setItem(SESSION_KEY, displayName)

  return { ok: true, username: displayName }
}

export async function signInLocalAccount(username: string, password: string): Promise<AuthResult> {
  const key = normalizeUsername(username)
  const account = readAccounts()[key]
  if (!account) return { ok: false, message: 'username or password is incorrect' }

  const passwordHash = await hashPassword(password)
  if (passwordHash !== account.passwordHash) {
    return { ok: false, message: 'username or password is incorrect' }
  }

  localStorage.setItem(SESSION_KEY, account.username)
  return { ok: true, username: account.username }
}
