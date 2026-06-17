import { useEffect, useState } from 'react'

const CLIENT_USER_ID_KEY = 'client_user_id'

/**
 * Get or create a stable user identity on the client.
 * This is used as a fallback when there's no authenticated user.
 * The ID persists across refreshes, browser restarts, and PWA launches.
 */
export function getOrCreateClientUserId(): string {
  if (typeof window === 'undefined') return ''

  let id = localStorage.getItem(CLIENT_USER_ID_KEY)
  if (!id) {
    // Generate a UUID-like identifier (using crypto if available, else random)
    id = crypto.randomUUID?.() || `client-${Date.now()}-${Math.random().toString(36).substring(7)}`
    localStorage.setItem(CLIENT_USER_ID_KEY, id)
    console.log('[v0] Generated new client user ID:', id.substring(0, 12))
  }
  return id
}

/**
 * React hook for getting the stable user identity.
 * Waits for client hydration before returning the ID.
 */
export function useUserId() {
  const [userId, setUserId] = useState<string>('')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const id = getOrCreateClientUserId()
    setUserId(id)
    setIsReady(true)
  }, [])

  return { userId, isReady }
}
