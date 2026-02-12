/**
 * Speech Provider Factory
 * Returns the configured speech-to-text provider (Deepgram, LiveKit, custom, etc.)
 */

import { DeepgramClient } from './deepgram'
import type { SpeechProvider } from '@/lib/interfaces/speech-provider'

const SPEECH_PROVIDER = (process.env.SPEECH_PROVIDER || 'deepgram').toLowerCase()

// Placeholder for LiveKit implementation
class LiveKitClient implements SpeechProvider {
  async transcribe(): Promise<{
    text: string
    confidence: number
    duration: number
    words?: Array<{
      word: string
      start: number
      end: number
      confidence: number
    }>
    speakers?: Array<{
      speaker: number
      start: number
      end: number
      text: string
    }>
  }> {
    throw new Error('LiveKit implementation not yet available')
  }
}

// Placeholder for custom implementation (e.g., from INTAKE service)
class CustomSpeechClient implements SpeechProvider {
  private apiUrl: string

  constructor() {
    this.apiUrl = process.env.CUSTOM_SPEECH_API_URL || ''
  }

  async transcribe(options: {
    audio: Buffer | string
    language?: string
    model?: string
    punctuate?: boolean
    diarize?: boolean
  }) {
    // Call custom INTAKE service or other custom implementation
    const response = await fetch(`${this.apiUrl}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error('Custom speech API error')
    }

    return await response.json()
  }
}

export function getSpeechProvider(): SpeechProvider {
  switch (SPEECH_PROVIDER) {
    case 'livekit':
      return new LiveKitClient()
    case 'custom':
      return new CustomSpeechClient()
    case 'deepgram':
    default:
      return new DeepgramClient()
  }
}

export const speechProvider = getSpeechProvider()
