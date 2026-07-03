'use client'

import { useForm } from 'react-hook-form'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { message: '' },
  })

  const onSubmit = (data: { message: string }) => {
    if (data.message.trim()) {
      onSendMessage(data.message)
      reset()
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-t border-dark-700 p-4 space-y-3"
    >
      <input
        {...register('message')}
        type="text"
        placeholder="Send money, check balance, buy airtime..."
        disabled={disabled}
        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'Processing...' : 'Send'}
      </button>
    </form>
  )
}
