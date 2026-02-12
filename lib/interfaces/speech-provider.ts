/**
 * Speech-to-Text Provider Interface
 * Abstraction layer for different speech providers (Deepgram, LiveKit, custom, etc.)
 */

export interface SpeechProvider {
  /**
   * Transcribe audio to text
   */
  transcribe(options: {
    audio: Buffer | string // Audio file buffer or URL
    language?: string
    model?: string
    punctuate?: boolean
    diarize?: boolean // Speaker diarization
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
  }>

  /**
   * Stream transcription (real-time)
   */
  streamTranscribe?(options: {
    audioStream: ReadableStream
    language?: string
    onTranscript: (text: string) => void
    onError: (error: Error) => void
  }): Promise<{
    stop: () => void
  }>

  /**
   * Text-to-Speech (if provider supports it)
   */
  synthesize?(options: {
    text: string
    voice?: string
    language?: string
  }): Promise<{
    audio: Buffer
    format: string
  }>
}
