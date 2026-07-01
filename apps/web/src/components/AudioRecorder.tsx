import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { cn } from '@/lib/cn'

type AudioRecorderProps = {
  /** Called with the final audio blob when the user accepts the recording. */
  onRecorded: (blob: Blob) => void
  /** Max recording duration in seconds. Default 120 (2 min). */
  maxDuration?: number
  className?: string
}

type RecState = 'idle' | 'recording' | 'paused' | 'done'

export function AudioRecorder({
  onRecorded,
  maxDuration = 120,
  className,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
    stopTimer()
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= maxDuration) {
          stopRecording()
          return maxDuration
        }
        return e + 1
      })
    }, 1000)
  }

  const startRecording = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      chunks.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        onRecorded(blob)
        setState('done')
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.current = recorder
      recorder.start(250) // collect data every 250ms
      setState('recording')
      setElapsed(0)
      startTimer()
    } catch {
      setError("Accès au micro refusé. Autorisez l'accès dans les paramètres de votre navigateur.")
    }
  }, [maxDuration, onRecorded])

  const pauseRecording = () => {
    mediaRecorder.current?.pause()
    stopTimer()
    setState('paused')
  }

  const resumeRecording = () => {
    mediaRecorder.current?.resume()
    startTimer()
    setState('recording')
  }

  const stopRecording = useCallback(() => {
    stopTimer()
    mediaRecorder.current?.stop()
  }, [])

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setElapsed(0)
    setState('idle')
    chunks.current = []
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className={cn('rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]', className)}>
      <p className="mb-1 text-sm font-medium text-neutral-900/80 dark:text-white/80">
        Enregistrement vocal du consentement
      </p>
      <p className="mb-4 text-xs text-neutral-900/50 dark:text-white/50">
        Parlez dans votre langue (Fon, Yoruba, Adja, Mina…). L'audio sera scellé avec le document.
      </p>

      {error && (
        <p role="alert" className="mb-3 text-sm text-gandehou-red">{error}</p>
      )}

      {/* Timer display */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <div className={cn(
          'h-3 w-3 rounded-full transition-colors',
          state === 'recording' ? 'animate-pulse bg-gandehou-red' : 'bg-neutral-300 dark:bg-neutral-600',
        )} />
        <span className="font-mono text-2xl font-bold tabular-nums">
          {formatTime(elapsed)}
        </span>
        <span className="text-xs text-neutral-900/40 dark:text-white/40">
          / {formatTime(maxDuration)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full bg-gandehou-green transition-all duration-300"
          style={{ width: `${(elapsed / maxDuration) * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state === 'idle' && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 rounded-2xl bg-gandehou-red px-6 py-3 font-medium text-white outline-none transition-colors hover:bg-gandehou-red/90 focus-visible:ring-4 focus-visible:ring-gandehou-red/30"
          >
            <Mic className="h-5 w-5" />
            Enregistrer
          </button>
        )}

        {state === 'recording' && (
          <>
            <button
              type="button"
              onClick={pauseRecording}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:border-white/10 dark:hover:bg-white/10"
              aria-label="Pause"
            >
              <Pause className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-2xl bg-gandehou-red px-6 py-3 font-medium text-white outline-none transition-colors hover:bg-gandehou-red/90 focus-visible:ring-4 focus-visible:ring-gandehou-red/30"
            >
              <Square className="h-4 w-4" />
              Arrêter
            </button>
          </>
        )}

        {state === 'paused' && (
          <>
            <button
              type="button"
              onClick={resumeRecording}
              className="flex items-center gap-2 rounded-2xl bg-gandehou-green px-6 py-3 font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/30"
            >
              <Play className="h-5 w-5" />
              Reprendre
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:border-white/10 dark:hover:bg-white/10"
              aria-label="Terminer"
            >
              <Square className="h-4 w-4" />
            </button>
          </>
        )}

        {state === 'done' && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-2xl border border-black/10 px-5 py-2.5 font-medium outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:border-white/10 dark:hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            Recommencer
          </button>
        )}
      </div>

      {/* Playback */}
      {state === 'done' && audioUrl && (
        <div className="mt-4 flex items-center justify-center">
          <audio controls src={audioUrl} className="w-full max-w-xs" />
        </div>
      )}
    </div>
  )
}