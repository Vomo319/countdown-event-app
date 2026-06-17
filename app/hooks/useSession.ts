'use client'

import { useEffect, useState } from 'react'

const SESSION_KEY = 'countdown_session_id'
const RECOVERY_KEY = 'countdown_recovery_key'

/**
 * Core session hook — single source of truth for user identity
 * 
 * - Generates a persistent session ID on first visit (XXXX-XXXX-XXXX format)
 * - Recovery key IS the session ID (same value)
 * - All events in DB are linked to this session ID
 * - Restoring means: swap session ID, reload app, events appear
 */
export function useSession() {
  const [sessionId, setSessionId] = useState<string>('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Get or create session ID (runs only on client)
    let sid = localStorage.getItem(SESSION_KEY)
    
    if (!sid) {
      // First time — generate a new session ID
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const parts = Array.from({ length: 3 }, () =>
        Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      )
      sid = parts.join('-')
      
      localStorage.setItem(SESSION_KEY, sid)
      localStorage.setItem(RECOVERY_KEY, sid)
    }
    
    setSessionId(sid)
    setLoaded(true)
  }, [])

  const getRecoveryKey = () => localStorage.getItem(RECOVERY_KEY) || sessionId

  const restore = (recoveryKey: string) => {
    const trimmed = recoveryKey.trim().toUpperCase()
    localStorage.setItem(SESSION_KEY, trimmed)
    localStorage.setItem(RECOVERY_KEY, trimmed)
    // Reload to fetch events for this session
    window.location.reload()
  }

  return {
    sessionId,
    loaded,
    recoveryKey: getRecoveryKey(),
    restore
  }
}

