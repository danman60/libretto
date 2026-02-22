'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MusicalTypeSelector } from '@/components/MusicalTypeSelector';
import { CurtainLoader } from '@/components/CurtainLoader';
import { Loader2 } from 'lucide-react';
import type { MusicalType, Track, Album } from '@/lib/types';

export default function CreatePage() {
  const router = useRouter();
  const [musicalType, setMusicalType] = useState<MusicalType | null>(null);
  const [idea, setIdea] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [album, setAlbum] = useState<Album | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [step, setStep] = useState<'create' | 'loading'>('create');
  const firstTrackPlayed = useRef(false);

  // Poll for status once generation starts
  const pollStatus = useCallback(() => {
    if (!projectId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${projectId}`);
        if (!res.ok) return;
        const data = await res.json();

        setTracks(data.tracks || []);
        if (data.album) setAlbum(data.album);

        const allTracksTerminal = data.tracks?.length === 6 &&
          data.tracks.every((t: Track) => t.status === 'complete' || t.status === 'failed');
        const hasAlbum = !!data.album;

        if (allTracksTerminal && hasAlbum) {
          setAllDone(true);
          clearInterval(interval);
          if (data.album.share_slug) {
            setTimeout(() => {
              router.push(`/album/${data.album.share_slug}`);
            }, 2000);
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, router]);

  useEffect(() => {
    if (step === 'loading') {
      return pollStatus();
    }
  }, [step, pollStatus]);

  // When opening number is ready, autoplay (browser might block, that's ok)
  useEffect(() => {
    if (firstTrackPlayed.current) return;
    const openingNumber = tracks.find(t => t.track_number === 1 && t.status === 'complete' && t.audio_url);
    if (openingNumber) {
      firstTrackPlayed.current = true;
    }
  }, [tracks]);

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
      setProjectId(newProjectId);
      sessionStorage.setItem('libretto_project_id', newProjectId);

      await fetch('/api/generate-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProjectId }),
      });

      setStep('loading');
    } catch (err) {
      console.error('Creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading screen
  if (step === 'loading') {
    return (
      <main className="min-h-screen text-[#F2E8D5]">
        <div className="text-center pt-8 mb-4">
          <Link href="/" className="marquee-title text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
            BROADWAYIFY
          </Link>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-16">
          <CurtainLoader tracks={tracks} isComplete={allDone} />
          {allDone && album?.share_slug && (
            <div className="text-center mt-6">
              <p className="text-[#F2E8D5]/50 text-sm">Redirecting to your playbill...</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Create form
  return (
    <main className="min-h-screen text-[#F2E8D5]">
      <div className="text-center pt-8 mb-4">
        <Link href="/" className="marquee-title text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
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
                6 original songs, a full playbill, and cover art — in about 2 minutes.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
