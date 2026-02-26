'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MusicalTypeSelector } from '@/components/MusicalTypeSelector';
import { Loader2, RotateCcw, Pen } from 'lucide-react';
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

  // Custom title state
  const [customTitle, setCustomTitle] = useState('');
  const [isCustomTitle, setIsCustomTitle] = useState(false);

  // Regen state
  const [titleRegenCount, setTitleRegenCount] = useState(0);
  const [posterRegenCount, setPosterRegenCount] = useState(0);
  const [isRegenningTitles, setIsRegenningTitles] = useState(false);
  const [isRegenningPosters, setIsRegenningPosters] = useState(false);

  // Programme preview state
  const [showProgrammePreview, setShowProgrammePreview] = useState(false);
  const [programmeVisible, setProgrammeVisible] = useState(false);

  // Poll for status once we have a projectId
  const prevStatusRef = useRef<string>('');
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${projectId}`);
        if (!res.ok) {
          console.warn(`[poll] Status fetch failed: ${res.status}`);
          if (!cancelled) setTimeout(poll, 2500);
          return;
        }
        const data = await res.json();

        if (cancelled) return;

        const status = data.project?.status || 'intake';

        // Log status transitions
        if (prevStatusRef.current !== status) {
          console.log(`[poll] Status: ${prevStatusRef.current || '(init)'} → ${status}`);
          prevStatusRef.current = status;
        }

        setProjectStatus(status);

        const trackCount = data.tracks?.filter(
          (t: { status: string }) => t.status === 'lyrics_complete' || t.status === 'complete'
        ).length || 0;

        const hasAlbum = !!data.album?.share_slug;
        setProgress(getStageProgress(status, hasAlbum, trackCount));

        if (status === 'failed') {
          console.error('[poll] Project failed');
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
              console.log(`[poll] Concept loaded: "${concept.title_options[0]?.title}" + ${concept.title_options.length} titles`);
            } catch { /* backstory not JSON yet */ }
          }
          // Check for poster options
          if (!posterOptionsRef.current && data.project?.poster_options?.length > 0) {
            posterOptionsRef.current = data.project.poster_options;
            setPosterOptions(data.project.poster_options);
            console.log(`[poll] Poster options loaded: ${data.project.poster_options.length} variants`);
          }
        }

        // Redirect when album is ready (after finalize)
        if (hasAlbum) {
          console.log(`[poll] Album ready! slug=${data.album.share_slug} — redirecting`);
          sessionStorage.setItem('libretto_overture_active', 'true');
          setTimeout(() => {
            if (!cancelled) router.push(`/album/${data.album.share_slug}`);
          }, showProgrammePreview ? 2500 : 800);
          return;
        }
      } catch (err) {
        console.warn('[poll] Network error:', err);
      }

      if (!cancelled) {
        setTimeout(poll, 2500);
      }
    };

    const timeout = setTimeout(poll, 1500);
    return () => { cancelled = true; clearTimeout(timeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, router, showProgrammePreview]);

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

    console.log(`[create] Starting show: type=${musicalType}, idea="${idea.trim().slice(0, 50)}..."`);
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
      console.log(`[create] Session created: ${newProjectId}`);
      sessionStorage.setItem('libretto_project_id', newProjectId);

      // Fire generation (don't await — polling handles status)
      fetch('/api/generate-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProjectId }),
      }).then(res => {
        if (!res.ok) console.error(`[create] generate-track returned ${res.status}`);
        else console.log('[create] generate-track fired OK');
      }).catch(err => {
        console.error('[create] generate-track network error:', err);
      });

      setProjectId(newProjectId);
    } catch (err) {
      console.error('[create] Session creation failed:', err);
      stopOverture();
      setError('Failed to start your show. Please try again.');
      setIsSubmitting(false);
    }
  }, [musicalType, idea]);

  const handleFinalize = useCallback(async () => {
    if (!projectId || isFinalizing) return;

    const titleLabel = isCustomTitle ? `custom: "${customTitle.trim()}"` : `option ${chosenTitle}`;
    console.log(`[finalize] Starting: title=${titleLabel}, poster=${chosenPoster}`);

    setIsFinalizing(true);
    setShowProgrammePreview(true);
    // Trigger fade-in after a tick
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setProgrammeVisible(true));
    });

    try {
      const res = await fetch('/api/finalize-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          titleIndex: isCustomTitle ? 0 : chosenTitle,
          posterIndex: chosenPoster,
          ...(isCustomTitle && customTitle.trim() ? { customTitle: customTitle.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error(`[finalize] Failed: ${res.status}`, body);
        // Stay on programme preview — poller will detect album or we retry
        // Only bail if it's a real client error (not 409 which means already finalized)
        if (res.status !== 409) {
          setIsFinalizing(false);
          setShowProgrammePreview(false);
          setProgrammeVisible(false);
        } else {
          console.log('[finalize] 409 = already finalized, waiting for poller to find album');
        }
        return;
      }

      const data = await res.json();
      console.log(`[finalize] Success! share_slug=${data.share_slug}`);

      if (data.share_slug) {
        // Wait a moment so user sees the programme preview, then redirect
        sessionStorage.setItem('libretto_overture_active', 'true');
        setTimeout(() => {
          router.push(`/album/${data.share_slug}`);
        }, 1500);
      }
      // If no slug, polling will eventually redirect
    } catch (err) {
      console.error('[finalize] Network error:', err);
      // Network error — bail back to choice gate
      setIsFinalizing(false);
      setShowProgrammePreview(false);
      setProgrammeVisible(false);
    }
  }, [projectId, chosenTitle, chosenPoster, isFinalizing, isCustomTitle, customTitle, router]);

  const handleRegenTitles = useCallback(async () => {
    if (!projectId || isRegenningTitles || titleRegenCount >= 2) return;
    console.log(`[regen-titles] Attempt ${titleRegenCount + 1}/2`);
    setIsRegenningTitles(true);

    try {
      const res = await fetch('/api/regen-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        console.error(`[regen-titles] Failed: ${res.status}`);
        setIsRegenningTitles(false);
        return;
      }

      const data = await res.json();
      if (data.title_options) {
        console.log(`[regen-titles] Got ${data.title_options.length} new titles:`, data.title_options.map((t: { title: string }) => t.title));
        setShowConcept(prev => prev ? { ...prev, title_options: data.title_options } : prev);
        showConceptRef.current = showConceptRef.current
          ? { ...showConceptRef.current, title_options: data.title_options }
          : null;
        setChosenTitle(0);
        setIsCustomTitle(false);
        setCustomTitle('');
        setTitleRegenCount(c => c + 1);
      }
    } catch (err) {
      console.error('[regen-titles] Network error:', err);
    } finally {
      setIsRegenningTitles(false);
    }
  }, [projectId, isRegenningTitles, titleRegenCount]);

  const handleRegenPosters = useCallback(async () => {
    if (!projectId || isRegenningPosters || posterRegenCount >= 2) return;
    console.log(`[regen-posters] Attempt ${posterRegenCount + 1}/2 for project ${projectId.slice(0, 8)}`);
    setIsRegenningPosters(true);
    setPosterOptions(null);
    posterOptionsRef.current = null;

    try {
      const res = await fetch('/api/regen-posters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[regen-posters] Failed with status ${res.status}:`, body);
        setIsRegenningPosters(false);
        return;
      }

      const data = await res.json();
      if (data.poster_options?.length) {
        console.log(`[regen-posters] Received ${data.poster_options.length} new variants:`, data.poster_options.map((p: { label: string }) => p.label));
        setPosterOptions(data.poster_options);
        posterOptionsRef.current = data.poster_options;
        setChosenPoster(0);
        setPosterRegenCount(c => c + 1);
      } else {
        console.warn('[regen-posters] Response had no poster_options');
      }
    } catch (err) {
      console.error('[regen-posters] Network/parse error:', err);
    } finally {
      setIsRegenningPosters(false);
    }
  }, [projectId, isRegenningPosters, posterRegenCount]);

  // Derive the chosen title text and tagline for programme preview
  const chosenTitleText = isCustomTitle && customTitle.trim()
    ? customTitle.trim()
    : showConcept?.title_options[chosenTitle]?.title || '';
  const chosenTagline = isCustomTitle
    ? ''
    : showConcept?.title_options[chosenTitle]?.tagline || '';
  const chosenPosterUrl = posterOptions?.[chosenPoster]?.url;

  // ===== PROGRAMME PREVIEW (after clicking finalize) =====
  // This takes priority over EVERYTHING — once finalize is clicked, we stay here until redirect
  if (showProgrammePreview) {
    return (
      <main className="min-h-screen text-[#F2E8D5] flex flex-col relative overflow-hidden">
        <ScribingAnimation className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-black/60 z-[1]" />

        <div className="text-center pt-8 mb-4 relative z-10">
          <Link href="/" className="marquee-title inline-block py-2 text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
            BROADWAYIFY
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
          <div
            className={`programme-cover transition-opacity duration-[1500ms] ${programmeVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="programme-cover-frame">
              <div className="bg-[#1A0F1E] px-6 py-3 text-center border-b-2 border-[#C9A84C]/40">
                <span className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase"
                  style={{ fontFamily: 'var(--font-oswald)' }}
                >
                  BROADWAYIFY PRESENTS
                </span>
              </div>

              <div className="programme-cover-art">
                {chosenPosterUrl ? (
                  <img
                    src={chosenPosterUrl}
                    alt={chosenTitleText}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'radial-gradient(ellipse at 50% 30%, #3D1A2E 0%, #1A0F1E 60%, #08070A 100%)' }}
                  />
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20 pb-6 px-6 text-center">
                  <h1 className="text-3xl sm:text-4xl text-white mb-2 drop-shadow-lg"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {chosenTitleText}
                  </h1>
                  {chosenTagline && (
                    <p className="text-sm text-white/70 max-w-xs mx-auto"
                      style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                    >
                      {chosenTagline}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-[#1A0F1E] px-6 py-3 text-center border-t-2 border-[#C9A84C]/40">
                <span className="text-[#C9A84C]/50 text-[10px] tracking-[0.3em] uppercase"
                  style={{ fontFamily: 'var(--font-oswald)' }}
                >
                  A Musical in Two Acts
                </span>
              </div>
            </div>
          </div>

          <p
            className={`mt-6 text-sm text-[#F2E8D5]/50 flex items-center gap-2 transition-opacity duration-[1500ms] ${programmeVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
          >
            <Loader2 className="h-4 w-4 animate-spin text-[#C9A84C]/50" />
            Raising the curtain...
          </p>
        </div>
      </main>
    );
  }

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

        <div className="flex-1 flex items-start justify-center px-4 py-6 relative z-10 overflow-y-auto">
          <div className="max-w-2xl w-full">
            {/* Title Picker — animated section */}
            <div className="choice-section-enter choice-section-enter-titles">
              <h2
                className="text-2xl text-center mb-6"
                style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
              >
                Name your show
              </h2>

              <div className="grid gap-3 mb-3">
                {showConcept.title_options.map((opt, i) => (
                  <button
                    key={`title-${i}`}
                    onClick={() => { setChosenTitle(i); setIsCustomTitle(false); }}
                    disabled={isRegenningTitles}
                    className={`choice-card-enter choice-card-enter-${i + 1} text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                      !isCustomTitle && chosenTitle === i
                        ? 'border-[#C9A84C] bg-[#C9A84C]/10 shadow-lg shadow-[#C9A84C]/20'
                        : 'border-[#C9A84C]/15 bg-[#1A0F1E]/50 hover:border-[#C9A84C]/40'
                    } ${isRegenningTitles ? 'opacity-50' : ''}`}
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

                {/* Custom Title Card */}
                <button
                  onClick={() => setIsCustomTitle(true)}
                  className={`choice-card-enter choice-card-enter-4 text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                    isCustomTitle
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10 shadow-lg shadow-[#C9A84C]/20'
                      : 'border-[#C9A84C]/15 bg-[#1A0F1E]/50 hover:border-[#C9A84C]/40 border-dashed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Pen className="h-4 w-4 text-[#C9A84C]/60" />
                    <span
                      className="text-lg text-[#F2E8D5]/70 font-semibold"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Write your own
                    </span>
                  </div>
                  {isCustomTitle && (
                    <input
                      type="text"
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      placeholder="Your show title..."
                      maxLength={60}
                      autoFocus
                      className="mt-3 w-full bg-[#1A0F1E]/80 border border-[#C9A84C]/30 rounded-lg px-3 py-2 text-[#F2E8D5] placeholder-[#F2E8D5]/30 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    />
                  )}
                </button>
              </div>

              {/* Regen Titles Button */}
              <div className="text-center mb-10">
                <button
                  onClick={handleRegenTitles}
                  disabled={isRegenningTitles || titleRegenCount >= 2}
                  className="text-sm text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 mx-auto"
                  style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                >
                  {isRegenningTitles ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  {titleRegenCount >= 2 ? 'No more rerolls (2/2)' : isRegenningTitles ? 'Dreaming up new titles...' : 'Try new titles'}
                </button>
              </div>
            </div>

            {/* Poster Picker — animated section with delay */}
            <div className="choice-section-enter choice-section-enter-posters">
              <h2
                className="text-2xl text-center mb-6"
                style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
              >
                Choose your poster
              </h2>

              <div className="grid grid-cols-3 gap-3 mb-3">
                {posterOptions && !isRegenningPosters ? (
                  posterOptions.map((poster, i) => (
                    <button
                      key={`poster-${i}`}
                      onClick={() => setChosenPoster(i)}
                      className={`choice-card-enter choice-card-enter-${i + 1} relative aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
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

              {/* Regen Posters Button */}
              <div className="text-center mb-10">
                {posterOptions && !isRegenningPosters ? (
                  <button
                    onClick={handleRegenPosters}
                    disabled={posterRegenCount >= 2}
                    className="text-sm text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 mx-auto"
                    style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {posterRegenCount >= 2 ? 'No more rerolls (2/2)' : 'Try new posters'}
                  </button>
                ) : !posterOptions && !isRegenningPosters ? (
                  <p
                    className="text-sm text-[#F2E8D5]/30"
                    style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                  >
                    Poster art is still painting...
                  </p>
                ) : null}
              </div>
            </div>

            {/* Open the Curtain Button */}
            <div className="text-center pb-4">
              <button
                onClick={handleFinalize}
                disabled={isFinalizing || (isCustomTitle && !customTitle.trim())}
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
    <main className="min-h-screen text-[#F2E8D5] flex flex-col">
      <div className="text-center pt-6 mb-2">
        <Link href="/" className="marquee-title inline-block py-2 text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
          BROADWAYIFY
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full px-6 pb-6 gentle-fade-in">
        {/* Side-by-side: genre left, idea right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left: Genre selector */}
          <div>
            <h2 className="text-2xl mb-4 text-center md:text-left"
              style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
            >
              What kind of show?
            </h2>
            <MusicalTypeSelector selected={musicalType} onSelect={setMusicalType} />
            {!musicalType && (
              <p className="text-center md:text-left text-sm text-[#F2E8D5]/30 mt-4" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
                Tap a genre to continue
              </p>
            )}
          </div>

          {/* Right: Idea + submit */}
          <div className={`transition-opacity duration-500 ${musicalType ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <label className="block text-2xl text-[#F2E8D5] mb-4 text-center md:text-left"
              style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
            >
              What&apos;s your show about?
            </label>
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder="A janitor at a space station who discovers she's the last person who remembers Earth's music..."
              rows={4}
              maxLength={500}
              disabled={!musicalType}
              className="w-full bg-[#1A0F1E]/50 border border-[#C9A84C]/15 rounded-xl px-4 py-3 text-[#F2E8D5] placeholder-[#F2E8D5]/30 focus:outline-none focus:border-[#C9A84C]/40 transition-colors resize-none disabled:opacity-50"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#F2E8D5]/30">{idea.length}/500</span>
            </div>

            <div className="mt-6 text-center md:text-left">
              <button
                onClick={handleCreate}
                disabled={!musicalType || !idea.trim() || isSubmitting}
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
        </div>
      </div>
    </main>
  );
}
