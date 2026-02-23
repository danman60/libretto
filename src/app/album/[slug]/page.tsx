'use client';

import { useEffect, useState, use, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import JSZip from 'jszip';
import { PlaybillView } from '@/components/PlaybillView';
import { TrackCard } from '@/components/TrackCard';
import { Guestbook } from '@/components/Guestbook';
import { AlbumPlayer } from '@/components/AlbumPlayer';
import { EMOTION_PALETTES } from '@/lib/mood-colors';
import { generateBooklet } from '@/lib/generate-booklet';
import { Share2, Check, Loader2, Download, PlusCircle, QrCode, Code, BookOpen } from 'lucide-react';
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
  const [playbillOpen, setPlaybillOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/album/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Album not found');
        return r.json();
      })
      .then(albumData => {
        setData(albumData);
        setTimeout(() => setRevealed(true), 200);
      })
      .catch(() => setError('Album not found'));
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    const storedProjectId = sessionStorage.getItem('libretto_project_id');
    if (storedProjectId && storedProjectId === data.album.project_id) {
      setIsCreator(true);
      // Auto-open playbill for creators so they see progress immediately
      setPlaybillOpen(true);
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

  // Poll for in-progress tracks (only track 1 matters for new shows)
  useEffect(() => {
    if (!data) return;
    const track1 = data.tracks.find((t: Track) => t.track_number === 1);
    const track1Done = !track1 || track1.status === 'complete' || track1.status === 'failed' || track1.status === 'lyrics_complete';
    const othersInProgress = data.tracks.some((t: Track) =>
      t.track_number !== 1 && t.status !== 'complete' && t.status !== 'failed' && t.status !== 'lyrics_complete' && t.status !== 'pending'
    );
    if (track1Done && !othersInProgress) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/album/${slug}`);
        if (!res.ok) return;
        const fresh = await res.json();
        setData(fresh);
      } catch { /* ignore */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [data, slug]);

  const handleGenerateTrack = useCallback(async (trackNumber: number) => {
    if (!data) return;
    try {
      const res = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: data.album.project_id, trackNumber }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('Generate track failed:', err);
        return;
      }
      // Optimistically set the track to generating_audio so UI updates immediately
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
      // Start polling for updates
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
    } catch (err) {
      console.error('Generate track error:', err);
    }
  }, [data, slug]);

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

  // Tracks 2-6 are locked if they're still pending (no lyrics generated)
  const lockedTrackNumbers = new Set(
    tracks
      .filter(t => t.track_number > 1 && t.status === 'pending')
      .map(t => t.track_number)
  );

  return (
    <main className="min-h-screen text-[#F2E8D5]" style={{ background: 'var(--mood-bg-tint, transparent)' }}>
      {/* Nav */}
      <div className="text-center pt-8">
        <Link href="/" className="marquee-title inline-block py-2 text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
          BROADWAYIFY
        </Link>
      </div>

      {/* Playbill Cover (musical only, before open) */}
      {isMusical && playbill && !playbillOpen && (
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div
            className="playbill-cover gentle-fade-in"
            onClick={() => setPlaybillOpen(true)}
          >
            <div className="playbill-cover-inner flex flex-col">
              {/* Yellow Playbill banner */}
              <div className="bg-[#FFD700] px-4 py-2.5 text-center flex-shrink-0">
                <span className="text-[#08070A] text-lg font-black tracking-[0.2em] uppercase"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  BROADWAYIFY
                </span>
              </div>

              {/* Cover art */}
              <div className="flex-1 relative overflow-hidden">
                {album.cover_image_url ? (
                  <img
                    src={album.cover_image_url}
                    alt={album.title}
                    className={`w-full h-full object-cover ${revealed ? 'reveal-blur' : 'opacity-0'}`}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-[#1A0F1E] to-[#08070A] flex items-center justify-center">
                    <span className="text-6xl gold-text-static" style={{ fontFamily: 'var(--font-playfair)' }}>B</span>
                  </div>
                )}
              </div>

              {/* Show title at bottom */}
              <div className="bg-[#08070A] px-4 py-4 text-center flex-shrink-0 border-t border-[#C9A84C]/30">
                <h2 className="text-xl text-[#F2E8D5] mb-1 truncate"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {album.title}
                </h2>
                {album.tagline && (
                  <p className="text-xs text-[#F2E8D5]/50 truncate"
                    style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                  >
                    {album.tagline}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tap to open hint */}
          <p className="text-center text-sm text-[#F2E8D5]/30 mt-4"
            style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
          >
            Tap to open your playbill
          </p>
        </section>
      )}

      {/* Opened state: full album experience */}
      {(!isMusical || !playbill || playbillOpen) && (
        <>
          {/* Header */}
          <section className="relative overflow-hidden">
            {album.cover_image_url && (
              <div
                className="absolute inset-0 opacity-15 blur-3xl scale-110"
                style={{
                  backgroundImage: `url(${album.cover_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#08070A]" />

            <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8">
                {album.cover_image_url ? (
                  <img
                    src={album.cover_image_url}
                    alt={album.title}
                    className={`w-44 h-44 sm:w-56 sm:h-56 rounded-2xl shadow-2xl shadow-black/50 object-cover flex-shrink-0 border border-[#C9A84C]/20 ${
                      revealed ? 'reveal-blur' : 'opacity-0'
                    }`}
                  />
                ) : (
                  <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl glass-card flex items-center justify-center flex-shrink-0">
                    <div className="text-5xl gold-text-static" style={{ fontFamily: 'var(--font-playfair)' }}>
                      B
                    </div>
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm tracking-[0.3em] text-[#C9A84C]/60 uppercase mb-2"
                    style={{ fontFamily: 'var(--font-oswald)' }}
                  >
                    {isMusical ? 'A Broadwayify Musical' : (
                      data.isGift && data.recipientName
                        ? `A gift for ${data.recipientName}`
                        : 'Your Broadwayify'
                    )}
                  </p>
                  <h1
                    className={`text-4xl sm:text-5xl mb-3 transition-opacity duration-1000 ${revealed ? 'opacity-100' : 'opacity-0'}`}
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {album.title}
                  </h1>
                  {album.tagline && (
                    <p className="text-lg text-[#F2E8D5]/60 italic mb-3" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      {album.tagline}
                    </p>
                  )}

                  {/* Title picker for creator */}
                  {isCreator && album.title_alternatives && album.title_alternatives.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-4">
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

                  <p className="text-sm text-[#F2E8D5]/40 mb-3" style={{ fontFamily: 'var(--font-oswald)' }}>
                    {tracks.filter(t => t.status === 'complete').length} of {tracks.length} song{tracks.length !== 1 ? 's' : ''} ready
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button onClick={handleShare} className="flex items-center gap-1.5 text-sm min-h-[44px] px-3 py-2 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors">
                      {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Share2 className="h-4 w-4" /> Share</>}
                    </button>
                    <div className="relative">
                      <button onClick={() => setShowQR(!showQR)} className="flex items-center gap-1.5 text-sm min-h-[44px] px-3 py-2 rounded-lg bg-[#1A0F1E]/50 border border-[#C9A84C]/10 text-[#F2E8D5]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-colors">
                        <QrCode className="h-4 w-4" /> QR
                      </button>
                      {showQR && (
                        <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 z-50 glass-card p-3 shadow-xl">
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
                </div>
              </div>
            </div>
          </section>

          {/* Album Player */}
          {hasCompleteTracks && (
            <section className="max-w-4xl mx-auto px-6">
              <AlbumPlayer tracks={tracks} onTrackChange={(idx) => setHighlightedTrack(idx)} />
            </section>
          )}

          {/* Content: Playbill or Legacy */}
          {isMusical && playbill ? (
            <section className="max-w-4xl mx-auto px-6 py-8">
              <PlaybillView
                playbill={playbill}
                tracks={tracks}
                showTitle={album.title}
                showTagline={album.tagline}
                highlightedTrack={highlightedTrack}
                lockedTrackNumbers={lockedTrackNumbers}
                onGenerateTrack={handleGenerateTrack}
              />
            </section>
          ) : (
            <>
              {/* Legacy: 3-column track grid */}
              <section className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tracks.map((track, i) => (
                    <TrackCard key={track.id} track={track} index={i} isHighlighted={highlightedTrack === i} />
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
            </>
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
                {downloading ? <><Loader2 className="h-5 w-5 animate-spin" /> Preparing download...</> : <><Download className="h-5 w-5" /> Download your {isMusical ? 'show' : 'album'}</>}
              </button>
              <p className="text-[#F2E8D5]/30 text-xs mt-3" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
                All tracks + cover art as a .zip file
              </p>
            </section>
          )}

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
        </>
      )}
    </main>
  );
}
