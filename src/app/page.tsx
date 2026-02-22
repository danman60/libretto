import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen text-[#F2E8D5]">
      {/* Hero */}
      <section className="relative overflow-hidden spotlight-hero">
        <div className="absolute inset-0 overture-bg opacity-50" />

        <div className="relative max-w-3xl mx-auto px-6 pt-32 pb-24 text-center">
          <h1 className="marquee-title text-6xl sm:text-7xl md:text-9xl font-black mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            LIBRETTO
          </h1>

          <div className="art-deco-divider my-6" />

          <p className="text-2xl sm:text-3xl tracking-widest uppercase gold-text-static mb-6"
            style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
          >
            Turn your idea into a Broadway musical
          </p>

          <p className="text-xl text-[#F2E8D5]/60 max-w-lg mx-auto mb-12 leading-relaxed"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Pick a style, describe your show in one sentence.
            We&apos;ll compose 6 original songs, write a full playbill, and
            generate cover art — in about two minutes.
          </p>

          <Link href="/create">
            <button className="px-12 py-4 rounded-full bg-[#C9A84C] text-[#08070A] text-lg font-semibold hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-[#C9A84C]/30 tracking-wide uppercase"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Create a show
            </button>
          </Link>

          <p className="mt-6 text-sm text-[#F2E8D5]/30">
            Free to use. No account required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C9A84C]/[0.02] to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <p className="text-[#C9A84C]/60 text-sm tracking-[0.3em] uppercase text-center mb-3"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            How it works
          </p>
          <h2 className="text-4xl text-center mb-4 text-[#F2E8D5]"
            style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
          >
            From idea to opening night
          </h2>
          <div className="art-deco-divider mb-20" />

          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                icon: '🎭',
                title: 'Pick your genre',
                desc: 'Classic Broadway, Rock Opera, Hip-Hop Musical, Disney-style — choose the tradition that fits your vision.',
              },
              {
                icon: '✍️',
                title: 'Describe your show',
                desc: 'One sentence is all it takes. Our AI dramaturg expands it into characters, a setting, and a full dramatic arc.',
              },
              {
                icon: '🎶',
                title: 'Get your playbill',
                desc: '6 original songs across two acts, a cast of characters, synopsis, and cover art — ready to share.',
              },
            ].map(({ icon, title, desc }, i) => (
              <div key={title} className={`flex flex-col items-center text-center md:items-start md:text-left stage-enter stage-enter-${i + 1}`}>
                <div className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center mb-5 text-2xl">
                  {icon}
                </div>
                <h3 className="text-xl font-semibold text-[#F2E8D5] mb-2"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {title}
                </h3>
                <p className="text-[#F2E8D5]/50 leading-relaxed text-base max-w-xs"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <div className="playbill-card p-8 sm:p-12">
          <h3 className="text-2xl text-[#1A0F1E] mb-6"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            What you&apos;ll receive
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              '6 original songs with lyrics',
              'Full playbill with synopsis & cast',
              'Custom cover art',
              'Shareable show page',
              'Two acts with intermission',
              'Download all tracks as ZIP',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <ChevronRight className="w-4 h-4 text-[#6B1D2A] flex-shrink-0" />
                <span className="text-base text-[#1A0F1E]/70" style={{ fontFamily: 'var(--font-cormorant)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="text-center">
          <p className="text-base text-[#F2E8D5]/40 mb-10" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
            Every show is unique. No two playbills are alike.
          </p>
          <Link href="/create">
            <button className="px-10 py-3.5 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors text-base tracking-wide"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Get started
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#C9A84C]/10 py-8 text-center text-xs text-[#F2E8D5]/30">
        Libretto &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
