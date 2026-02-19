'use client';

import { useEffect, useState, use, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import JSZip from 'jszip';
import { TrackCard } from '@/components/TrackCard';
import { Guestbook } from '@/components/Guestbook';
import { AlbumPlayer } from '@/components/AlbumPlayer';
import { EMOTION_PALETTES } from '@/lib/mood-colors';
import { generateBooklet } from '@/lib/generate-booklet';
import { Share2, Check, Loader2, Download, PlusCircle, QrCode, Code, BookOpen } from 'lucide-react';
import type { AlbumPageData, Track, Emotion } from '@/lib/types';

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

  // Check if viewer is creator
  useEffect(() => {
    if (!data) return;
    const storedProjectId = sessionStorage.getItem('libretto_project_id');
    if (storedProjectId && storedProjectId === data.album.project_id) {
      setIsCreator(true);
    }
  }, [data]);

  // Set mood CSS variables
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

  // Poll for in-progress tracks
  useEffect(() => {
    if (!data) return;
    const hasIncomplete = data.tracks.some((t: Track) => t.status !== 'complete' && t.status !== 'failed');
    if (!hasIncomplete) return;

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
      a.download = `${safeTitle} - Booklet.pdf`;
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
          const ext = track.audio_url!.includes('.mp3') ? 'mp3' : 'mp3';
          const safeName = track.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
          zip.file(`${String(track.track_number).padStart(2, '0')} - ${safeName}.${ext}`, blob);
        } catch {
          // Skip failed downloads
        }
      }

      if (album.cover_image_url) {
        try {
          const res = await fetch(album.cover_image_url);
          const blob = await res.blob();
          const ext = album.cover_image_url.includes('.png') ? 'png' : 'jpg';
          zip.file(`cover.${ext}`, blob);
        } catch {
          // Skip if cover fails
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = album.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      a.download = `${safeTitle} - Libretto.zip`;
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
          <h1 className="text-3xl text-[#F5F0EB] mb-3" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            Libretto not found
          </h1>
          <p className="text-[#9B8E99] text-base">This libretto may have been removed or the link is incorrect.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#9B8E99] text-base">
          <Loader2 className="h-5 w-5 animate-spin text-[#E8A87C]" />
          Loading...
        </div>
      </main>
    );
  }

  const { album, tracks } = data;
  const hasCompleteTracks = tracks.some(t => t.status === 'complete' && t.audio_url);

  return (
    <main className="min-h-screen text-[#F5F0EB]" style={{ background: 'var(--mood-bg-tint, transparent)' }}>
      {/* Nav wordmark */}
      <div className="text-center pt-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#F5F0EB]/60 hover:text-[#F5F0EB] transition-colors" style={{ fontFamily: 'var(--font-dm-serif)' }}>
          LIBRETTO
        </Link>
      </div>

      {/* Album Header */}
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D0B0E]" />

        <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8">
            {album.cover_image_url ? (
              <img
                src={album.cover_image_url}
                alt={album.title}
                className={`w-44 h-44 sm:w-56 sm:h-56 rounded-2xl shadow-2xl shadow-black/50 object-cover flex-shrink-0 ${
                  revealed ? 'reveal-blur' : 'opacity-0'
                }`}
              />
            ) : (
              <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl glass-card flex items-center justify-center flex-shrink-0">
                <div className="text-5xl text-[#E8A87C]/30" style={{ fontFamily: 'var(--font-dm-serif)' }}>
                  L
                </div>
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm tracking-widest text-[#9B8E99] uppercase mb-2">
                {data.isGift && data.recipientName
                  ? `A gift for ${data.recipientName}`
                  : 'Your Libretto'
                }
              </p>
              <h1
                className={`text-4xl sm:text-5xl mb-3 transition-opacity duration-1000 ${revealed ? 'opacity-100' : 'opacity-0'}`}
                style={{ fontFamily: 'var(--font-dm-serif)' }}
              >
                {album.title}
              </h1>
              {album.tagline && (
                <p className="text-lg text-[#B8A9C9] italic mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
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
                        className="text-xs px-3 py-1 rounded-full border border-white/[0.1] text-[#9B8E99] hover:text-[#E8A87C] hover:border-[#E8A87C]/30 transition-colors"
                      >
                        {alt.title}
                      </button>
                    )
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                <span className="text-sm text-[#9B8E99]">
                  {tracks.length} track{tracks.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[#9B8E99]/30">|</span>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-sm text-[#9B8E99] hover:text-[#E8A87C] transition-colors"
                >
                  {copied ? (
                    <><Check className="h-4 w-4" /> Copied</>
                  ) : (
                    <><Share2 className="h-4 w-4" /> Share</>
                  )}
                </button>
                <span className="text-[#9B8E99]/30">|</span>
                <div className="relative">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center gap-1.5 text-sm text-[#9B8E99] hover:text-[#E8A87C] transition-colors"
                  >
                    <QrCode className="h-4 w-4" /> QR
                  </button>
                  {showQR && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 glass-card p-3 shadow-xl">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&bgcolor=0D0B0E&color=F5F0EB`}
                        alt="QR Code"
                        className="w-[150px] h-[150px] rounded"
                      />
                    </div>
                  )}
                </div>
                <span className="text-[#9B8E99]/30">|</span>
                <button
                  onClick={handleCopyEmbed}
                  className="flex items-center gap-1.5 text-sm text-[#9B8E99] hover:text-[#E8A87C] transition-colors"
                >
                  {embedCopied ? (
                    <><Check className="h-4 w-4" /> Copied</>
                  ) : (
                    <><Code className="h-4 w-4" /> Embed</>
                  )}
                </button>
                {hasCompleteTracks && (
                  <>
                    <span className="text-[#9B8E99]/30">|</span>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="flex items-center gap-1.5 text-sm text-[#9B8E99] hover:text-[#E8A87C] transition-colors disabled:opacity-50"
                    >
                      {downloading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Zipping...</>
                      ) : (
                        <><Download className="h-4 w-4" /> Download</>
                      )}
                    </button>
                    <span className="text-[#9B8E99]/30">|</span>
                    <button
                      onClick={handleBooklet}
                      disabled={generatingBooklet}
                      className="flex items-center gap-1.5 text-sm text-[#9B8E99] hover:text-[#E8A87C] transition-colors disabled:opacity-50"
                    >
                      {generatingBooklet ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> PDF...</>
                      ) : (
                        <><BookOpen className="h-4 w-4" /> Booklet</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crossfade Album Player */}
      {hasCompleteTracks && (
        <section className="max-w-4xl mx-auto px-6">
          <AlbumPlayer
            tracks={tracks}
            onTrackChange={(idx) => setHighlightedTrack(idx)}
          />
        </section>
      )}

      {/* Tracks — 3-column grid */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tracks.map((track, i) => (
            <TrackCard
              key={track.id}
              track={track}
              index={i}
              isHighlighted={highlightedTrack === i}
            />
          ))}
        </div>

        {/* Prominent download button after tracks */}
        {hasCompleteTracks && (
          <div className="mt-8 text-center">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-[#1A1518] text-base font-medium hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--mood-accent, #E8A87C)', boxShadow: `0 10px 25px -5px var(--mood-glow, rgba(232,168,124,0.25))` }}
            >
              {downloading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Preparing your download...</>
              ) : (
                <><Download className="h-5 w-5" /> Download your album</>
              )}
            </button>
            <p className="text-[#9B8E99]/50 text-xs mt-3" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
              All tracks + cover art as a .zip file
            </p>
          </div>
        )}
      </section>

      {/* Biography */}
      {album.biography_markdown && (
        <section className="max-w-[680px] mx-auto px-6 py-12">
          <div className="border-t border-white/[0.04] pt-12">
            <h2 className="text-sm tracking-widest text-[#9B8E99] uppercase mb-6">
              The Story
            </h2>
            <div
              className="text-[#A89DAF] text-base space-y-4 [&_h1]:text-[#F5F0EB] [&_h1]:text-2xl [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-[#F5F0EB] [&_h2]:text-xl [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-[#B8A9C9] [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2 [&_strong]:text-[#B8A9C9] [&_em]:text-[#B8A9C9] [&_hr]:border-white/[0.06] [&_hr]:my-8 [&_a]:text-[#E8A87C] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#E8A87C]/20 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#9B8E99]/80"
              style={{ fontFamily: 'var(--font-lora)', lineHeight: '1.8' }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {album.biography_markdown}
              </ReactMarkdown>
            </div>
          </div>
        </section>
      )}

      {/* Guestbook */}
      <section className="max-w-[680px] mx-auto px-6 py-12">
        <div className="border-t border-white/[0.04] pt-12">
          <Guestbook slug={slug} />
        </div>
      </section>

      {/* Bottom CTA: Download + Create Another */}
      <section className="max-w-[680px] mx-auto px-6 py-12">
        <div className="border-t border-white/[0.04] pt-12 flex flex-col items-center gap-4">
          {hasCompleteTracks && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-[#1A1518] text-base font-medium hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--mood-accent, #E8A87C)', boxShadow: `0 10px 25px -5px var(--mood-glow, rgba(232,168,124,0.25))` }}
            >
              {downloading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Preparing your download...</>
              ) : (
                <><Download className="h-5 w-5" /> Save your album</>
              )}
            </button>
          )}
          <Link
            href="/create"
            onClick={handleCreateAnother}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[#E8A87C]/20 text-[#E8A87C] hover:bg-[#E8A87C]/10 transition-colors text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Create another libretto
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 text-center">
        <p className="text-sm text-[#9B8E99]/40">
          Made with{' '}
          <a href="/" className="text-[#9B8E99]/60 hover:text-[#E8A87C] transition-colors">
            Libretto
          </a>
        </p>
      </footer>
    </main>
  );
}
