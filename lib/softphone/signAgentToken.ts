/**
 * Server-only agent-token signing for the TrueVow Softphone.
 *
 * Mirrors the softphone service's auth.py exactly:
 *   base64url(agentId).base64url(expiry).base64url(hmac_sha256(agentId.expiry))
 *
 * The signing secret MUST match SOFTPHONE_SIGNING_SECRET in the softphone
 * service. Never import this into client code — it uses the secret.
 */
import crypto from 'crypto'

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64url')

export function signAgentToken(agentId: string, ttlSeconds = 3600): string {
  const secret = process.env.SOFTPHONE_SIGNING_SECRET
  if (!secret) {
    throw new Error('Missing SOFTPHONE_SIGNING_SECRET')
  }
  const expiry = String(Math.floor(Date.now() / 1000) + ttlSeconds)
  const payload = `${agentId}.${expiry}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest()
  return `${b64url(agentId)}.${b64url(expiry)}.${b64url(sig)}`
}
