'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react'

type LoginFormInputs = {
  email: string
  pin: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<LoginFormInputs>({
    mode: 'onBlur'
  })

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
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-brown">
      
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-black/20 border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-ember/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-16 inline-flex">
            <div className="w-10 h-10 rounded-xl bg-ember flex items-center justify-center shadow-lg shadow-ember/20">
              <span className="text-cream font-bold text-xl font-heading">L</span>
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight text-cream">Lumo</span>
          </Link>

          <h2 className="text-5xl font-heading font-bold text-cream leading-[1.1] mb-6">
            Welcome back to <br/> Lumo Finance.
          </h2>
          <p className="text-lg text-cream/70 max-w-md">
            Sign in to manage your money, pay bills, and chat with your intelligent assistant.
          </p>
        </div>

        <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-md">
          <div className="flex gap-3 items-center mb-3">
            <ShieldCheck className="text-success" size={24} />
            <h4 className="font-semibold text-cream">Bank-Grade Security</h4>
          </div>
          <p className="text-sm text-cream/70">
            Your funds are protected by Nomba's production-grade infrastructure and end-to-end encryption.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-6 md:p-12 relative">
        
        {/* Mobile Header */}
        <Link href="/" className="md:hidden flex items-center gap-2 mb-12 self-start">
          <div className="w-8 h-8 rounded-lg bg-ember flex items-center justify-center">
            <span className="text-cream font-bold font-heading">L</span>
          </div>
          <span className="font-heading text-xl font-bold text-cream">Lumo</span>
        </Link>

        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-cream mb-2">Sign In</h1>
            <p className="text-cream/60">Enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-cream/40" size={18} />
                <Input 
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
                  })}
                  placeholder="Email Address" 
                  className="pl-10 h-12 bg-white/5 border-white/10 focus-visible:ring-ember/50 text-cream"
                />
                {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email.message as string}</span>}
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-cream/40" size={18} />
                <Input 
                  type="password"
                  maxLength={4}
                  {...register('pin', { 
                    required: 'PIN is required',
                    minLength: { value: 4, message: 'Must be 4 digits' }
                  })}
                  placeholder="4-Digit PIN" 
                  className="pl-10 h-12 bg-white/5 border-white/10 focus-visible:ring-ember/50 text-cream"
                />
                {errors.pin && <span className="text-xs text-red-400 mt-1 block">{errors.pin.message as string}</span>}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !isValid} 
              className="w-full h-12 bg-ember hover:bg-ember-hover text-cream text-lg shadow-lg shadow-ember/20"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
            </Button>

            <p className="text-center text-sm text-cream/60">
              Don't have an account?{' '}
              <Link href="/register" className="text-ember hover:underline font-medium">
                Create one
              </Link>
            </p>
          </form>

        </div>
      </div>
    </div>
  )
}

