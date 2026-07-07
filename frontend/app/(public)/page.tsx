'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Fingerprint,
  Globe,
  Lock,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import { Reveal, StaggerReveal } from '@/components/motion/reveal'
import { Parallax } from '@/components/motion/parallax'
import { AnimatedCounter } from '@/components/motion/animated-counter'
import { TiltCard } from '@/components/motion/tilt-card'

const HEADLINE_WORDS = ['Manage', 'your', 'money', 'like', "you're"]
const HEADLINE_ACCENT_WORDS = ['texting', 'a', 'friend.']

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const

function LumoLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const boxClass = size === 'md' ? 'w-10 h-10 rounded-xl text-xl' : 'w-8 h-8 rounded-lg text-lg'
  return (
    <span className="flex items-center gap-2">
      <span className={`${boxClass} bg-ember flex items-center justify-center shadow-lg shadow-ember/25 font-heading font-bold text-cream dark:text-cream`}>
        L
      </span>
      <span className={`font-heading font-bold tracking-tight ${size === 'md' ? 'text-2xl' : 'text-xl'}`}>
        Lumo
      </span>
    </span>
  )
}

function Navbar() {
  const { scrollY } = useScroll()
  const [hasScrolled, setHasScrolled] = useState(false)

  useMotionValueEvent(scrollY, 'change', (latestScrollY) => {
    setHasScrolled(latestScrollY > 24)
  })

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: easeOutExpo }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        hasScrolled
          ? 'bg-brown/85 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/10'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-500 ${hasScrolled ? 'h-16' : 'h-20'}`}>
        <Link href="/" aria-label="Lumo home">
          <LumoLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-medium">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How it Works', href: '#how-it-works' },
            { label: 'Security', href: '#security' },
          ].map((navLink) => (
            <Link
              key={navLink.href}
              href={navLink.href}
              className="relative text-cream/80 hover:text-cream transition-colors group"
            >
              {navLink.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ember transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block font-medium text-cream/80 hover:text-cream transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <Button variant="secondary" className="font-semibold shadow-lg shadow-ember/25 hover:shadow-ember-glow hover:-translate-y-0.5 transition-all duration-300">
              Get Started <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  )
}

// The phone mockup in the hero: a scripted Lumo conversation whose bubbles
// pop in one after another, then a confirmed-transfer receipt.
function HeroChatMockup() {
  const bubbleSpring = { type: 'spring', damping: 22, stiffness: 260 } as const

  return (
    <div className="relative w-[320px] sm:w-[360px]">
      <motion.div
        initial={{ opacity: 0, y: 60, rotate: 4 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: easeOutExpo }}
        className="relative rounded-[2.2rem] border border-white/10 bg-brown-deep/80 backdrop-blur-xl p-4 shadow-card-hover animate-float-slow"
      >
        <div className="flex items-center gap-3 px-2 pb-4 border-b border-white/5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-ember flex items-center justify-center font-heading font-bold text-sm text-cream dark:text-cream">
              L
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-brown-deep animate-pulse-ring" />
          </div>
          <div>
            <p className="text-sm font-semibold">Lumo</p>
            <p className="text-[11px] text-cream/50">Always online</p>
          </div>
        </div>

        <div className="pt-4 space-y-3 min-h-[300px]">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...bubbleSpring, delay: 1.2 }}
            className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-ember px-4 py-2.5 text-sm text-white shadow-lg shadow-ember/20"
          >
            Send ₦10,000 to David for the weekend trip
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...bubbleSpring, delay: 2 }}
            className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-cream/90"
          >
            Found him — David Okafor, GTBank ••0231. Ready when you are, just confirm with your PIN.
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...bubbleSpring, delay: 2.8 }}
            className="max-w-[85%] rounded-2xl border border-success/25 bg-success/10 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck size={16} className="text-success" />
              <span className="text-xs font-semibold text-success uppercase tracking-wider">Transfer complete</span>
            </div>
            <p className="font-heading text-2xl font-bold">₦10,000</p>
            <p className="text-xs text-cream/60 mt-1">to David Okafor • a moment ago</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.6, duration: 0.6 }}
            className="flex items-center gap-2 pt-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-bounce [animation-delay:300ms]" />
            <span className="text-[11px] text-cream/40 ml-1">Lumo is typing…</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating satellite cards drifting at their own parallax speeds */}
      <Parallax speed={-40} className="absolute -left-24 top-10 hidden lg:block">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 1.6, ease: easeOutExpo }}
          className="rounded-2xl border border-white/10 bg-brown-light/70 backdrop-blur-xl px-5 py-4 shadow-3d animate-float"
        >
          <p className="text-[11px] text-cream/50 mb-1">Wallet balance</p>
          <p className="font-heading text-xl font-bold">₦482,350</p>
          <p className="text-[11px] text-success mt-1 flex items-center gap-1">
            <ArrowUpRight size={12} /> +12% this month
          </p>
        </motion.div>
      </Parallax>

      <Parallax speed={-90} className="absolute -right-8 bottom-16 hidden lg:block">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 2.2, ease: easeOutExpo }}
          className="rounded-2xl border border-white/10 bg-brown-light/70 backdrop-blur-xl px-5 py-4 shadow-3d animate-float [animation-delay:1.5s]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-ember/20 text-ember flex items-center justify-center">
              <Smartphone size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">Airtime ₦1,000</p>
              <p className="text-[11px] text-success">Completed instantly</p>
            </div>
          </div>
        </motion.div>
      </Parallax>
    </div>
  )
}

function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroCopyY = useTransform(scrollYProgress, [0, 1], [0, 140])
  const heroCopyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const backGlowY = useTransform(scrollYProgress, [0, 1], [0, 260])
  const frontGlowY = useTransform(scrollYProgress, [0, 1], [0, -180])

  const headlineWord = (word: string, index: number, accent: boolean) => (
    <motion.span
      key={`${word}-${index}`}
      initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, delay: 0.25 + index * 0.07, ease: easeOutExpo }}
      className={`inline-block mr-[0.28em] ${accent ? 'text-gradient-ember-solid' : ''}`}
    >
      {word}
    </motion.span>
  )

  return (
    <section ref={heroRef} className="relative min-h-screen pt-36 pb-24 px-6 overflow-hidden bg-grid-faint">
      {/* Layered glows that scroll at different rates for depth */}
      <motion.div
        aria-hidden
        style={{ y: prefersReducedMotion ? 0 : backGlowY }}
        className="absolute top-[10%] left-[8%] w-[420px] h-[420px] rounded-full bg-ember/15 blur-[130px] pointer-events-none animate-aurora"
      />
      <motion.div
        aria-hidden
        style={{ y: prefersReducedMotion ? 0 : frontGlowY }}
        className="absolute bottom-[-10%] right-[5%] w-[520px] h-[520px] rounded-full bg-ember/20 blur-[150px] pointer-events-none animate-aurora [animation-delay:4s]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brown pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div style={{ y: prefersReducedMotion ? 0 : heroCopyY, opacity: heroCopyOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-ember mb-8"
          >
            <Zap size={15} />
            <span>Powered by Nomba Infrastructure</span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl xl:text-7xl font-heading font-bold mb-8 leading-[1.05] tracking-tight">
            {HEADLINE_WORDS.map((word, index) => headlineWord(word, index, false))}
            <br className="hidden md:block" />
            {HEADLINE_ACCENT_WORDS.map((word, index) =>
              headlineWord(word, HEADLINE_WORDS.length + index, true)
            )}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease: easeOutExpo }}
            className="text-lg md:text-xl text-cream/70 mb-10 max-w-xl leading-relaxed"
          >
            Lumo is an AI financial assistant that sends money, buys airtime, and pays your
            bills through plain conversation — while every kobo stays locked behind your PIN.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1, ease: easeOutExpo }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto shadow-xl shadow-ember/25 text-lg group hover:shadow-ember-glow hover:-translate-y-0.5 transition-all duration-300">
                Open Free Account
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300">
                See how it works
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-12 flex items-center gap-6 text-sm text-cream/50"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-success" /> PIN-guarded transfers
            </span>
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="text-ember" /> Free to start
            </span>
          </motion.div>
        </motion.div>

        <div className="relative flex justify-center lg:justify-end">
          <HeroChatMockup />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-cream/40"
      >
        <span className="text-[11px] uppercase tracking-[0.2em]">Scroll</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-8 bg-gradient-to-b from-cream/40 to-transparent"
        />
      </motion.div>
    </section>
  )
}

function MarqueeBand() {
  const marqueePhrases = [
    'Send money in seconds',
    'Buy airtime & data',
    'Pay bills by chat',
    'Track your spending',
    'Bank-grade security',
    'Built on Nomba',
  ]
  const marqueeContent = [...marqueePhrases, ...marqueePhrases]

  return (
    <section className="py-8 border-y border-white/5 bg-black/20 overflow-hidden">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {marqueeContent.map((phrase, index) => (
          <span key={index} className="flex items-center shrink-0">
            <span className="font-heading text-lg md:text-xl font-semibold text-cream/60 whitespace-nowrap px-6">
              {phrase}
            </span>
            <Sparkles size={14} className="text-ember/60 shrink-0" />
          </span>
        ))}
      </div>
    </section>
  )
}

function FeaturesSection() {
  const featureCards = [
    {
      icon: MessageSquare,
      title: 'Conversational Payments',
      body: '“Send 10k to David.” It’s that simple. Lumo understands natural language, finds the recipient, and lines everything up for you.',
    },
    {
      icon: ShieldCheck,
      title: 'You Hold the Keys',
      body: 'The assistant can prepare a payment, but only your transaction PIN can release it. No PIN, no money moved — ever.',
    },
    {
      icon: Globe,
      title: 'Everything In One Chat',
      body: 'Transfers, airtime, data bundles, DSTV and electricity bills, spending insights — one conversation replaces five different apps.',
    },
  ]

  return (
    <section id="features" className="py-28 px-6 relative">
      <Parallax speed={-50} className="absolute top-20 right-[10%] w-[300px] h-[300px] rounded-full bg-ember/10 blur-[110px] pointer-events-none">
        <span />
      </Parallax>

      <div className="max-w-7xl mx-auto relative z-10">
        <Reveal className="text-center mb-16">
          <p className="text-sm font-semibold text-ember uppercase tracking-[0.2em] mb-4">Features</p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 leading-tight">
            Everything you need,
            <br />
            just a chat away.
          </h2>
          <p className="text-cream/70 max-w-2xl mx-auto text-lg">Complex banking reduced to simple messages.</p>
        </Reveal>

        <StaggerReveal className="grid md:grid-cols-3 gap-6" staggerDelay={0.15}>
          {featureCards.map((feature) => (
            <TiltCard
              key={feature.title}
              className="relative lumo-card p-8 h-full group hover:border-ember/40 hover:shadow-card-hover transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-xl bg-ember/15 text-ember flex items-center justify-center mb-6 group-hover:bg-ember group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3">{feature.title}</h3>
              <p className="text-cream/70 leading-relaxed">{feature.body}</p>
            </TiltCard>
          ))}
        </StaggerReveal>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      icon: MessageSquare,
      title: 'Say what you need',
      body: 'Type it the way you’d text a friend: “Send ₦10,000 to David”, “Buy ₦500 airtime”, “How much did I spend on food this month?”',
    },
    {
      number: '02',
      icon: Fingerprint,
      title: 'Review & confirm with your PIN',
      body: 'Lumo shows you exactly who gets paid and how much. Nothing leaves your wallet until you approve it with your secret transaction PIN.',
    },
    {
      number: '03',
      icon: Wallet,
      title: 'Done in seconds',
      body: 'The transfer executes on Nomba’s payment rails and your receipt lands right in the conversation. Ask Lumo about it anytime.',
    },
  ]

  return (
    <section id="how-it-works" className="py-28 px-6 bg-black/20 border-y border-white/5 relative overflow-hidden">
      <Parallax speed={70} className="absolute -bottom-20 left-[5%] w-[380px] h-[380px] rounded-full bg-ember/10 blur-[120px] pointer-events-none">
        <span />
      </Parallax>

      <div className="max-w-5xl mx-auto relative z-10">
        <Reveal className="text-center mb-20">
          <p className="text-sm font-semibold text-ember uppercase tracking-[0.2em] mb-4">How it works</p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold leading-tight">
            Three steps. No forms. <br /> No account numbers to memorize.
          </h2>
        </Reveal>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.1} direction={index % 2 === 0 ? 'right' : 'left'}>
              <div className="lumo-card p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10 hover:border-ember/30 transition-colors duration-500 group">
                <span className="font-heading text-6xl md:text-7xl font-bold text-ember/20 group-hover:text-ember/40 transition-colors duration-500 shrink-0">
                  {step.number}
                </span>
                <div className="w-14 h-14 rounded-2xl bg-ember/15 text-ember flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <step.icon size={26} />
                </div>
                <div>
                  <h3 className="text-2xl font-heading font-bold mb-2">{step.title}</h3>
                  <p className="text-cream/70 leading-relaxed max-w-2xl">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function SecuritySection() {
  const securityPoints = [
    {
      icon: Fingerprint,
      title: 'PIN-gated execution',
      body: 'The AI can only prepare payments. Money moves solely after you confirm with your bcrypt-hashed transaction PIN.',
    },
    {
      icon: Lock,
      title: 'Payments expire fast',
      body: 'Every prepared payment self-destructs after five minutes if you don’t approve it. Nothing lingers.',
    },
    {
      icon: ShieldCheck,
      title: 'Lockout protection',
      body: 'Five wrong PIN attempts freeze confirmations for fifteen minutes, stopping brute-force attempts cold.',
    },
  ]

  return (
    <section id="security" className="py-28 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <div>
          <Reveal>
            <p className="text-sm font-semibold text-ember uppercase tracking-[0.2em] mb-4">Security</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">
              An assistant that can help —
              <br />
              <span className="text-gradient-ember">but never overstep.</span>
            </h2>
            <p className="text-lg text-cream/70 mb-10 max-w-xl leading-relaxed">
              Lumo was designed around one hard rule: artificial intelligence should never
              be able to spend your money. Only you can do that.
            </p>
          </Reveal>

          <StaggerReveal className="space-y-5" staggerDelay={0.12}>
            {securityPoints.map((point) => (
              <div key={point.title} className="flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-ember/25 hover:bg-white/[0.05] transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-ember/15 text-ember flex items-center justify-center shrink-0">
                  <point.icon size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-1">{point.title}</h3>
                  <p className="text-sm text-cream/60 leading-relaxed">{point.body}</p>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>

        <Parallax speed={-45} className="relative hidden lg:flex justify-center">
          <div className="relative">
            <div aria-hidden className="absolute inset-0 rounded-full bg-ember/15 blur-[100px]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, ease: easeOutExpo }}
              className="relative w-[380px] h-[380px] rounded-full border border-white/10 flex items-center justify-center"
            >
              <div className="absolute inset-8 rounded-full border border-white/10 border-dashed animate-[spin_40s_linear_infinite]" />
              <div className="absolute inset-20 rounded-full border border-ember/20" />
              <div className="w-28 h-28 rounded-3xl bg-brown-light border border-ember/30 shadow-ember-glow flex items-center justify-center animate-float">
                <ShieldCheck size={48} className="text-ember" />
              </div>
              {[Lock, Fingerprint, Wallet].map((OrbitIcon, index) => (
                <div
                  key={index}
                  className="absolute w-12 h-12 rounded-2xl bg-brown-light/90 border border-white/10 backdrop-blur flex items-center justify-center shadow-3d animate-float"
                  style={{
                    top: ['6%', '58%', '20%'][index],
                    left: ['62%', '4%', '8%'][index],
                    animationDelay: `${index * 1.4}s`,
                  }}
                >
                  <OrbitIcon size={20} className="text-cream/70" />
                </div>
              ))}
            </motion.div>
          </div>
        </Parallax>
      </div>
    </section>
  )
}

function StatsBand() {
  const stats = [
    { targetValue: 8, suffix: '+', label: 'Things Lumo can do for you' },
    { targetValue: 5, suffix: 's', label: 'Average transfer confirmation' },
    { targetValue: 100, suffix: '%', label: 'Payments gated by your PIN' },
    { targetValue: 24, suffix: '/7', label: 'Your assistant never sleeps' },
  ]

  return (
    <section className="py-20 px-6 border-y border-white/5 bg-black/20">
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-10">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 0.1} className="text-center">
            <p className="font-heading text-4xl md:text-5xl font-bold text-gradient-ember mb-2">
              <AnimatedCounter targetValue={stat.targetValue} suffix={stat.suffix} />
            </p>
            <p className="text-sm text-cream/60">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative">
        <Reveal>
          <div className="relative noise-overlay rounded-[2.5rem] border border-ember/25 bg-gradient-to-br from-brown-light via-brown to-brown-deep p-12 md:p-20 text-center overflow-hidden">
            <Parallax speed={-35} className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-ember/25 blur-[120px] rounded-full pointer-events-none">
              <span />
            </Parallax>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">
                Your money, one message away.
              </h2>
              <p className="text-lg text-cream/70 mb-10 max-w-xl mx-auto">
                Open a free Lumo wallet in under two minutes and let the conversation handle the rest.
              </p>
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-lg shadow-xl shadow-ember/30 group hover:shadow-ember-glow hover:-translate-y-0.5 transition-all duration-300">
                  Get Started — It&apos;s Free
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-brown-deep/60 py-14 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" aria-label="Lumo home">
            <LumoLogo size="sm" />
          </Link>
          <p className="text-sm text-cream/50">© 2026 Lumo Finance. Built for the Nomba Hackathon.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms'].map((footerLink) => (
              <Link key={footerLink} href="#" className="text-sm text-cream/50 hover:text-ember transition-colors">
                {footerLink}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brown text-cream selection:bg-ember selection:text-white flex flex-col w-full overflow-x-clip">
      <Navbar />
      <main className="flex-1 w-full">
        <Hero />
        <MarqueeBand />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
        <StatsBand />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
