'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import JSZip from 'jszip';
import { SongCard } from '@/components/SongCard';
import { Guestbook } from '@/components/Guestbook';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { AlbumPlayer } from '@/components/AlbumPlayer';
import { StageBackdrop } from '@/components/StageBackdrop';
import { EMOTION_PALETTES } from '@/lib/mood-colors';
import { generateBooklet } from '@/lib/generate-booklet';
import { stopOverture } from '@/lib/overture-synth';
import { Share2, Check, Loader2, Download, PlusCircle, QrCode, Code, BookOpen, ChevronLeft, Music } from 'lucide-react';
import type { AlbumPageData, Track, Emotion, PlaybillContent } from '@/lib/types';

export default function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<AlbumPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [generatingBooklet, setGeneratingBooklet] = useState(false);
  const [highlightedTrack, setHighlightedTrack] = useState(-1);
  const [isCreator, setIsCreator] = useState(false);
  const [programmeOpen, setProgrammeOpen] = useState(false);
  const [coverArtReady, setCoverArtReady] = useState(false);
  const [audioTriggered, setAudioTriggered] = useState(false);
  const [rehearsingToast, setRehearsingToast] = useState(false);
  const [track1Ready, setTrack1Ready] = useState(false);

  useEffect(() => {
    fetch(`/api/album/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Album not found');
        return r.json();
      })
      .then(albumData => {
        setData(albumData);
        // Preload cover art before revealing the programme
        if (albumData.album?.cover_image_url) {
          const img = new Image();
          img.onload = () => {
            setCoverArtReady(true);
            setTimeout(() => setRevealed(true), 200);
          };
          img.onerror = () => {
            setCoverArtReady(true);
            setTimeout(() => setRevealed(true), 200);
          };
          img.src = albumData.album.cover_image_url;
        } else {
          // No cover art yet — show without it
          setTimeout(() => setRevealed(true), 200);
        }
      })
      .catch(() => setError('Album not found'));
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    const storedProjectId = sessionStorage.getItem('libretto_project_id');
    if (storedProjectId && storedProjectId === data.album.project_id) {
      setIsCreator(true);
    }
  }, [data]);

  // Set mood CSS variables for legacy albums
  useEffect(() => {
    if (!data?.dominantEmotion) return;
    const palette = EMOTION_PALETTES[data.dominantEmotion as Emotion];
    if (!palette) return;
    document.documentElement.style.setProperty('--mood-accent', palette.accent);
    document.documentElement.style.setProperty('--mood-bg-tint', palette.bgTint);
    document.documentElement.style.setProperty('--mood-glow', palette.glowColor);
    return () => {
      document.documentElement.style.removeProperty('--mood-accent');
      document.documentElement.style.removeProperty('--mood-bg-tint');
      document.documentElement.style.removeProperty('--mood-glow');
    };
  }, [data?.dominantEmotion]);

  // Auto-trigger track 1 audio when lyrics are ready
  useEffect(() => {
    if (!data || audioTriggered) return;
    const track1 = data.tracks.find((t: Track) => t.track_number === 1);
    if (track1?.status === 'lyrics_complete') {
      setAudioTriggered(true);
      console.log('[album] Auto-triggering track 1 audio generation');
      fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: data.album.project_id, trackNumber: 1 }),
      }).catch(err => console.error('[album] Failed to trigger track 1:', err));
    }
  }, [data, audioTriggered]);

  // Detect when track 1 audio is ready — AudioPlayer handles the actual crossfade
  useEffect(() => {
    if (!data || track1Ready) return;
    const track1 = data.tracks.find((t: Track) => t.track_number === 1);
    if (track1?.status === 'complete' && track1.audio_url) {
      setTrack1Ready(true);
      setHighlightedTrack(0);
      sessionStorage.removeItem('libretto_overture_active');
    }
  }, [data, track1Ready]);

  // Clean up overture on unmount
  useEffect(() => {
    return () => { stopOverture(); };
  }, []);

  // Poll for in-progress tracks
  useEffect(() => {
    if (!data) return;
    const track1 = data.tracks.find((t: Track) => t.track_number === 1);
    const track1Done = !track1 || track1.status === 'complete' || track1.status === 'failed';
    const othersInProgress = data.tracks.some((t: Track) =>
      t.track_number !== 1 && t.status !== 'complete' && t.status !== 'failed' && t.status !== 'lyrics_complete' && t.status !== 'pending'
    );
    const missingCoverArt = !data.album.cover_image_url;
    if (track1Done && !othersInProgress && !missingCoverArt) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/album/${slug}`);
        if (!res.ok) return;
        const fresh = await res.json();
        setData(fresh);
        // Preload cover art when it arrives via polling
        if (fresh.album?.cover_image_url && !coverArtReady) {
          const img = new Image();
          img.onload = () => { setCoverArtReady(true); setRevealed(true); };
          img.onerror = () => { setCoverArtReady(true); setRevealed(true); };
          img.src = fresh.album.cover_image_url;
        }
      } catch { /* ignore */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [data, slug, coverArtReady]);

  const handleGenerateTrack = useCallback(async (trackNumber: number) => {
    if (!data) return;

    // Immediate optimistic update — show progress bar right away
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tracks: prev.tracks.map(t =>
          t.track_number === trackNumber
            ? { ...t, status: 'generating_audio' as const }
            : t
        ),
      };
    });

    // Fire generation in background (don't await — polling handles it)
    fetch('/api/generate-song', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: data.album.project_id, trackNumber }),
    }).catch(err => {
      console.error('Generate track failed:', err);
      // Revert optimistic update on failure
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tracks: prev.tracks.map(t =>
            t.track_number === trackNumber
              ? { ...t, status: 'lyrics_complete' as const }
              : t
          ),
        };
      });
    });

    // Poll for completion
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/album/${slug}`);
        if (!res.ok) return;
        const fresh = await res.json();
        setData(fresh);
        const track = fresh.tracks.find((t: Track) => t.track_number === trackNumber);
        if (track && (track.status === 'complete' || track.status === 'failed')) {
          clearInterval(pollInterval);
        }
      } catch { /* ignore */ }
    }, 5000);
  }, [data, slug]);

  // Auto-generate track 1 if it's pending (no user click needed)
  const autoGenFired = useRef(false);
  useEffect(() => {
    if (!data || autoGenFired.current) return;
    const track1 = data.tracks.find((t: Track) => t.track_number === 1);
    if (track1 && track1.status === 'pending') {
      autoGenFired.current = true;
      handleGenerateTrack(1);
    }
  }, [data, handleGenerateTrack]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = async () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/${slug}" width="400" height="500" frameborder="0" allow="autoplay" style="border-radius:12px;border:1px solid rgba(255,255,255,0.08)"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedCode);
    } catch { /* ignore */ }
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleBooklet = async () => {
    if (!data) return;
    setGeneratingBooklet(true);
    try {
      const blob = await generateBooklet(data.album, data.tracks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = data.album.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      a.download = `${safeTitle} - Playbill.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Booklet generation failed:', err);
    } finally {
      setGeneratingBooklet(false);
    }
  };

  const handleTitleSwitch = async (index: number) => {
    if (!data) return;
    const projectId = sessionStorage.getItem('libretto_project_id');
    if (!projectId) return;

    try {
      const res = await fetch(`/api/album/${slug}/title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, projectId }),
      });
      if (!res.ok) return;
      const result = await res.json();
      setData(prev => prev ? {
        ...prev,
        album: { ...prev.album, title: result.title, tagline: result.tagline },
      } : prev);
    } catch { /* ignore */ }
  };

  const handleDownload = useCallback(async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      const { album, tracks } = data;
      const completeTracks = tracks.filter(t => t.status === 'complete' && t.audio_url);

      for (const track of completeTracks) {
        try {
          const res = await fetch(track.audio_url!);
          const blob = await res.blob();
          const safeName = track.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
          zip.file(`${String(track.track_number).padStart(2, '0')} - ${safeName}.mp3`, blob);
        } catch { /* skip */ }
      }

      if (album.cover_image_url) {
        try {
          const res = await fetch(album.cover_image_url);
          const blob = await res.blob();
          const ext = album.cover_image_url.includes('.png') ? 'png' : 'jpg';
          zip.file(`cover.${ext}`, blob);
        } catch { /* skip */ }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = album.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      a.download = `${safeTitle} - Broadwayify.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [data]);

  const handleCreateAnother = () => {
    sessionStorage.removeItem('libretto_project_id');
  };

  // Derived values — safe when data is null (computed before early returns to keep hooks stable)
  const track1Audio = data?.tracks.find(t => t.track_number === 1);
  const canOpenProgramme = track1Audio?.status === 'complete' && !!track1Audio.audio_url;

  /** Gate programme opening — show toast if still rehearsing */
  const handleProgrammeClick = useCallback(() => {
    if (canOpenProgramme) {
      setProgrammeOpen(true);
    } else {
      setRehearsingToast(true);
      setTimeout(() => setRehearsingToast(false), 3000);
    }
  }, [canOpenProgramme]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl text-[#F2E8D5] mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
            Show not found
          </h1>
          <p className="text-[#F2E8D5]/50 text-base" style={{ fontFamily: 'var(--font-cormorant)' }}>
            This show may have been removed or the link is incorrect.
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#F2E8D5]/50 text-base">
          <Loader2 className="h-5 w-5 animate-spin text-[#C9A84C]" />
          Loading...
        </div>
      </main>
    );
  }

  const { album, tracks } = data;
  const isMusical = !!data.musicalType && !!album.playbill_content;
  const playbill = album.playbill_content as PlaybillContent | null;
  const hasCompleteTracks = tracks.some(t => t.status === 'complete' && t.audio_url);
  const showProgramme = !!album.cover_image_url && coverArtReady;
  const act1Tracks = tracks.filter(t => t.track_number <= 3);
  const act2Tracks = tracks.filter(t => t.track_number >= 4);

  const lockedTrackNumbers = new Set(
    tracks
      .filter(t => t.track_number > 1 && t.status === 'pending')
      .map(t => t.track_number)
  );

  // ===== MUSICAL: Cover + Interior with flip animation =====
  if (isMusical && playbill) {
    return (
      <main className="min-h-screen text-[#F2E8D5]">
        {/* Red velvet proscenium curtain */}
        <div className={`curtain-backdrop ${programmeOpen ? 'curtain-open' : ''}`}>
          <div className="curtain-panel curtain-panel-left" />
          <div className="curtain-panel curtain-panel-right" />
          <div className="curtain-valance" />
          <div className="curtain-proscenium" />
        </div>

        {/* Cover state */}
        {!programmeOpen && (
          <>
            <div className="relative z-10 text-center pt-12">
              <Link href="/" className="marquee-title inline-block py-2 text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
                BROADWAYIFY
              </Link>
            </div>

            <section className="relative z-10 flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-120px)]">
              {!showProgramme ? (
                <div className="text-center gentle-fade-in">
                  <div className="programme-cover-frame" style={{ opacity: 0.6 }}>
                    <div className="bg-[#1A0F1E] px-6 py-3 text-center border-b-2 border-[#C9A84C]/40">
                      <span className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase"
                        style={{ fontFamily: 'var(--font-oswald)' }}
                      >
                        BROADWAYIFY PRESENTS
                      </span>
                    </div>
                    <div className="programme-cover-art">
                      <div className="w-full h-full flex items-center justify-center animate-pulse"
                        style={{ background: 'radial-gradient(ellipse at 50% 30%, #3D1A2E 0%, #1A0F1E 60%, #08070A 100%)' }}
                      >
                        <div className="text-center px-8">
                          <h2 className="text-2xl sm:text-3xl text-[#F2E8D5]/60 mb-4"
                            style={{ fontFamily: 'var(--font-playfair)' }}
                          >
                            {album.title}
                          </h2>
                          <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]/60 mx-auto mb-3" />
                          <p className="text-[#C9A84C]/40 text-xs tracking-[0.3em] uppercase"
                            style={{ fontFamily: 'var(--font-oswald)' }}
                          >
                            The curtain is rising...
                          </p>
                        </div>
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
              ) : (
              <>
                <div
                  className="programme-cover cursor-pointer gentle-fade-in"
                  onClick={handleProgrammeClick}
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
                      {album.cover_image_url ? (
                        <img
                          src={album.cover_image_url}
                          alt={album.title}
                          className={`w-full h-full object-cover ${revealed ? 'reveal-blur' : 'opacity-0'}`}
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
                          {album.title}
                        </h1>
                        {album.tagline && (
                          <p className="text-sm text-white/70 max-w-xs mx-auto"
                            style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                          >
                            {album.tagline}
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

                <p className="text-sm text-[#F2E8D5]/30 mt-6 animate-pulse"
                  style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                >
                  {canOpenProgramme ? 'Tap to open the programme' : (
                    <span className="flex items-center justify-center gap-2">
                      <Music className="h-3.5 w-3.5 animate-pulse" />
                      The orchestra is warming up...
                    </span>
                  )}
                </p>

                {/* "Still rehearsing" toast */}
                {rehearsingToast && (
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 gentle-fade-in">
                    <div className="px-6 py-3 rounded-full bg-[#1A0F1E] border border-[#C9A84C]/30 shadow-xl shadow-black/50">
                      <p className="text-sm text-[#F2E8D5] whitespace-nowrap"
                        style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                      >
                        We&apos;re still rehearsing! The first song is almost ready...
                      </p>
                    </div>
                  </div>
                )}
              </>
              )}
            </section>
          </>
        )}

        {/* Interior state — with page flip entrance */}
        {programmeOpen && (
          <>
          <StageBackdrop />
          <div className="programme-flip-in relative z-10 min-h-screen flex flex-col">
            {/* Compact horizontal header — nav + title + actions in one row */}
            <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-[#C9A84C]/10 flex-shrink-0">
              <button
                onClick={() => setProgrammeOpen(false)}
                className="flex items-center gap-1 text-sm text-[#F2E8D5]/40 hover:text-[#C9A84C] transition-colors flex-shrink-0"
                style={{ fontFamily: 'var(--font-oswald)' }}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Cover</span>
              </button>

              <div className="flex-1 min-w-0 text-center">
                <h1 className="text-lg sm:text-xl truncate inline"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {album.title}
                </h1>
                {album.tagline && (
                  <span className="hidden md:inline text-sm text-[#F2E8D5]/40 ml-3"
                    style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                  >
                    {album.tagline}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={handleShare} className="flex items-center gap-1 text-xs min-h-[36px] px-2 py-1 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                </button>
                {hasCompleteTracks && (
                  <>
                    <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1 text-xs min-h-[36px] px-2 py-1 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors disabled:opacity-50">
                      {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={handleBooklet} disabled={generatingBooklet} className="flex items-center gap-1 text-xs min-h-[36px] px-2 py-1 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors disabled:opacity-50">
                      {generatingBooklet ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
                    </button>
                  </>
                )}
              </div>
            </header>

            {isCreator && album.title_alternatives && album.title_alternatives.length > 1 && (
              <div className="flex flex-wrap gap-1.5 justify-center px-4 py-2 border-b border-[#C9A84C]/5">
                {album.title_alternatives.map((alt, i) => (
                  alt.title !== album.title && (
                    <button
                      key={i}
                      onClick={() => handleTitleSwitch(i)}
                      className="text-[10px] px-3 py-1 rounded-full border border-[#C9A84C]/15 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-colors"
                      style={{ fontFamily: 'var(--font-oswald)' }}
                    >
                      {alt.title}
                    </button>
                  )
                ))}
              </div>
            )}

            {/* THE PROGRAMME SPREAD — fills remaining viewport */}
            <section className="flex-1 flex flex-col px-3 sm:px-6 py-3 sm:py-4">
              <div className="playbill-spread playbill-spread-enter flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 flex-1">
                  {/* LEFT PAGE — Playbill content */}
                  <div className="playbill-page border-b md:border-b-0 md:border-r border-[#C9A84C]/15 flex flex-col overflow-y-auto">
                    <div className="text-center mb-4 sm:mb-5">
                      <h2 className="text-xl sm:text-2xl md:text-3xl text-[#1A0F1E] mb-1"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {album.title}
                      </h2>
                      {album.tagline && (
                        <p className="text-sm sm:text-base text-[#1A0F1E]/50 mb-1"
                          style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                        >
                          {album.tagline}
                        </p>
                      )}
                      <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#8A7434]"
                        style={{ fontFamily: 'var(--font-oswald)' }}
                      >
                        A Musical in Two Acts
                      </p>
                    </div>

                    <div className="mb-4 sm:mb-5">
                      <div className="playbill-section-header" style={{ fontFamily: 'var(--font-oswald)' }}>
                        Synopsis
                      </div>
                      <div className="text-sm sm:text-base text-[#1A0F1E]/75 leading-relaxed"
                        style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', lineHeight: '1.7' }}
                      >
                        {playbill.synopsis.split('\n').filter(Boolean).map((paragraph, i) => (
                          <p key={i} className={i > 0 ? 'mt-2' : ''}>{paragraph}</p>
                        ))}
                      </div>
                    </div>

                    {playbill.characters.length > 0 && (
                      <div className="mb-3">
                        <div className="playbill-section-header" style={{ fontFamily: 'var(--font-oswald)' }}>
                          Cast of Characters
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          {playbill.characters.map((char, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-sm sm:text-base font-bold text-[#1A0F1E] flex-shrink-0"
                                style={{ fontFamily: 'var(--font-playfair)' }}
                              >
                                {char.name}
                              </span>
                              <span className="text-[#C9A84C]/40 flex-shrink-0">&#8212;</span>
                              <span className="text-xs sm:text-sm text-[#1A0F1E]/50 pt-0.5"
                                style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                              >
                                {char.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-[#C9A84C]/15">
                      <p className="text-xs sm:text-sm text-[#1A0F1E]/50"
                        style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                      >
                        {playbill.setting}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT PAGE — Song list */}
                  <div className="playbill-page playbill-spine flex flex-col overflow-y-auto">
                    <div className="playbill-section-header" style={{ fontFamily: 'var(--font-oswald)' }}>
                      Musical Numbers
                    </div>

                    <div className="mb-2">
                      <h4 className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-[#8A7434] mb-1"
                        style={{ fontFamily: 'var(--font-oswald)' }}
                      >
                        Act I
                      </h4>
                      <div className="divide-y divide-[#C9A84C]/10">
                        {act1Tracks.map((track, i) => (
                          <SongCard
                            key={track.id}
                            track={track}
                            index={i}
                            isHighlighted={highlightedTrack === i}
                            isNowPlaying={highlightedTrack === i}
                            isLocked={lockedTrackNumbers.has(track.track_number)}
                            onGenerateTrack={handleGenerateTrack}
                            variant="playbill"
                            autoPlay={track.track_number === 1 && track1Ready}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="playbill-intermission">
                      <span className="text-[10px] tracking-[0.3em] uppercase whitespace-nowrap"
                        style={{ fontFamily: 'var(--font-oswald)', color: '#8A7434' }}
                      >
                        Intermission
                      </span>
                    </div>

                    <div>
                      <h4 className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-[#8A7434] mb-1"
                        style={{ fontFamily: 'var(--font-oswald)' }}
                      >
                        Act II
                      </h4>
                      <div className="divide-y divide-[#C9A84C]/10">
                        {act2Tracks.map((track, i) => (
                          <SongCard
                            key={track.id}
                            track={track}
                            index={i}
                            isHighlighted={highlightedTrack === i + 3}
                            isNowPlaying={highlightedTrack === i + 3}
                            isLocked={lockedTrackNumbers.has(track.track_number)}
                            onGenerateTrack={handleGenerateTrack}
                            variant="playbill"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Download CTA */}
            {hasCompleteTracks && (
              <section className="max-w-4xl mx-auto px-6 py-8 text-center">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-[#C9A84C] text-[#08070A] text-base font-semibold hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-[#C9A84C]/30 disabled:opacity-50 tracking-wide uppercase"
                  style={{ fontFamily: 'var(--font-oswald)' }}
                >
                  {downloading ? <><Loader2 className="h-5 w-5 animate-spin" /> Preparing download...</> : <><Download className="h-5 w-5" /> Download your show</>}
                </button>
                <p className="text-[#F2E8D5]/30 text-xs mt-3" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
                  All tracks + cover art as a .zip file
                </p>
              </section>
            )}

            {/* Feedback */}
            <section className="max-w-[680px] mx-auto px-6 py-12">
              <div className="border-t border-[#C9A84C]/10 pt-12">
                <FeedbackWidget slug={slug} />
              </div>
            </section>

            {/* Guestbook */}
            <section className="max-w-[680px] mx-auto px-6 py-12">
              <div className="border-t border-[#C9A84C]/10 pt-12">
                <Guestbook slug={slug} />
              </div>
            </section>

            {/* Bottom CTA */}
            <section className="max-w-[680px] mx-auto px-6 py-12">
              <div className="border-t border-[#C9A84C]/10 pt-12 flex flex-col items-center gap-4">
                <Link
                  href="/create"
                  onClick={handleCreateAnother}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors text-sm tracking-wide"
                  style={{ fontFamily: 'var(--font-oswald)' }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Create another show
                </Link>
              </div>
            </section>

            <footer className="border-t border-[#C9A84C]/10 py-8 text-center flex-shrink-0">
              <p className="text-sm text-[#F2E8D5]/30">
                Made with <a href="/" className="text-[#F2E8D5]/40 hover:text-[#C9A84C] transition-colors">Broadwayify</a>
              </p>
            </footer>
          </div>
          </>
        )}
      </main>
    );
  }

  // ===== LEGACY (non-musical) ALBUM =====
  return (
    <main className="min-h-screen text-[#F2E8D5]" style={{ background: 'var(--mood-bg-tint, transparent)' }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div />
        <Link href="/" className="marquee-title inline-block py-2 text-xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
          BROADWAYIFY
        </Link>
        <div className="w-16" /> {/* spacer for centering */}
      </div>

      {/* Title bar + actions */}
      <section className="max-w-5xl mx-auto px-6 pt-6 pb-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl mb-1"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {album.title}
          </h1>
          {album.tagline && (
            <p className="text-base text-[#F2E8D5]/50"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
            >
              {album.tagline}
            </p>
          )}

          {/* Title picker for creator */}
          {isCreator && album.title_alternatives && album.title_alternatives.length > 1 && (
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {album.title_alternatives.map((alt, i) => (
                alt.title !== album.title && (
                  <button
                    key={i}
                    onClick={() => handleTitleSwitch(i)}
                    className="text-xs px-4 py-2 min-h-[44px] rounded-full border border-[#C9A84C]/15 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-colors flex items-center"
                    style={{ fontFamily: 'var(--font-oswald)' }}
                  >
                    {alt.title}
                  </button>
                )
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={handleShare} className="flex items-center gap-1.5 text-sm min-h-[44px] px-3 py-2 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors">
            {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Share2 className="h-4 w-4" /> Share</>}
          </button>
          <div className="relative">
            <button onClick={() => setShowQR(!showQR)} className="flex items-center gap-1.5 text-sm min-h-[44px] px-3 py-2 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors">
              <QrCode className="h-4 w-4" /> QR
            </button>
            {showQR && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 glass-card p-3 shadow-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&bgcolor=08070A&color=F2E8D5`}
                  alt="QR Code"
                  className="w-[150px] h-[150px] rounded"
                />
              </div>
            )}
          </div>
          <button onClick={handleCopyEmbed} className="flex items-center gap-1.5 text-sm min-h-[44px] px-3 py-2 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors">
            {embedCopied ? <><Check className="h-4 w-4" /> Copied</> : <><Code className="h-4 w-4" /> Embed</>}
          </button>
          {hasCompleteTracks && (
            <>
              <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1.5 text-sm min-h-[44px] px-3 py-2 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors disabled:opacity-50">
                {downloading ? <><Loader2 className="h-4 w-4 animate-spin" /> Zipping...</> : <><Download className="h-4 w-4" /> ZIP</>}
              </button>
              <button onClick={handleBooklet} disabled={generatingBooklet} className="flex items-center gap-1.5 text-sm min-h-[44px] px-3 py-2 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors disabled:opacity-50">
                {generatingBooklet ? <><Loader2 className="h-4 w-4 animate-spin" /> PDF...</> : <><BookOpen className="h-4 w-4" /> Playbill</>}
              </button>
            </>
          )}
        </div>
      </section>

      {/* Album Player — only for legacy (non-musical) albums */}
      {!isMusical && hasCompleteTracks && (
        <section className="max-w-5xl mx-auto px-6 mb-4">
          <AlbumPlayer tracks={tracks} onTrackChange={(idx) => setHighlightedTrack(idx)} />
        </section>
      )}

      {/* Legacy: 3-column track grid */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tracks.map((track, i) => (
            <SongCard key={track.id} track={track} index={i} isHighlighted={highlightedTrack === i} />
          ))}
        </div>
      </section>

      {/* Legacy: Biography */}
      {album.biography_markdown && (
        <section className="max-w-[680px] mx-auto px-6 py-12">
          <div className="border-t border-[#C9A84C]/10 pt-12">
            <h2 className="text-sm tracking-[0.3em] text-[#C9A84C]/60 uppercase mb-6" style={{ fontFamily: 'var(--font-oswald)' }}>
              The Story
            </h2>
            <div
              className="text-[#F2E8D5]/60 text-base space-y-4 [&_h1]:text-[#F2E8D5] [&_h1]:text-2xl [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-[#F2E8D5] [&_h2]:text-xl [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-[#C9A84C] [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2 [&_strong]:text-[#C9A84C] [&_em]:text-[#F2E8D5]/70 [&_hr]:border-[#C9A84C]/10 [&_hr]:my-8"
              style={{ fontFamily: 'var(--font-cormorant)', lineHeight: '1.8' }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{album.biography_markdown}</ReactMarkdown>
            </div>
          </div>
        </section>
      )}

      {/* Download CTA */}
      {hasCompleteTracks && (
        <section className="max-w-4xl mx-auto px-6 py-8 text-center">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-[#C9A84C] text-[#08070A] text-base font-semibold hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-[#C9A84C]/30 disabled:opacity-50 tracking-wide uppercase"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            {downloading ? <><Loader2 className="h-5 w-5 animate-spin" /> Preparing download...</> : <><Download className="h-5 w-5" /> Download your album</>}
          </button>
          <p className="text-[#F2E8D5]/30 text-xs mt-3" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
            All tracks + cover art as a .zip file
          </p>
        </section>
      )}

      {/* Feedback */}
      <section className="max-w-[680px] mx-auto px-6 py-12">
        <div className="border-t border-[#C9A84C]/10 pt-12">
          <FeedbackWidget slug={slug} />
        </div>
      </section>

      {/* Guestbook */}
      <section className="max-w-[680px] mx-auto px-6 py-12">
        <div className="border-t border-[#C9A84C]/10 pt-12">
          <Guestbook slug={slug} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-[680px] mx-auto px-6 py-12">
        <div className="border-t border-[#C9A84C]/10 pt-12 flex flex-col items-center gap-4">
          <Link
            href="/create"
            onClick={handleCreateAnother}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors text-sm tracking-wide"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            <PlusCircle className="h-4 w-4" />
            Create another show
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#C9A84C]/10 py-8 text-center">
        <p className="text-sm text-[#F2E8D5]/30">
          Made with <a href="/" className="text-[#F2E8D5]/40 hover:text-[#C9A84C] transition-colors">Broadwayify</a>
        </p>
      </footer>
    </main>
  );
}
