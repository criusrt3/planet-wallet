const MIN_PASSWORD_LEN = 4

export function validateWalletLockPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LEN) {
    return `密码至少 ${MIN_PASSWORD_LEN} 位`
  }
  return null
}

export async function hashWalletLockPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyWalletLockPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const hash = await hashWalletLockPassword(password)
  return hash === storedHash
}
