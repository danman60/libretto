import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Music, Pen, Share2, Disc3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle radial gradient behind hero text */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(120,80,200,0.12)_0%,_transparent_70%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(168,130,255,0.06)_0%,_transparent_60%)]" />

        <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium tracking-widest uppercase text-gray-400 mb-8">
            <Disc3 className="h-3.5 w-3.5" />
            Libretto
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent leading-tight">
            Your life.<br />Your libretto.
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-12 leading-relaxed">
            Share your story. We&apos;ll transform it into a 5-track concept album
            with AI-generated lyrics, music, and a cinematic biography.
          </p>

          <Link href="/create">
            <Button
              size="lg"
              className="text-base px-10 py-6 rounded-full bg-white text-black hover:bg-gray-200 font-semibold transition-all hover:scale-105"
            >
              Create Your Album
            </Button>
          </Link>

          <p className="mt-6 text-xs text-gray-600">
            Free to use. No account required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 py-28">
          <p className="text-xs font-medium tracking-widest uppercase text-gray-500 text-center mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-20">
            Three steps to your album
          </h2>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              {
                icon: Pen,
                step: '01',
                title: 'Tell your story',
                desc: 'Walk through a guided narrative — your turning points, inner world, and the cinematic scenes that shaped you.',
              },
              {
                icon: Music,
                step: '02',
                title: 'AI composes',
                desc: 'Our AI maps your emotional arc, writes personalized lyrics, and generates 5 unique tracks in your chosen style.',
              },
              {
                icon: Share2,
                step: '03',
                title: 'Listen & share',
                desc: 'Get a cinematic album page with your biography, playable tracks, and lyrics — shareable with a single link.',
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-5xl font-bold text-white/[0.04] absolute -top-6 -left-2 select-none">
                  {step}
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 sm:p-12">
          <h3 className="text-xl font-semibold text-white mb-6">
            What you&apos;ll receive
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              '5 original tracks with full lyrics',
              'Custom album art from your story',
              'A reflective biography (900+ words)',
              'Shareable album page with audio player',
              'Emotional arc mapped across 5 chapters',
              'Your story, never stored or shared',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400/60 flex-shrink-0" />
                <span className="text-sm text-gray-400">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy + CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-10">
            Your story is personal. We automatically redact phone numbers, emails, and
            sensitive information. No account, no tracking.
          </p>
          <Link href="/create">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-white/20 text-white hover:bg-white/10 px-8 py-5"
            >
              Get started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-gray-600">
        Libretto &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
