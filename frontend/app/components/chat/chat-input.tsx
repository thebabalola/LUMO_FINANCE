'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Mic, MicOff, Send } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { useVoiceInput } from '@/lib/use-voice-input'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const { inputValue, setInputValue } = useChatStore()
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { message: '' },
  })

  const { isListening, isSupported, toggleListening } = useVoiceInput({
    onTranscript: (transcript) => setInputValue(transcript),
    onError: (userFacingMessage) =>
      toast.error(userFacingMessage, {
        style: {
          background: '#3A0D12',
          color: '#FCECDC',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }),
  })

  // Sync store value to form when store value changes (e.g. from quick actions)
  useEffect(() => {
    setValue('message', inputValue)
  }, [inputValue, setValue])

  const onSubmit = (data: { message: string }) => {
    if (data.message.trim()) {
      onSendMessage(data.message)
      setInputValue('')
      reset()
    }
  }

  const handleChipClick = (chip: string) => {
    onSendMessage(chip)
  }

  return (
    <div className="p-4 bg-white/5 border-t border-white/5 backdrop-blur-md z-20">
      <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar">
        {['Send ₦10k to John', 'Buy ₦1,000 Airtime', 'Pay DSTV bill'].map((chip, index) => (
          <motion.button
            key={chip}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.08, duration: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            disabled={disabled}
            onClick={() => handleChipClick(chip)}
            className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 hover:border-ember/30 border border-white/10 text-xs font-medium text-cream transition-colors disabled:opacity-50"
          >
            {chip}
          </motion.button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="relative flex items-center">
        <Input
          {...register('message', {
            onChange: (e) => setInputValue(e.target.value)
          })}
          disabled={disabled}
          autoComplete="off"
          placeholder={
            isListening ? 'Listening…' : disabled ? 'Processing...' : 'Type a message...'
          }
          className="pr-24 bg-brown-light border-white/10 rounded-full focus-visible:ring-ember/50 transition-shadow duration-300 focus-visible:shadow-ember-glow"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <motion.button
            type="button"
            onClick={toggleListening}
            whileTap={{ scale: 0.88 }}
            animate={
              isListening
                ? { scale: [1, 1.12, 1], transition: { duration: 1.2, repeat: Infinity } }
                : { scale: 1 }
            }
            disabled={disabled}
            className={`p-2 transition-colors rounded-full disabled:opacity-50 ${
              isListening
                ? 'bg-danger text-white shadow-lg shadow-danger/40'
                : 'text-cream/50 hover:text-ember hover:bg-white/5'
            }`}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            title={
              isSupported
                ? isListening
                  ? 'Stop listening'
                  : 'Speak your message'
                : 'Voice input needs Chrome or Edge'
            }
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.88 }}
            disabled={disabled}
            className="p-2 bg-ember hover:bg-ember-hover text-cream transition-colors rounded-full shadow-lg shadow-ember/20 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send size={18} className="ml-0.5" />
          </motion.button>
        </div>
      </form>
    </div>
  )
}
