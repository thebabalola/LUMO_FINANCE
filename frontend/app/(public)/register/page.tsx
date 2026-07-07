'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ShieldCheck, Mail, Lock, User } from 'lucide-react'

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const { register, handleSubmit, formState: { errors, isValid } } = useForm({
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', otp: '' }
  })

  const onSubmitStep1 = async (_data: any) => {
    setIsLoading(true)
    // Simulate API call to register
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setStep(2)
  }

  const onSubmitStep2 = async (_data: any) => {
    setIsLoading(true)
    // Simulate API call to verify OTP
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-brown">
      
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-black/20 border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-ember/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-16 inline-flex">
            <img src="/lumoFi-logo.png" alt="Lumo Logo" className="w-10 h-10 object-contain" />
            <span className="font-heading text-2xl font-bold tracking-tight text-cream">Lumo</span>
          </Link>

          <h2 className="text-5xl font-heading font-bold text-cream leading-[1.1] mb-6">
            Join the future of <br/> African finance.
          </h2>
          <p className="text-lg text-cream/70 max-w-md">
            Lumo is your intelligent financial OS. Chat to send money, pay bills, and manage your wealth.
          </p>
        </div>

        <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-md">
          <div className="flex gap-3 items-center mb-3">
            <ShieldCheck className="text-success" size={24} />
            <h4 className="font-semibold text-cream">Bank-Grade Security</h4>
          </div>
          <p className="text-sm text-cream/70">
            Your funds are protected by Nomba&apos;s production-grade infrastructure and end-to-end encryption.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-6 md:p-12 relative">
        
        {/* Mobile Header */}
        <Link href="/" className="md:hidden flex items-center gap-2 mb-12 self-start">
          <img src="/lumoFi-logo.png" alt="Lumo Logo" className="w-8 h-8 object-contain" />
          <span className="font-heading text-xl font-bold text-cream">Lumo</span>
        </Link>

        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-cream mb-2">
              {step === 1 ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="text-cream/60">
              {step === 1 ? 'Start your journey with Lumo today.' : 'We sent a 6-digit code to your email.'}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-cream/40" size={18} />
                  <Input 
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Full Name" 
                    className="pl-10 h-12 bg-white/5 border-white/10 focus-visible:ring-ember/50 text-cream"
                  />
                  {errors.name && <span className="text-xs text-red-400 mt-1 block">{errors.name.message as string}</span>}
                </div>

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
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' }
                    })}
                    placeholder="Password" 
                    className="pl-10 h-12 bg-white/5 border-white/10 focus-visible:ring-ember/50 text-cream"
                  />
                  {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message as string}</span>}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !isValid} 
                className="w-full h-12 bg-ember hover:bg-ember-hover text-cream text-lg shadow-lg shadow-ember/20"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Continue'}
              </Button>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative bg-brown px-4 text-xs uppercase text-cream/40 font-medium">Or continue with</div>
              </div>

              <Button 
                variant="outline" 
                type="button"
                disabled
                title="Coming Soon"
                className="w-full h-12 bg-white/5 border-white/10 text-cream hover:bg-white/10 hover:text-white flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"></path>
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"></path>
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"></path>
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"></path>
                </svg>
                Google
              </Button>

              <p className="text-center text-sm text-cream/60 pt-4">
                Already have an account?{' '}
                <Link href="/login" className="text-ember hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmitStep2)} className="space-y-6">
              <div className="flex gap-2 justify-center">
                {/* Simplified OTP input for demo */}
                <Input 
                  {...register('otp', { required: 'OTP is required', minLength: 6, maxLength: 6 })}
                  placeholder="------" 
                  maxLength={6}
                  className="h-16 text-center text-2xl tracking-[1em] font-mono bg-white/5 border-white/10 focus-visible:ring-ember/50 text-cream w-full"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full h-12 bg-ember hover:bg-ember-hover text-cream text-lg shadow-lg shadow-ember/20"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Verify & Complete'}
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

