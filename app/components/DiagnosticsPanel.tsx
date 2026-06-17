'use client'

import React from 'react'
import { useUserId } from '@/lib/hooks/useUserId'

interface DiagnosticsProps {
  userId: string
  isReady: boolean
  eventCount: number
  isLoaded: boolean
}

export function DiagnosticsPanel({ userId, isReady, eventCount, isLoaded }: DiagnosticsProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const clientId = React.useMemo(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('client_user_id') || 'not set'
  }, [])

  const isNewUser = React.useMemo(() => {
    if (typeof window === 'undefined') return null
    const created = localStorage.getItem('user_identity_created_at')
    if (!created) return null
    const ageMs = Date.now() - parseInt(created, 10)
    return ageMs < 60000 // less than 1 minute
  }, [])

  return (
    <details
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxWidth: '300px',
        cursor: 'pointer',
      }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
        🔍 Diagnostics {!isReady ? '⏳' : isLoaded ? '✅' : '⚠️'}
      </summary>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div>
          <strong>User Identity:</strong>
          <div style={{ color: userId ? '#4ade80' : '#ef4444' }}>
            {isReady ? (
              <>
                {userId.substring(0, 16)}...
                {isNewUser && ' 🆕 (New)'}
              </>
            ) : (
              'Initializing...'
            )}
          </div>
        </div>

        <div>
          <strong>Event Status:</strong>
          <div style={{ color: isLoaded ? '#4ade80' : '#fbbf24' }}>
            {isLoaded ? `✓ ${eventCount} events loaded` : '⏳ Loading events...'}
          </div>
        </div>

        {showDetails && (
          <>
            <div style={{ borderTop: '1px solid #555', paddingTop: '6px', marginTop: '6px' }}>
              <strong>Technical Details:</strong>
            </div>

            <div>
              <strong>Client ID (localStorage):</strong>
              <div style={{ wordBreak: 'break-all', fontSize: '10px' }}>{clientId}</div>
            </div>

            <div>
              <strong>Ready States:</strong>
              <div>Identity Ready: {isReady ? '✓' : '✗'}</div>
              <div>Events Loaded: {isLoaded ? '✓' : '✗'}</div>
            </div>

            <div>
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  marginTop: '8px',
                }}
              >
                Clear All & Reload
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            marginTop: '8px',
          }}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
    </details>
  )
}
