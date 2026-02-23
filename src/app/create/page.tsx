'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MusicalTypeSelector } from '@/components/MusicalTypeSelector';
import { Loader2 } from 'lucide-react';
import type { MusicalType } from '@/lib/types';

export default function CreatePage() {
  const router = useRouter();
  const [musicalType, setMusicalType] = useState<MusicalType | null>(null);
  const [idea, setIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!musicalType || !idea.trim()) return;

    setIsSubmitting(true);
    try {
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicalType, idea: idea.trim() }),
      });
      const sessionData = await sessionRes.json();
      const newProjectId = sessionData.projectId;
      sessionStorage.setItem('libretto_project_id', newProjectId);

      const genRes = await fetch('/api/generate-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProjectId }),
      });
      const genData = await genRes.json();

      if (genData.share_slug) {
        router.push(`/album/${genData.share_slug}`);
      }
    } catch (err) {
      console.error('Creation failed:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen text-[#F2E8D5]">
      <div className="text-center pt-8 mb-4">
        <Link href="/" className="marquee-title inline-block py-2 text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
          BROADWAYIFY
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 gentle-fade-in">
        {/* Step 1: Choose your musical type */}
        <div className="text-center mb-8">
          <h2 className="text-3xl mb-2"
            style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
          >
            What kind of show?
          </h2>
          <p className="text-[#F2E8D5]/50" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Pick a style. We&apos;ll handle the rest.
          </p>
        </div>

        <MusicalTypeSelector selected={musicalType} onSelect={setMusicalType} />

        {!musicalType && (
          <p className="text-center text-sm text-[#F2E8D5]/30 mt-6" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
            Tap a genre to continue
          </p>
        )}

        {/* Step 2: Enter your idea */}
        {musicalType && (
          <div className="mt-10 gentle-fade-in">
            <label className="block text-lg text-[#F2E8D5] mb-3"
              style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
            >
              What&apos;s your show about?
            </label>
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder="A janitor at a space station who discovers she's the last person who remembers Earth's music..."
              rows={3}
              maxLength={500}
              className="w-full bg-[#1A0F1E]/50 border border-[#C9A84C]/15 rounded-xl px-4 py-3 text-[#F2E8D5] placeholder-[#F2E8D5]/30 focus:outline-none focus:border-[#C9A84C]/40 transition-colors resize-none"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#F2E8D5]/30">{idea.length}/500</span>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleCreate}
                disabled={!idea.trim() || isSubmitting}
                className="px-12 py-4 rounded-full bg-[#C9A84C] text-[#08070A] text-lg font-semibold hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-[#C9A84C]/30 disabled:opacity-40 disabled:hover:scale-100 tracking-wide uppercase"
                style={{ fontFamily: 'var(--font-oswald)' }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create My Show'
                )}
              </button>
              <p className="mt-4 text-sm text-[#F2E8D5]/30" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
                1 original song, a full playbill, and cover art — free.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
