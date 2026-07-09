/**
 * GET /api/softphone/token
 *
 * Returns a short-lived HMAC-signed agent token for the logged-in Clerk user,
 * which the Softphone widget exchanges with the softphone service for a Twilio
 * Voice access token. Requires SOFTPHONE_SIGNING_SECRET (shared with the
 * softphone service) and NEXT_PUBLIC_SOFTPHONE_URL.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { signAgentToken } from '@/lib/softphone/signAgentToken'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = signAgentToken(userId)
    return NextResponse.json({ token })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Signing failed' },
      { status: 500 }
    )
  }
}
