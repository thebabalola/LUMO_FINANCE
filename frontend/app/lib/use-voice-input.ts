'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal typings for the Web Speech API — not yet in TypeScript's DOM lib.
interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: SpeechRecognitionAlternativeLike
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

interface SpeechRecognitionErrorEventLike {
  error: string
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

interface UseVoiceInputOptions {
  /** Called with the accumulated transcript as the user speaks. */
  onTranscript: (transcript: string) => void
  /** Called when recognition fails (mic denied, no speech, unsupported...). */
  onError: (userFacingMessage: string) => void
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  // Keep the latest callbacks without re-creating the recognition session.
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)
  onTranscriptRef.current = onTranscript
  onErrorRef.current = onError

  useEffect(() => {
    setIsSupported(getSpeechRecognitionConstructor() !== null)
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor()
    if (!SpeechRecognitionCtor) {
      onErrorRef.current(
        'Voice input is not supported in this browser. Try Chrome or Edge.'
      )
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-NG'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let combinedTranscript = ''
      for (let resultIndex = 0; resultIndex < event.results.length; resultIndex++) {
        combinedTranscript += event.results[resultIndex][0].transcript
      }
      onTranscriptRef.current(combinedTranscript.trimStart())
    }

    recognition.onerror = (event) => {
      const messageByErrorCode: Record<string, string> = {
        'not-allowed': 'Microphone access was blocked. Allow it in your browser settings.',
        'no-speech': "Didn't catch that — try speaking again.",
        'audio-capture': 'No microphone found. Check that one is connected.',
        network: 'Voice recognition needs an internet connection.',
      }
      onErrorRef.current(
        messageByErrorCode[event.error] ?? 'Voice input failed. Please try again.'
      )
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return { isListening, isSupported, toggleListening }
}
