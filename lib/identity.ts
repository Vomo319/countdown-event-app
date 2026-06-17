/**
 * Two-Layer Identification System for Data Persistence
 * Layer 1: Device Identity (localStorage) - survives refresh & updates
 * Layer 2: Recovery Key (backup identity) - survives reinstall & device switch
 */

const DEVICE_ID_KEY = 'waiting_for_device_id'
const RECOVERY_KEY_KEY = 'waiting_for_recovery_key'

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function generateRecoveryKey(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let part1 = ''
  for (let i = 0; i < 6; i++) {
    part1 += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  
  const consonants = ['BR', 'CL', 'DR', 'FL', 'FR', 'GR', 'PL', 'PR', 'SC', 'SK', 'SL', 'SM', 'SN', 'SP', 'ST', 'STR', 'SW', 'TR', 'TW', 'WR']
  const vowels = ['A', 'E', 'I', 'O', 'U']
  
  let part2 = ''
  for (let i = 0; i < 2; i++) {
    const cons = consonants[Math.floor(Math.random() * consonants.length)]
    const vowel = vowels[Math.floor(Math.random() * vowels.length)]
    part2 += (cons + vowel).substring(0, 2)
  }
  
  return `${part1}-${part2.substring(0, 4).toUpperCase()}`
}

export function initializeDeviceIdentity(): string {
  if (typeof window === 'undefined') return ''
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = generateUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
    console.log('[v0] Initialized device ID')
  }
  
  let recoveryKey = localStorage.getItem(RECOVERY_KEY_KEY)
  if (!recoveryKey) {
    recoveryKey = generateRecoveryKey()
    localStorage.setItem(RECOVERY_KEY_KEY, recoveryKey)
    console.log('[v0] Created recovery key')
  }
  
  return deviceId
}

export function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(DEVICE_ID_KEY)
}

export function getRecoveryKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(RECOVERY_KEY_KEY)
}

export function restoreFromRecoveryKey(key: string): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(RECOVERY_KEY_KEY)
  if (stored === key.toUpperCase()) {
    localStorage.setItem(DEVICE_ID_KEY, generateUUID())
    return true
  }
  return false
}
