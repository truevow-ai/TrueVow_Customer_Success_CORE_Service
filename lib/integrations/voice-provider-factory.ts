/**
 * Voice Provider Factory
 * Returns the configured voice provider (Twilio, Plivo, etc.)
 */

import { TwilioClient } from './twilio'
import { PlivoClient } from './plivo'
import type { VoiceProvider } from '@/lib/interfaces/voice-provider'

const VOICE_PROVIDER = (process.env.VOICE_PROVIDER || 'twilio').toLowerCase()

export function getVoiceProvider(): VoiceProvider {
  switch (VOICE_PROVIDER) {
    case 'plivo':
      return new PlivoClient()
    case 'twilio':
    default:
      return new TwilioClient()
  }
}

export const voiceProvider = getVoiceProvider()
