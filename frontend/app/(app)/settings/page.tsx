'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ShieldCheck, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UserProfile {
  id: string
  email: string
  name: string
  phone: string
  status: string
}

type ProfileFormInputs = {
  name: string
  phone: string
}

type PinFormInputs = {
  pin: string
  confirmPin: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const [isSavingPin, setIsSavingPin] = useState(false)
  const [pinStatus, setPinStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const profileForm = useForm<ProfileFormInputs>({ defaultValues: { name: '', phone: '' } })
  const pinForm = useForm<PinFormInputs>({ defaultValues: { pin: '', confirmPin: '' } })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const data = (await response.json()) as UserProfile
          setProfile(data)
          profileForm.reset({ name: data.name, phone: data.phone })
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchProfile()
    // profileForm is stable across renders (react-hook-form returns a stable instance).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSaveProfile = async (formData: ProfileFormInputs) => {
    setIsSavingProfile(true)
    setProfileStatus(null)
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, phone: formData.phone }),
      })
      const data = await response.json()
      if (!response.ok) {
        setProfileStatus({ ok: false, message: data.error ?? 'Failed to update profile' })
        return
      }
      setProfile(data)
      setProfileStatus({ ok: true, message: 'Profile updated' })
    } catch {
      setProfileStatus({ ok: false, message: 'Failed to update profile. Please try again.' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const onSavePin = async (formData: PinFormInputs) => {
    if (formData.pin !== formData.confirmPin) {
      setPinStatus({ ok: false, message: 'PINs do not match' })
      return
    }
    setIsSavingPin(true)
    setPinStatus(null)
    try {
      const response = await fetch('/api/user/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: formData.pin }),
      })
      const data = await response.json()
      if (!response.ok) {
        setPinStatus({ ok: false, message: data.error ?? 'Failed to set transaction PIN' })
        return
      }
      setPinStatus({ ok: true, message: 'Transaction PIN set. You can now confirm payments in chat.' })
      pinForm.reset()
    } catch {
      setPinStatus({ ok: false, message: 'Failed to set transaction PIN. Please try again.' })
    } finally {
      setIsSavingPin(false)
    }
  }

  const statusBanner = (status: { ok: boolean; message: string }) => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className={`p-3 rounded-lg text-sm text-center border ${
          status.ok
            ? 'bg-success/10 border-success/20 text-success'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}
      >
        {status.message}
      </motion.div>
    </AnimatePresence>
  )

  const cardEntrance = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] as const },
  })

  return (
    <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
      <motion.h1 {...cardEntrance(0)} className="text-2xl font-heading font-bold text-cream">
        Settings
      </motion.h1>

      <motion.div {...cardEntrance(0.1)}>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-ember/20 text-ember flex items-center justify-center">
            <UserRound size={18} />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-cream">Profile</h2>
            <p className="text-xs text-cream/50">
              {isLoadingProfile ? 'Loading…' : profile?.email ?? 'Not signed in'}
            </p>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <div>
            <label className="block text-xs text-cream/70 mb-1.5">Full Name</label>
            <Input
              {...profileForm.register('name', { required: 'Name is required' })}
              disabled={isLoadingProfile}
              className="h-11 bg-white/5 border-white/10 text-cream"
            />
            {profileForm.formState.errors.name && (
              <span className="text-xs text-red-400 mt-1 block">
                {profileForm.formState.errors.name.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-xs text-cream/70 mb-1.5">Phone Number</label>
            <Input
              type="tel"
              {...profileForm.register('phone', {
                required: 'Phone number is required',
                pattern: { value: /^\+?[0-9]{10,14}$/, message: 'Invalid phone number' },
              })}
              disabled={isLoadingProfile}
              className="h-11 bg-white/5 border-white/10 text-cream"
            />
            {profileForm.formState.errors.phone && (
              <span className="text-xs text-red-400 mt-1 block">
                {profileForm.formState.errors.phone.message}
              </span>
            )}
          </div>

          {profileStatus && statusBanner(profileStatus)}

          <Button
            type="submit"
            disabled={isSavingProfile || isLoadingProfile}
            className="h-11 bg-ember hover:bg-ember-hover text-cream"
          >
            {isSavingProfile ? <Loader2 className="animate-spin" size={18} /> : 'Save Profile'}
          </Button>
        </form>
      </Card>
      </motion.div>

      <motion.div {...cardEntrance(0.2)}>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-ember/20 text-ember flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-cream">Transaction PIN</h2>
            <p className="text-xs text-cream/50">
              A 4-6 digit PIN required to confirm every payment the assistant prepares.
            </p>
          </div>
        </div>

        <form onSubmit={pinForm.handleSubmit(onSavePin)} className="space-y-4">
          <div>
            <label className="block text-xs text-cream/70 mb-1.5">New PIN</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              {...pinForm.register('pin', {
                required: 'PIN is required',
                pattern: { value: /^\d{4,6}$/, message: 'PIN must be 4-6 digits' },
              })}
              className="h-11 bg-white/5 border-white/10 text-cream"
            />
            {pinForm.formState.errors.pin && (
              <span className="text-xs text-red-400 mt-1 block">
                {pinForm.formState.errors.pin.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-xs text-cream/70 mb-1.5">Confirm PIN</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              {...pinForm.register('confirmPin', { required: 'Confirm your PIN' })}
              className="h-11 bg-white/5 border-white/10 text-cream"
            />
            {pinForm.formState.errors.confirmPin && (
              <span className="text-xs text-red-400 mt-1 block">
                {pinForm.formState.errors.confirmPin.message}
              </span>
            )}
          </div>

          {pinStatus && statusBanner(pinStatus)}

          <Button
            type="submit"
            disabled={isSavingPin}
            className="h-11 bg-ember hover:bg-ember-hover text-cream"
          >
            {isSavingPin ? <Loader2 className="animate-spin" size={18} /> : 'Set Transaction PIN'}
          </Button>
        </form>
      </Card>
      </motion.div>
    </div>
  )
}
