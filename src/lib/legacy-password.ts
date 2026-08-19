import { pbkdf2, timingSafeEqual } from 'crypto'

/**
 * Payload CMS hashed passwords with PBKDF2 and kept the salt in its own column.
 * Those rows survived the move to Drizzle + bcrypt, so logins have to accept
 * them once and upgrade them on the way through - otherwise every account
 * created before the migration is permanently locked out.
 *
 * Parameters match Payload's generatePasswordSaltHash: PBKDF2-SHA256, 25000
 * iterations, 512-byte key, salt and hash both stored as hex.
 */
const ITERATIONS = 25000
const KEY_LENGTH = 512
const DIGEST = 'sha256'

export function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$/.test(hash)
}

export function verifyLegacyPassword(
  password: string,
  salt: string,
  hash: string
): Promise<boolean> {
  return new Promise((resolve) => {
    pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (error, derived) => {
      if (error) {
        resolve(false)
        return
      }

      const expected = Buffer.from(hash, 'hex')
      if (expected.length !== derived.length) {
        resolve(false)
        return
      }

      resolve(timingSafeEqual(derived, expected))
    })
  })
}
