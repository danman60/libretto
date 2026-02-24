'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MusicalTypeSelector } from '@/components/MusicalTypeSelector';
import { QuillScribeBg } from '@/components/QuillScribeBg';
import { Loader2 } from 'lucide-react';
import type { MusicalType } from '@/lib/types';

const STAGE_MESSAGES: Record<string, string[]> = {
  intake: ['Raising the curtain...'],
  enriching: [
    'Imagining your world...',
    'Casting the characters...',
    'Writing the backstory...',
    'Building the dramatic arc...',
  ],
  generating_music: [
    'Composing the overture...',
    'The orchestra is tuning...',
    'Rehearsing Act I...',
    'Setting the stage lights...',
    'Stitching the costumes...',
  ],
  generating_lyrics: [
    'The lyricist is inspired...',
    'Penning the opening number...',
  ],
  generating_audio: [
    'Recording in the studio...',
    'The band is laying tracks...',
  ],
};

const STAGE_LABELS: Record<string, string> = {
  intake: 'Preparing',
  enriching: 'Developing your concept',
  generating_music: 'Creating the playbill',
  generating_lyrics: 'Writing lyrics',
  generating_audio: 'Composing music',
  complete: 'Show time!',
};

function getStageProgress(status: string, hasAlbum: boolean, trackCount: number): number {
  if (hasAlbum) return 90;
  switch (status) {
    case 'intake': return 5;
    case 'enriching': return 20;
    case 'generating_music': return 45 + Math.min(trackCount * 5, 30);
    default: return 10;
  }
}

export default function CreatePage() {
  const router = useRouter();
  const [musicalType, setMusicalType] = useState<MusicalType | null>(null);
  const [idea, setIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<string>('intake');
  const [stageMessage, setStageMessage] = useState('Raising the curtain...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const msgIndexRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  // Poll for status once we have a projectId
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${projectId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (cancelled) return;

        const status = data.project?.status || 'intake';
        setProjectStatus(status);

        const trackCount = data.tracks?.filter(
          (t: { status: string }) => t.status === 'lyrics_complete' || t.status === 'complete'
        ).length || 0;

        const hasAlbum = !!data.album?.share_slug;
        setProgress(getStageProgress(status, hasAlbum, trackCount));

        if (status === 'failed') {
          setError('Something went wrong backstage. Please try again.');
          return;
        }

        if (hasAlbum) {
          // Small delay so user sees 90% before redirect
          setTimeout(() => {
            if (!cancelled) router.push(`/album/${data.album.share_slug}`);
          }, 800);
          return;
        }
      } catch {
        // Silently retry
      }

      if (!cancelled) {
        setTimeout(poll, 2500);
      }
    };

    // Start polling after a short delay (give the API time to create the project)
    const timeout = setTimeout(poll, 1500);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [projectId, router]);

  // Rotate stage messages
  useEffect(() => {
    if (!projectId) return;
    const messages = STAGE_MESSAGES[projectStatus] || STAGE_MESSAGES.enriching;

    const interval = setInterval(() => {
      msgIndexRef.current = (msgIndexRef.current + 1) % messages!.length;
      setStageMessage(messages![msgIndexRef.current]);
    }, 3500);

    // Set initial message for this stage
    msgIndexRef.current = 0;
    setStageMessage(messages![0]);

    return () => clearInterval(interval);
  }, [projectId, projectStatus]);

  // Elapsed time counter
  useEffect(() => {
    if (!projectId) return;
    if (!startTimeRef.current) startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [projectId]);

  const handleCreate = useCallback(async () => {
    if (!musicalType || !idea.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create session
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicalType, idea: idea.trim() }),
      });
      const sessionData = await sessionRes.json();
      const newProjectId = sessionData.projectId;
      sessionStorage.setItem('libretto_project_id', newProjectId);

      // Step 2: Fire generation (don't await — let polling handle it)
      // When orchestrator returns (lyrics done), immediately fire audio
      fetch('/api/generate-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProjectId }),
      }).then(() => {
        fetch('/api/generate-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: newProjectId, trackNumber: 1 }),
        }).catch(() => {});
      }).catch(err => {
        console.error('Generation request failed:', err);
      });

      // Step 3: Enter loading state — polling takes over
      setProjectId(newProjectId);
    } catch (err) {
      console.error('Creation failed:', err);
      setError('Failed to start your show. Please try again.');
      setIsSubmitting(false);
    }
  }, [musicalType, idea]);

  // ===== LOADING STATE =====
  if (projectId && isSubmitting) {
    const stageLabel = STAGE_LABELS[projectStatus] || 'Working...';
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeStr = minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : `${seconds}s`;

    return (
      <main className="min-h-screen text-[#F2E8D5] flex flex-col relative overflow-hidden">
        <QuillScribeBg />

        <div className="text-center pt-8 mb-4 relative z-10">
          <Link href="/" className="marquee-title inline-block py-2 text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
            BROADWAYIFY
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 relative z-10">
          <div className="max-w-md w-full text-center gentle-fade-in">
            {error ? (
              <>
                <div className="text-5xl mb-6">🎭</div>
                <h2 className="text-2xl mb-3 text-[#F2E8D5]"
                  style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
                >
                  Technical difficulties
                </h2>
                <p className="text-[#F2E8D5]/50 mb-8" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {error}
                </p>
                <button
                  onClick={() => {
                    setProjectId(null);
                    setIsSubmitting(false);
                    setError(null);
                    setElapsedSeconds(0);
                    startTimeRef.current = null;
                  }}
                  className="px-8 py-3 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
                  style={{ fontFamily: 'var(--font-oswald)' }}
                >
                  Try again
                </button>
              </>
            ) : (
              <>
                {/* Animated spotlight */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 mx-auto rounded-full border-2 border-[#C9A84C]/30 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
                  </div>
                </div>

                {/* Stage label */}
                <h2 className="text-2xl mb-2 text-[#F2E8D5]"
                  style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
                >
                  {stageLabel}
                </h2>

                {/* Rotating flavor text */}
                <p className="text-lg text-[#F2E8D5]/50 mb-8 min-h-[28px] transition-opacity duration-500"
                  style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                >
                  {stageMessage}
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-2 bg-[#1A0F1E] rounded-full overflow-hidden border border-[#C9A84C]/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8C872] transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Timer */}
                <p className="text-xs text-[#F2E8D5]/30 tracking-wider" style={{ fontFamily: 'var(--font-oswald)' }}>
                  {timeStr} elapsed
                </p>

                {/* Reassurance for longer waits */}
                {elapsedSeconds > 20 && (
                  <p className="mt-6 text-sm text-[#F2E8D5]/30 gentle-fade-in" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
                    Great shows take time. Your playbill is being crafted with care.
                  </p>
                )}
                {elapsedSeconds > 60 && (
                  <p className="mt-3 text-sm text-[#F2E8D5]/30 gentle-fade-in" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
                    Almost there — the final touches are being added.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ===== CREATE FORM =====
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
