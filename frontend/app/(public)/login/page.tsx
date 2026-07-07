'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthBrandPanel } from '@/components/auth/auth-brand-panel'
import { Mail, Lock, Loader2 } from 'lucide-react'

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const

type LoginFormInputs = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    mode: 'onBlur'
  })

  const onSubmit = async (formData: LoginFormInputs) => {
    setIsLoading(true)
    setServerError(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setServerError(data.error ?? 'Login failed. Please try again.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setServerError('Login failed. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-brown">
      <AuthBrandPanel
        headline={<>Welcome back to <br /> Lumo Finance.</>}
        subline="Sign in to manage your money, pay bills, and chat with your intelligent assistant."
      />

      {/* Right Panel - Form */}
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-6 md:p-12 relative overflow-hidden">
        <div
          aria-hidden
          className="md:hidden absolute -top-24 -right-24 w-[320px] h-[320px] rounded-full bg-ember/15 blur-[100px] pointer-events-none"
        />

        {/* Mobile Header */}
        <Link href="/" className="md:hidden flex items-center gap-2 mb-12 self-start relative z-10">
          <div className="w-8 h-8 rounded-lg bg-ember flex items-center justify-center">
            <span className="text-cream font-bold font-heading">L</span>
          </div>
          <span className="font-heading text-xl font-bold text-cream">Lumo</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: easeOutExpo }}
          className="w-full max-w-md space-y-8 relative z-10"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-cream mb-2">Sign In</h1>
            <p className="text-cream/60">Enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-cream/40 z-10" size={18} />
                <Input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
                  })}
                  placeholder="Email Address"
                  className="pl-10 h-12 bg-white/5 border-white/10 focus-visible:ring-ember/50 text-cream hover:border-white/20 transition-colors"
                />
                {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email.message as string}</span>}
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-cream/40 z-10" size={18} />
                <Input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' }
                  })}
                  placeholder="Password"
                  className="pl-10 h-12 bg-white/5 border-white/10 focus-visible:ring-ember/50 text-cream hover:border-white/20 transition-colors"
                />
                {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message as string}</span>}
              </div>
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">
                    {serverError}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-ember hover:bg-ember-hover text-cream text-lg shadow-lg shadow-ember/20 hover:shadow-ember-glow hover:-translate-y-0.5 transition-all duration-300"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
            </Button>

            <p className="text-center text-sm text-cream/60">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-ember hover:underline font-medium">
                Create one
              </Link>
            </p>
          </form>

        </motion.div>
      </div>
    </div>
  )
}
