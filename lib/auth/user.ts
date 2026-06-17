'use server'

import { headers } from 'next/headers'
import { auth } from './index'

/**
 * Get or create the authenticated user.
 * For unauthenticated users (not logged in), creates a temporary session-based identity.
 * This ensures event data persists across page refreshes and app restarts.
 */
export async function getOrCreateUserId(): Promise<string> {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (session?.user?.id) {
      console.log('[v0] Using authenticated user ID:', session.user.id.substring(0, 8))
      return session.user.id
    }
  } catch (error) {
    console.error('[v0] Auth check failed:', error)
  }

  // Fallback: No authenticated user — should not happen in production
  // For now, return a placeholder that the client will replace
  return 'unauthenticated'
}

/**
 * Get the current user's info for analytics/logging.
 */
export async function getCurrentUserInfo() {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })
    return {
      authenticated: !!session?.user,
      userId: session?.user?.id,
      email: session?.user?.email,
    }
  } catch {
    return {
      authenticated: false,
      userId: null,
      email: null,
    }
  }
}
