/**
 * POST /api/v1/webchat/[id]/voice
 * 
 * Handle voice audio from customer support webchat widget
 * - Receives audio blob
 * - Transcribes using Deepgram
 * - Creates message with transcription
 * - Returns transcription for display
 */

import { NextRequest, NextResponse } from 'next/server'
import { speechProvider } from '@/lib/integrations/speech-provider-factory'
import { UnifiedWebChatService } from '@/lib/services/unified-webchat-service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    // Transcribe audio using Deepgram
    const transcription = await speechProvider.transcribe({
      audio: audioBuffer,
      language: 'en-US',
      model: 'nova-2',
      punctuate: true,
      diarize: false, // Single speaker for webchat
    })

    // Create message with transcription
    const message = await UnifiedWebChatService.sendMessage(
      conversationId,
      'customer',
      transcription.text,
      undefined
    )

    // Return message with voice transcript metadata
    return NextResponse.json({
      success: true,
      data: {
        ...message,
        metadata: {
          ...message.metadata,
          is_voice_transcript: true,
          transcription_confidence: transcription.confidence,
          transcription_duration: transcription.duration,
        },
      },
    })
  } catch (error: any) {
    console.error('Error processing voice audio:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process voice audio' },
      { status: 500 }
    )
  }
}
