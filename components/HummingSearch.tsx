'use client'

import { useRef, useState } from 'react'
import { Mic, Waveform, Loader2, Music2, RefreshCw, Square } from 'lucide-react'
import { Music } from '@/types/music'
import { useLanguage } from '@/contexts/LanguageContext'

type HummingSearchProps = {
  onMatch: (track: Music) => void
}

export default function HummingSearch({ onMatch }: HummingSearchProps) {
  const { t } = useLanguage()
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [match, setMatch] = useState<Music | null>(null)

  const stopRecording = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const startRecording = async () => {
    if (isRecording || isProcessing) return
    setError(null)
    setMatch(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await sendForRecognition(blob)
      }

      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
      timeoutRef.current = setTimeout(() => stopRecording(), 10000)
    } catch (err: any) {
      setError(err?.message || 'Microphone not available')
      setIsRecording(false)
    }
  }

  const sendForRecognition = async (blob: Blob) => {
    setIsProcessing(true)
    try {
      const file = new File([blob], 'humming.webm', { type: blob.type })
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/humming', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Could not recognize humming')
      }
      if (data?.track) {
        setMatch(data.track)
        onMatch(data.track)
      } else {
        setError(data?.error || 'No match found')
      }
    } catch (err: any) {
      setError(err?.message || 'Could not recognize humming')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-spotify-light/60 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Waveform size={18} className="text-spotify-green" />
        <p className="text-white font-semibold">{t('startHumming')}</p>
      </div>
      <p className="text-gray-400 text-sm mb-4">{t('hummingHint')}</p>
      <div className="flex items-center gap-3">
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={() => isRecording && stopRecording()}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 transition-all ${
            isRecording ? 'bg-red-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'
          } disabled:opacity-60`}
        >
          {isRecording ? <Square size={16} /> : <Mic size={16} />}
          <span className="text-sm font-semibold">
            {isRecording ? t('recording') : t('hummingCTA')}
          </span>
        </button>
        {isProcessing && (
          <div className="flex items-center gap-2 text-gray-200 text-sm">
            <Loader2 className="animate-spin" size={16} />
            <span>{t('processing')}</span>
          </div>
        )}
        {error && !isProcessing && (
          <button
            onClick={startRecording}
            className="flex items-center gap-1 text-amber-300 text-sm hover:text-white"
          >
            <RefreshCw size={14} />
            <span>{t('retryHumming')}</span>
          </button>
        )}
      </div>
      {error && <p className="text-amber-300 text-xs mt-2">{error}</p>}
      {match && (
        <div className="mt-4 flex items-center gap-3 bg-black/30 border border-gray-800 rounded-xl p-3">
          <Music2 size={18} className="text-spotify-green flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-gray-300 text-xs">{t('hummingResult')}</p>
            <p className="text-white font-semibold truncate">{match.title}</p>
            <p className="text-gray-400 text-sm truncate">{match.artist}</p>
          </div>
          <img src={match.cover} alt={match.title} className="w-12 h-12 rounded object-cover" />
        </div>
      )}
    </div>
  )
}
