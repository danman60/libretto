'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MusicalTypeSelector } from '@/components/MusicalTypeSelector';
import { Loader2 } from 'lucide-react';
import { ScribingAnimation } from '@/components/ScribingAnimation';
import { startOverture, stopOverture } from '@/lib/overture-synth';
import type { MusicalType, ShowConcept, PosterOption } from '@/lib/types';

const STAGE_MESSAGES: Record<string, string[]> = {
  intake: ['Raising the curtain...'],
  enriching: [
    'Imagining your world...',
    'Casting the characters...',
    'Writing the backstory...',
    'Building the dramatic arc...',
  ],
  choosing: [
    'Your show is taking shape...',
    'The orchestra is warming up...',
  ],
  generating_music: [
    'Printing the playbill...',
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
  choosing: 'Make it yours',
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
    case 'choosing': return 35;
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

  // Choice gate state
  const [showConcept, setShowConcept] = useState<ShowConcept | null>(null);
  const [posterOptions, setPosterOptions] = useState<PosterOption[] | null>(null);
  const [chosenTitle, setChosenTitle] = useState<number>(0);
  const [chosenPoster, setChosenPoster] = useState<number>(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const showConceptRef = useRef<ShowConcept | null>(null);
  const posterOptionsRef = useRef<PosterOption[] | null>(null);

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
          stopOverture();
          setError('Something went wrong backstage. Please try again.');
          return;
        }

        // Choice gate: parse concept from backstory when choosing
        if (status === 'choosing' || (showConceptRef.current && !hasAlbum)) {
          if (!showConceptRef.current && data.project?.backstory) {
            try {
              const concept = JSON.parse(data.project.backstory) as ShowConcept;
              showConceptRef.current = concept;
              setShowConcept(concept);
            } catch { /* backstory not JSON yet */ }
          }
          // Check for poster options
          if (!posterOptionsRef.current && data.project?.poster_options?.length > 0) {
            posterOptionsRef.current = data.project.poster_options;
            setPosterOptions(data.project.poster_options);
          }
        }

        // Redirect when album is ready (after finalize)
        if (hasAlbum) {
          sessionStorage.setItem('libretto_overture_active', 'true');
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

    const timeout = setTimeout(poll, 1500);
    return () => { cancelled = true; clearTimeout(timeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, router]);

  // Rotate stage messages
  useEffect(() => {
    if (!projectId) return;
    // Don't rotate messages during choice gate
    if (showConcept && projectStatus === 'choosing') return;

    const messages = STAGE_MESSAGES[projectStatus] || STAGE_MESSAGES.enriching;

    const interval = setInterval(() => {
      msgIndexRef.current = (msgIndexRef.current + 1) % messages!.length;
      setStageMessage(messages![msgIndexRef.current]);
    }, 3500);

    msgIndexRef.current = 0;
    setStageMessage(messages![0]);

    return () => clearInterval(interval);
  }, [projectId, projectStatus, showConcept]);

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
    startOverture();

    try {
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicalType, idea: idea.trim() }),
      });
      const sessionData = await sessionRes.json();
      const newProjectId = sessionData.projectId;
      sessionStorage.setItem('libretto_project_id', newProjectId);

      // Fire generation (don't await — polling handles status)
      fetch('/api/generate-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProjectId }),
      }).catch(err => {
        console.error('Generation request failed:', err);
      });

      setProjectId(newProjectId);
    } catch (err) {
      console.error('Creation failed:', err);
      stopOverture();
      setError('Failed to start your show. Please try again.');
      setIsSubmitting(false);
    }
  }, [musicalType, idea]);

  const handleFinalize = useCallback(async () => {
    if (!projectId || isFinalizing) return;
    setIsFinalizing(true);

    try {
      const res = await fetch('/api/finalize-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          titleIndex: chosenTitle,
          posterIndex: chosenPoster,
        }),
      });

      if (!res.ok) {
        console.error('Finalize returned', res.status);
        setIsFinalizing(false);
        return;
      }

      const data = await res.json();

      if (data.share_slug) {
        sessionStorage.setItem('libretto_overture_active', 'true');
        router.push(`/album/${data.share_slug}`);
      }
      // If no slug, polling will eventually redirect
    } catch (err) {
      console.error('Finalize failed:', err);
      setIsFinalizing(false);
    }
  }, [projectId, chosenTitle, chosenPoster, isFinalizing, router]);

  // ===== CHOICE GATE =====
  // Show choice gate when choosing OR when user has clicked finalize (prevents flicker to loading state)
  if (projectId && isSubmitting && showConcept && (projectStatus === 'choosing' || isFinalizing)) {
    return (
      <main className="min-h-screen text-[#F2E8D5] flex flex-col relative overflow-hidden">
        <ScribingAnimation className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-black/60 z-[1]" />

        <div className="text-center pt-8 mb-4 relative z-10">
          <Link href="/" className="marquee-title inline-block py-2 text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
            BROADWAYIFY
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 relative z-10">
          <div className="max-w-2xl w-full gentle-fade-in">
            {/* Title Picker */}
            <h2
              className="text-2xl text-center mb-6"
              style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
            >
              Name your show
            </h2>

            <div className="grid gap-3 mb-10">
              {showConcept.title_options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setChosenTitle(i)}
                  className={`text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                    chosenTitle === i
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10 shadow-lg shadow-[#C9A84C]/20'
                      : 'border-[#C9A84C]/15 bg-[#1A0F1E]/50 hover:border-[#C9A84C]/40'
                  }`}
                >
                  <div
                    className="text-lg text-[#F2E8D5] font-semibold"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {opt.title}
                  </div>
                  <div
                    className="text-sm text-[#F2E8D5]/50 mt-1"
                    style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                  >
                    {opt.tagline}
                  </div>
                </button>
              ))}
            </div>

            {/* Poster Picker */}
            <h2
              className="text-2xl text-center mb-6"
              style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
            >
              Choose your poster
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-10">
              {posterOptions ? (
                posterOptions.map((poster, i) => (
                  <button
                    key={i}
                    onClick={() => setChosenPoster(i)}
                    className={`relative aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      chosenPoster === i
                        ? 'border-[#C9A84C] shadow-lg shadow-[#C9A84C]/30 scale-[1.02]'
                        : 'border-[#C9A84C]/15 hover:border-[#C9A84C]/40'
                    }`}
                  >
                    <Image
                      src={poster.url}
                      alt={poster.label}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 30vw, 200px"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <span
                        className="text-xs text-[#F2E8D5]/70"
                        style={{ fontFamily: 'var(--font-oswald)' }}
                      >
                        {poster.label}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                // Skeleton loaders while posters generate
                [0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="aspect-[2/3] rounded-xl border-2 border-[#C9A84C]/10 bg-[#1A0F1E]/50 animate-pulse flex items-center justify-center"
                  >
                    <Loader2 className="h-6 w-6 text-[#C9A84C]/30 animate-spin" />
                  </div>
                ))
              )}
            </div>

            {/* Open the Curtain Button */}
            <div className="text-center">
              <button
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="px-12 py-4 rounded-full bg-[#C9A84C] text-[#08070A] text-lg font-semibold hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-[#C9A84C]/30 disabled:opacity-40 disabled:hover:scale-100 tracking-wide uppercase"
                style={{ fontFamily: 'var(--font-oswald)' }}
              >
                {isFinalizing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Raising the curtain...
                  </span>
                ) : (
                  'Open the Curtain'
                )}
              </button>
              {!posterOptions && (
                <p
                  className="mt-3 text-sm text-[#F2E8D5]/30"
                  style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                >
                  Poster art is still painting... you can pick a title first
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ===== LOADING STATE (enriching / generating_music / finalizing) =====
  if (projectId && isSubmitting) {
    const stageLabel = STAGE_LABELS[projectStatus] || 'Working...';
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeStr = minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : `${seconds}s`;

    return (
      <main className="min-h-screen text-[#F2E8D5] flex flex-col relative overflow-hidden">
        {/* Full-viewport scribing animation background */}
        <ScribingAnimation className="absolute inset-0 w-full h-full object-cover opacity-40" />
        {/* Dark overlay so text remains readable */}
        <div className="absolute inset-0 bg-black/50 z-[1]" />

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
                    stopOverture();
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
