'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, ShieldCheck, Zap, Globe, MessageSquare, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brown text-cream selection:bg-ember selection:text-white flex flex-col w-full">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-brown/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-ember flex items-center justify-center shadow-lg shadow-ember/20">
              <span className="text-cream font-bold text-xl font-heading">L</span>
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight">Lumo</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 font-medium">
            <Link href="#features" className="text-cream/80 hover:text-ember transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-cream/80 hover:text-ember transition-colors">How it Works</Link>
            <Link href="#security" className="text-cream/80 hover:text-ember transition-colors">Security</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block font-medium text-cream/80 hover:text-ember transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button variant="secondary" className="font-semibold shadow-lg shadow-ember/20 hover:shadow-ember/40">
                Get Started <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Hero Section with Ember Gradient Glow */}
        <section className="relative pt-32 pb-40 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
          {/* Background Glow */}
          <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[80%] max-w-[800px] h-[500px] bg-ember/30 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-ember mb-8">
              <Zap size={16} /> <span>Powered by Nomba Infrastructure</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight tracking-tight">
              Manage your money like you're <span className="text-ember">texting a friend.</span>
            </h1>
            <p className="text-lg md:text-xl text-cream/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Lumo is an AI-powered financial assistant that lets you send money, pay bills, and track expenses through simple, natural conversations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto shadow-xl shadow-ember/20 text-lg group">
                  Open Free Account
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg hover:bg-white/10">
                  See how it works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">Everything you need, <br/>just a chat away.</h2>
              <p className="text-cream/70 max-w-2xl mx-auto">Complex banking reduced to simple messages.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-8 hover:border-ember/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-ember/20 text-ember flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">Conversational Payments</h3>
                <p className="text-cream/70 leading-relaxed">
                  "Send 10k to David." It's that simple. Lumo understands natural language and executes instantly.
                </p>
              </Card>
              <Card className="p-8 hover:border-ember/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-ember/20 text-ember flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">Bank-Grade Security</h3>
                <p className="text-cream/70 leading-relaxed">
                  Protected by standard encryption and Nomba's robust, production-ready payment infrastructure.
                </p>
              </Card>
              <Card className="p-8 hover:border-ember/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-ember/20 text-ember flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe size={24} />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">Universal Access</h3>
                <p className="text-cream/70 leading-relaxed">
                  Seamless multi-channel support. Access your wallet from anywhere, tailored for the modern African context.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Band */}
        <section className="py-16 border-y border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-medium text-cream/50 mb-8 uppercase tracking-widest">Built on trusted infrastructure</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              <h2 className="text-2xl font-heading font-black tracking-tight">Nomba.</h2>
              <h2 className="text-2xl font-heading font-black tracking-tight">DevCareer</h2>
              <h2 className="text-2xl font-heading font-black tracking-tight">Techstars</h2>
              <h2 className="text-2xl font-heading font-black tracking-tight">Y Combinator</h2>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-brown-light py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ember flex items-center justify-center">
              <span className="text-cream font-bold text-sm font-heading">L</span>
            </div>
            <span className="font-heading text-xl font-bold">Lumo</span>
          </div>
          <p className="text-sm text-cream/50">© 2026 Lumo Finance. Built for Nomba Hackathon.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-cream/50 hover:text-ember transition-colors">Privacy</Link>
            <Link href="#" className="text-sm text-cream/50 hover:text-ember transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
