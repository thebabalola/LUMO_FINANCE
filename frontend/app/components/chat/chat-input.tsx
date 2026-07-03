'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Mic, Send } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const { inputValue, setInputValue } = useChatStore()
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { message: '' },
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
        {['Send ₦10k to John', 'Buy ₦1,000 Airtime', 'Pay DSTV bill'].map((chip) => (
          <button 
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => handleChipClick(chip)}
            className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-cream transition-colors disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="relative flex items-center">
        <Input 
          {...register('message', {
            onChange: (e) => setInputValue(e.target.value)
          })}
          disabled={disabled}
          autoComplete="off"
          placeholder={disabled ? "Processing..." : "Type a message..."} 
          className="pr-24 bg-brown-light border-white/10 rounded-full focus-visible:ring-ember/50"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <button type="button" disabled={disabled} className="p-2 text-cream/50 hover:text-ember transition-colors rounded-full hover:bg-white/5 disabled:opacity-50">
            <Mic size={18} />
          </button>
          <button type="submit" disabled={disabled} className="p-2 bg-ember hover:bg-ember-hover text-cream transition-colors rounded-full shadow-lg shadow-ember/20 disabled:opacity-50">
            <Send size={18} className="ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  )
}


