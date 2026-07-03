'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Shield, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-cream mb-2">Settings</h1>
        <p className="text-cream/70">Manage your profile, security, and preferences.</p>
      </div>

      <div className="space-y-6">
        
        {/* Profile Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <User className="text-ember" size={24} />
            <h2 className="text-xl font-heading font-semibold text-cream">Profile Settings</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-4">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Babalola" 
                alt="Avatar" 
                className="w-24 h-24 rounded-full bg-white/10 ring-4 ring-white/5"
              />
              <Button variant="outline" className="w-full text-sm">Change Avatar</Button>
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cream/70">Full Name</label>
                  <Input defaultValue="Babalola Joseph" className="bg-black/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cream/70">Email Address</label>
                  <Input defaultValue="t.babalolajoseph@gmail.com" disabled className="bg-black/20 opacity-70" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cream/70">Phone Number</label>
                  <Input defaultValue="+234 800 000 0000" className="bg-black/20" />
                </div>
              </div>
              <Button className="mt-4 bg-ember hover:bg-ember-hover text-cream">Save Changes</Button>
            </div>
          </div>
        </Card>

        {/* Security Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Shield className="text-ember" size={24} />
            <h2 className="text-xl font-heading font-semibold text-cream">Security & Access</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-cream">Transaction PIN</h3>
                <p className="text-sm text-cream/60">Update your 4-digit PIN for approving transactions.</p>
              </div>
              <Button variant="outline" className="border-white/10 text-cream">Change PIN</Button>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-cream">Account Password</h3>
                <p className="text-sm text-cream/60">Change your primary login password.</p>
              </div>
              <Button variant="outline" className="border-white/10 text-cream">Update Password</Button>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-cream">Two-Factor Authentication (2FA)</h3>
                <p className="text-sm text-cream/60">Add an extra layer of security using an authenticator app.</p>
              </div>
              <Button variant="outline" className="border-success text-success hover:bg-success/10">Enable 2FA</Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-danger/20">
          <div className="flex items-center gap-3 mb-6 border-b border-danger/10 pb-4">
            <AlertTriangle className="text-danger" size={24} />
            <h2 className="text-xl font-heading font-semibold text-danger">Danger Zone</h2>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-cream">Delete Account</h3>
              <p className="text-sm text-cream/60 max-w-md">
                Permanently remove your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="outline" className="border-danger text-danger hover:bg-danger hover:text-white">
              Delete Account
            </Button>
          </div>
        </Card>

      </div>
    </div>
  )
}
