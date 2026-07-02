'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

type LoginFormInputs = {
  email: string
  pin: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>()

  const onSubmit = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      // Set dummy cookie to bypass middleware guard
      document.cookie = "auth-token=dummy-token; path=/"
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-heading font-bold text-cream">Welcome back.</h1>
        <p className="text-cream/70 mt-2">Sign in to your Lumo account.</p>
      </div>

      <Card className="w-full max-w-md p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-cream block" htmlFor="email">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
              error={!!errors.email}
            />
            {errors.email && (
              <span className="text-danger text-sm">{errors.email.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-cream block" htmlFor="pin">
              4-Digit PIN
            </label>
            <Input
              id="pin"
              type="password"
              placeholder="••••"
              maxLength={4}
              {...register('pin', { 
                required: 'PIN is required',
                minLength: { value: 4, message: 'PIN must be 4 digits' },
                maxLength: { value: 4, message: 'PIN must be 4 digits' }
              })}
              error={!!errors.pin}
            />
            {errors.pin && (
              <span className="text-danger text-sm">{errors.pin.message}</span>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-cream/70">
            Don't have an account?{' '}
            <Link href="/register" className="text-ember hover:text-ember-hover font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

