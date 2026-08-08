export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export const GENERIC_FORGOT_PASSWORD_MESSAGE = "If that email is registered, we've sent a reset link."

export function canSendPasswordReset(accountAllowed: boolean, ipAllowed: boolean, userExists: boolean) {
  return accountAllowed && ipAllowed && userExists
}

export function isAuthSessionCurrent(
  tokenAuthVersion: unknown,
  user: { authVersion: number; isActive: boolean } | null,
) {
  return typeof tokenAuthVersion === 'number' && Boolean(user?.isActive) && user?.authVersion === tokenAuthVersion
}

const COMMON_PASSWORDS = new Set([
  '123456789012',
  'adminpassword',
  'changeme1234',
  'iloveyou1234',
  'letmeinplease',
  'lifestyleorganiser',
  'password1234',
  'password12345',
  'qwertyuiop12',
  'welcome12345',
])

export const PASSWORD_MIN_CHARACTERS = 12
export const PASSWORD_MAX_UTF8_BYTES = 72

export function validatePassword(password: string): string | null {
  if (Array.from(password).length < PASSWORD_MIN_CHARACTERS) {
    return `Password must be at least ${PASSWORD_MIN_CHARACTERS} characters`
  }

  if (new TextEncoder().encode(password).length > PASSWORD_MAX_UTF8_BYTES) {
    return `Password must be no more than ${PASSWORD_MAX_UTF8_BYTES} UTF-8 bytes`
  }

  if (COMMON_PASSWORDS.has(password.normalize('NFKC').trim().toLowerCase())) {
    return 'Choose a less common password'
  }

  return null
}
