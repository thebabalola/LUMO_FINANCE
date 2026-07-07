'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthBrandPanel } from '@/components/auth/auth-brand-panel'
import { OtpInput } from '@/components/auth/otp-input'
import { Loader2, Mail, Lock, User, Phone, MailCheck } from 'lucide-react'

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const

type RegisterFormInputs = {
  name: string
  email: string
  phone: string
  password: string
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const router = useRouter()

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<RegisterFormInputs>({
    mode: 'onBlur',
    defaultValues: { name: '', email: '', phone: '', password: '' }
  })

  const onSubmitStep1 = async (formData: RegisterFormInputs) => {
    setIsLoading(true)
    setServerError(null)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setServerError(data.error ?? 'Registration failed. Please try again.')
        return
      }
      setStep(2)
    } catch {
      setServerError('Registration failed. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitOtp = async () => {
    if (otpCode.length !== 6) {
      setServerError('Enter the 6-digit code from your email.')
      return
    }
    setIsLoading(true)
    setServerError(null)
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: getValues('email'), code: otpCode }),
      })
      const data = await response.json()
      if (!response.ok) {
        setServerError(data.error ?? 'Verification failed. Please try again.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setServerError('Verification failed. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const serverErrorBanner = (
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
  )

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-brown">
      <AuthBrandPanel
        headline={<>Join the future of <br /> African finance.</>}
        subline="Lumo is your intelligent financial OS. Chat to send money, pay bills, and manage your wealth."
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
          className="w-full max-w-md relative z-10"
        >
          {/* Step progress indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: step === stepNumber ? 1 : 0.9,
                    opacity: step >= stepNumber ? 1 : 0.4,
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors duration-300 ${
                    step >= stepNumber
                      ? 'bg-ember text-white border-ember'
                      : 'bg-white/5 text-cream/50 border-white/10'
                  }`}
                >
                  {stepNumber}
                </motion.div>
                {stepNumber === 1 && (
                  <div className="w-16 h-px bg-white/10 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-ember"
                      initial={{ width: 0 }}
                      animate={{ width: step === 2 ? '100%' : '0%' }}
                      transition={{ duration: 0.5, ease: easeOutExpo }}
                    />
                  </div>
                )}
              </div>
            ))}
            <span className="text-xs text-cream/50 ml-2">
              {step === 1 ? 'Your details' : 'Email verification'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="details-step"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.45, ease: easeOutExpo }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-heading font-bold text-cream mb-2">Create Account</h1>
                  <p className="text-cream/60">Start your journey with Lumo today.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-5">
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 text-cream/40 z-10" size={18} />
                      <Input
                        {...register('name', { required: 'Name is required' })}
                        placeholder="Full Name"
                        className="pl-10 h-12 bg-white/5 border-white/10 focus-visible:ring-ember/50 text-cream hover:border-white/20 transition-colors"
                      />
                      {errors.name && <span className="text-xs text-red-400 mt-1 block">{errors.name.message as string}</span>}
                    </div>

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
                      <Phone className="absolute left-3 top-3.5 text-cream/40 z-10" size={18} />
                      <Input
                        type="tel"
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: { value: /^\+?[0-9]{10,14}$/, message: 'Invalid phone number' }
                        })}
                        placeholder="Phone Number"
                        className="pl-10 h-12 bg-white/5 border-white/10 focus-visible:ring-ember/50 text-cream hover:border-white/20 transition-colors"
                      />
                      {errors.phone && <span className="text-xs text-red-400 mt-1 block">{errors.phone.message as string}</span>}
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

                  {serverErrorBanner}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-ember hover:bg-ember-hover text-cream text-lg shadow-lg shadow-ember/20 hover:shadow-ember-glow hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Continue'}
                  </Button>

                  <p className="text-center text-sm text-cream/60">
                    Already have an account?{' '}
                    <Link href="/login" className="text-ember hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.45, ease: easeOutExpo }}
                className="space-y-8"
              >
                <div className="text-center md:text-left">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 16, stiffness: 220, delay: 0.15 }}
                    className="w-14 h-14 rounded-2xl bg-ember/15 text-ember flex items-center justify-center mb-5 mx-auto md:mx-0"
                  >
                    <MailCheck size={26} />
                  </motion.div>
                  <h1 className="text-3xl font-heading font-bold text-cream mb-2">Verify Email</h1>
                  <p className="text-cream/60">
                    We sent a 6-digit code to{' '}
                    <span className="text-cream font-medium">{getValues('email')}</span>.
                  </p>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    onSubmitOtp()
                  }}
                  className="space-y-6"
                >
                  <OtpInput value={otpCode} onChange={setOtpCode} disabled={isLoading} />

                  {serverErrorBanner}

                  <Button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full h-12 bg-ember hover:bg-ember-hover text-cream text-lg shadow-lg shadow-ember/20 hover:shadow-ember-glow hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Verify & Complete'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
