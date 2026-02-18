import Link from 'next/link';
import { Music, Pen, Share2 } from 'lucide-react';
import { SheetMusicBg } from '@/components/SheetMusicBg';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0D0B0E] text-[#F5F0EB]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 aurora-bg opacity-40" />
        <SheetMusicBg />

        <div className="relative max-w-3xl mx-auto px-6 pt-32 pb-24 text-center">
          <p className="text-[#9B8E99] text-base tracking-widest uppercase mb-8">
            Libretto
          </p>

          <h1
            className="text-6xl sm:text-8xl mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-dm-serif)' }}
          >
            Your life,<br />in three moments
          </h1>

          <p
            className="text-xl text-[#9B8E99] max-w-lg mx-auto mb-12 leading-relaxed"
            style={{ fontFamily: 'var(--font-lora)' }}
          >
            Share three moments that shaped you. We&apos;ll turn them into a
            personal musical biography — lyrics, music, and narrative, composed
            just for you.
          </p>

          <Link href="/create">
            <button className="px-12 py-4 rounded-full bg-[#E8A87C] text-[#0D0B0E] text-lg font-medium hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-[#E8A87C]/20">
              Begin your story
            </button>
          </Link>

          <p className="mt-6 text-sm text-[#9B8E99]/50">
            Free to use. No account required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 py-28">
          <p className="text-[#9B8E99] text-sm tracking-widest uppercase text-center mb-3">
            How it works
          </p>
          <h2
            className="text-4xl text-center mb-20 text-[#F5F0EB]"
            style={{ fontFamily: 'var(--font-dm-serif)' }}
          >
            Three moments become three songs
          </h2>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              {
                icon: Pen,
                step: '01',
                title: 'Share your moments',
                desc: 'Tell us about three defining moments — where it began, what shifted everything, and where you are now.',
              },
              {
                icon: Music,
                step: '02',
                title: 'Music takes shape',
                desc: 'Each moment becomes a track with personalized lyrics and music, generated in real time as you write.',
              },
              {
                icon: Share2,
                step: '03',
                title: 'Listen & share',
                desc: 'Receive a cinematic album page with your biography, playable tracks, and a shareable link.',
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-5xl font-bold text-[#E8A87C]/[0.06] absolute -top-6 -left-2 select-none">
                  {step}
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5 text-[#E8A87C]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#F5F0EB] mb-2">
                    {title}
                  </h3>
                  <p className="text-[#9B8E99] leading-relaxed text-base" style={{ fontFamily: 'var(--font-lora)' }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-2xl mx-auto px-6 py-24">
        <div className="glass-card p-8 sm:p-12">
          <h3
            className="text-2xl text-[#F5F0EB] mb-6"
            style={{ fontFamily: 'var(--font-dm-serif)' }}
          >
            What you&apos;ll receive
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              '3 original tracks with lyrics',
              'Custom cover art from your story',
              'A reflective biography',
              'Shareable album page',
              'Music shaped by your emotions',
              'Your story, never stored',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#E8A87C]/60 flex-shrink-0" />
                <span className="text-base text-[#9B8E99]" style={{ fontFamily: 'var(--font-lora)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy + CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <div className="text-center">
          <p className="text-base text-[#9B8E99]/60 mb-10" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
            Your story is personal. We automatically redact sensitive information.
            No account, no tracking.
          </p>
          <Link href="/create">
            <button className="px-10 py-3.5 rounded-full border border-[#E8A87C]/20 text-[#E8A87C] hover:bg-[#E8A87C]/10 transition-colors text-base">
              Get started
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 text-center text-xs text-[#9B8E99]/40">
        Libretto &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
