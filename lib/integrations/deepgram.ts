/**
 * Deepgram Speech-to-Text Integration
 * Converts voice/audio to text for call transcriptions
 * Implements SpeechProvider interface for abstraction
 */

import type { SpeechProvider } from '@/lib/interfaces/speech-provider'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || ''

export class DeepgramClient implements SpeechProvider {
  private apiKey: string
  private baseUrl: string = 'https://api.deepgram.com/v1'

  constructor(apiKey: string = DEEPGRAM_API_KEY) {
    this.apiKey = apiKey
  }

  /**
   * Transcribe audio from URL or buffer
   */
  async transcribe(options: {
    audio: Buffer | string // Audio file buffer or URL
    language?: string
    model?: string
    punctuate?: boolean
    diarize?: boolean
  }): Promise<{
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
    const audioUrl = typeof options.audio === 'string' ? options.audio : undefined
    const audioBuffer = typeof options.audio === 'object' ? options.audio : undefined
    if (!this.apiKey) {
      throw new Error('Deepgram API key not configured')
    }

    const params = new URLSearchParams()
    if (audioUrl) {
      params.append('url', audioUrl)
    }
    if (options.language) params.append('language', options.language)
    if (options.model) params.append('model', options.model)
    params.append('punctuate', (options.punctuate ?? true).toString())
    if (options.diarize) params.append('diarize', 'true')

    const headers: HeadersInit = {
      'Authorization': `Token ${this.apiKey}`,
    }

    if (audioBuffer) {
      headers['Content-Type'] = 'audio/*'
    } else {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(
      `${this.baseUrl}/listen?${params.toString()}`,
      {
        method: 'POST',
        headers,
        body: audioBuffer ? new Uint8Array(audioBuffer) : undefined,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Deepgram API error: ${response.statusText} - ${error}`)
    }

    const data = await response.json()

    // Extract transcription from Deepgram response
    const results = data.results?.channels?.[0]?.alternatives?.[0]
    if (!results) {
      throw new Error('No transcription results found')
    }

    // Calculate duration from words if available
    const duration = results.words && results.words.length > 0
      ? results.words[results.words.length - 1].end
      : 0

    return {
      text: results.transcript || '',
      confidence: results.confidence || 0,
      duration,
      words: results.words || [],
      speakers: results.speakers || undefined,
    }
  }

  /**
   * Stream transcription (real-time) - Optional implementation
   */
  async streamTranscribe?(options: {
    audioStream: ReadableStream
    language?: string
    onTranscript: (text: string) => void
    onError: (error: Error) => void
  }): Promise<{
    stop: () => void
  }> {
    // Deepgram streaming implementation would go here
    // For now, return a placeholder
    throw new Error('Stream transcription not yet implemented for Deepgram')
  }

  /**
   * Text-to-Speech - Not supported by Deepgram
   */
  async synthesize?(): Promise<never> {
    throw new Error('Text-to-Speech not supported by Deepgram')
  }
}

export const deepgramClient = new DeepgramClient()

