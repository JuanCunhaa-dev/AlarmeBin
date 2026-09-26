import { useCallback, useEffect, useRef, useState } from 'react'
import { dataUrlFromBlob, getAudioDuration } from '../services/audio'
import type { AlarmAudio } from '../types'
import { recordingConstraints, type RecordingMode } from '../domain/recording'

export type RecorderStatus = 'idle' | 'recording' | 'processing' | 'ready' | 'error'

export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audio, setAudio] = useState<AlarmAudio | null>(null)
  const [error, setError] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  useEffect(() => cleanupStream, [cleanupStream])

  const start = useCallback(async (mode: RecordingMode) => {
    setError('')
    setAudio(null)
    setElapsed(0)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('error')
      setError('A gravação não está disponível neste dispositivo.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: recordingConstraints(mode)
      })
      const track = stream.getAudioTracks()[0]
      if (track) {
        track.contentHint = 'speech'
        await track.applyConstraints(recordingConstraints(mode))
      }
      streamRef.current = stream
      chunksRef.current = []
      const preferred = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType: preferred, audioBitsPerSecond: 192000 })
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data) }
      recorder.onstop = async () => {
        setStatus('processing')
        cleanupStream()
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
          const dataUrl = await dataUrlFromBlob(blob)
          const durationSeconds = await getAudioDuration(dataUrl)
          setAudio({ name: `Gravação ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.webm`, mimeType: blob.type, dataUrl, durationSeconds })
          setStatus('ready')
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Não foi possível processar a gravação.')
          setStatus('error')
        }
      }
      recorder.start(250)
      setStatus('recording')
      const startedAt = Date.now()
      timerRef.current = window.setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 100)
    } catch {
      cleanupStream()
      setStatus('error')
      setError('Permita o acesso ao microfone para gravar sua mensagem.')
    }
  }, [cleanupStream])

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }, [])

  const reset = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    cleanupStream()
    setStatus('idle')
    setElapsed(0)
    setAudio(null)
    setError('')
  }, [cleanupStream])

  return { status, elapsed, audio, error, start, stop, reset }
}
