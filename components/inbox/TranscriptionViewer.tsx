'use client'

import { useState } from 'react'
import { Card } from '@/components/shared/Card'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Play, Pause, Download, Search, User, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Speaker {
  speaker: number
  start: number
  end: number
  text: string
}

interface Transcription {
  message_id: string
  ticket_id: string
  ticket_subject: string | null
  customer_email: string
  transcription_text: string
  confidence: number
  duration: number
  speakers?: Speaker[]
  recording_url?: string
  call_id?: string
  created_at: string
}

interface TranscriptionViewerProps {
  messageId: string
  transcription: Transcription
  onClose?: () => void
}

export function TranscriptionViewer({
  messageId,
  transcription,
  onClose,
}: TranscriptionViewerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const highlightText = (text: string, search: string) => {
    if (!search) return text

    const parts = text.split(new RegExp(`(${search})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const filteredSpeakers = transcription.speakers?.filter((speaker) =>
    searchTerm
      ? speaker.text.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  )

  const getSpeakerLabel = (speakerNumber: number) => {
    // Speaker 0 is typically the customer, 1 is the agent
    return speakerNumber === 0 ? 'Customer' : `Agent ${speakerNumber}`
  }

  const getSpeakerColor = (speakerNumber: number) => {
    return speakerNumber === 0
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800'
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Call Transcription</h3>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(transcription.created_at), { addSuffix: true })}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              Duration: {formatTime(transcription.duration)}
            </span>
          </div>
          <Badge className={transcription.confidence >= 0.9 ? 'bg-green-100 text-green-800' : ''}>
            {Math.round(transcription.confidence * 100)}% confidence
          </Badge>
          {transcription.recording_url && (
            <a
              href={transcription.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Download className="h-4 w-4" />
              <span>Download Recording</span>
            </a>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transcription..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Transcription Text */}
        <div className="space-y-4">
          {transcription.speakers && transcription.speakers.length > 0 ? (
            // Speaker diarization view
            <div className="space-y-3">
              {filteredSpeakers?.map((speaker, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSpeakerColor(speaker.speaker)}>
                      <User className="h-3 w-3 mr-1" />
                      {getSpeakerLabel(speaker.speaker)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTime(speaker.start)} - {formatTime(speaker.end)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {searchTerm
                      ? highlightText(speaker.text, searchTerm)
                      : speaker.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            // Plain text view
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {searchTerm
                  ? highlightText(transcription.transcription_text, searchTerm)
                  : transcription.transcription_text}
              </p>
            </div>
          )}
        </div>

        {/* Ticket Info */}
        {transcription.ticket_subject && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Related Ticket</p>
            <p className="text-sm font-medium text-gray-900">{transcription.ticket_subject}</p>
            <p className="text-xs text-gray-500">{transcription.customer_email}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
