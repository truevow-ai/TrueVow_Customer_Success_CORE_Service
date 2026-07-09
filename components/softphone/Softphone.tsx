'use client'

/**
 * Softphone — a persistent, docked softphone widget.
 *
 * Mount this ONCE in the dashboard layout shell (not on a page route) so it
 * stays alive across navigation. While mounted it keeps the agent's Voice
 * device registered and polls SMS, so calls/texts are never missed.
 *
 * It fetches a signed agent token from /api/softphone/token (which identifies
 * the logged-in Clerk user) and hands it to the softphone iframe, refreshing
 * the token before it expires.
 *
 * Requires NEXT_PUBLIC_SOFTPHONE_URL (e.g. https://truevow-softphone.fly.dev).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'

const SOFTPHONE_URL = process.env.NEXT_PUBLIC_SOFTPHONE_URL || ''
// Refresh the agent token every 45 min (server TTL is 60 min).
const TOKEN_REFRESH_MS = 45 * 60 * 1000

export function Softphone() {
  const { isSignedIn, user } = useUser()
  const [open, setOpen] = useState(true)
  const [ready, setReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const pushToken = useCallback(async () => {
    if (!SOFTPHONE_URL || !iframeRef.current?.contentWindow) return
    try {
      const res = await fetch('/api/softphone/token', { cache: 'no-store' })
      if (!res.ok) return
      const { token } = await res.json()
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'truevow-auth',
          token,
          agentName: user?.fullName || user?.primaryEmailAddress?.emailAddress || '',
        },
        SOFTPHONE_URL
      )
    } catch {
      /* transient; next refresh retries */
    }
  }, [user])

  // Push a fresh token once the iframe is ready, then on an interval.
  useEffect(() => {
    if (!ready || !isSignedIn) return
    pushToken()
    const id = setInterval(pushToken, TOKEN_REFRESH_MS)
    return () => clearInterval(id)
  }, [ready, isSignedIn, pushToken])

  if (!isSignedIn || !SOFTPHONE_URL) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {open && (
        <iframe
          ref={iframeRef}
          title="TrueVow Softphone"
          src={`${SOFTPHONE_URL}/`}
          allow="microphone; autoplay"
          onLoad={() => setReady(true)}
          style={{
            width: 360,
            height: 600,
            border: 'none',
            borderRadius: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
            background: '#0f172a',
          }}
        />
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Hide softphone' : 'Show softphone'}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: '#2563eb',
          color: '#fff',
          fontSize: 24,
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
        }}
      >
        {open ? '▾' : '☎'}
      </button>
    </div>
  )
}
