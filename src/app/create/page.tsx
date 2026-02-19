'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProfilePicker } from '@/components/ProfilePicker';
import { MomentInput } from '@/components/MomentInput';
import { TrackCard } from '@/components/TrackCard';
import { Loader2, Gift, Mic } from 'lucide-react';
import type { MomentFormState, Track, Album } from '@/lib/types';

type CreateMode = null | 'self' | 'gift';

export default function CreatePage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [mode, setMode] = useState<CreateMode>(null);
  const [giftName, setGiftName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  // step 0 = profile picker, 1-3 = moments, 4 = waiting
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [album, setAlbum] = useState<Album | null>(null);
  const [allDone, setAllDone] = useState(false);

  // Create session when mode is chosen
  const createSession = useCallback(async (isGift: boolean) => {
    const stored = sessionStorage.getItem('libretto_project_id');
    if (stored) {
      setProjectId(stored);
      return;
    }

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isGift,
          recipientName: isGift ? giftName : undefined,
          giftMessage: isGift ? giftMessage : undefined,
        }),
      });
      const data = await res.json();
      setProjectId(data.projectId);
      sessionStorage.setItem('libretto_project_id', data.projectId);
    } catch (err) {
      console.error('Session creation failed:', err);
    }
  }, [giftName, giftMessage]);

  // Poll for track status after moments submitted
  const pollStatus = useCallback(() => {
    if (!projectId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${projectId}`);
        if (!res.ok) return;
        const data = await res.json();

        setTracks(data.tracks || []);
        if (data.album) setAlbum(data.album);

        const allTracksComplete = data.tracks?.length === 3 &&
          data.tracks.every((t: Track) => t.status === 'complete' || t.status === 'failed');
        const hasAlbum = !!data.album;

        if (allTracksComplete && hasAlbum) {
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

  // Start polling once moment 1 is submitted
  useEffect(() => {
    if (currentStep > 1 || tracks.length > 0) {
      return pollStatus();
    }
  }, [currentStep, tracks.length, pollStatus]);

  const handleModeSelect = async (selectedMode: 'self' | 'gift') => {
    if (selectedMode === 'self') {
      setMode('self');
      await createSession(false);
    } else {
      setMode('gift');
    }
  };

  const handleGiftContinue = async () => {
    if (!giftName.trim()) return;
    await createSession(true);
  };

  const handleProfileSubmit = async (data: { genres: string[]; era: string; artistReference: string }) => {
    if (!projectId) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          genres: data.genres,
          era: data.era,
          artistReference: data.artistReference || undefined,
        }),
      });
      setCurrentStep(1);
    } catch (err) {
      console.error('Profile submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMomentSubmit = async (data: MomentFormState) => {
    if (!projectId || !data.emotion) return;
    const momentIndex = currentStep; // 1, 2, or 3

    setIsSubmitting(true);
    try {
      await fetch('/api/generate-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          momentIndex,
          story: data.story,
          emotion: data.emotion,
        }),
      });

      if (momentIndex === 3) {
        await fetch('/api/generate-meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });
      }

      if (momentIndex < 3) {
        setCurrentStep(prev => prev + 1);
      } else {
        setCurrentStep(4); // waiting screen
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mode selector (pre-step)
  if (mode === null) {
    return (
      <main className="min-h-screen text-[#F5F0EB]">
        <div className="text-center pt-8 mb-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[#F5F0EB]/60 hover:text-[#F5F0EB] transition-colors" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            LIBRETTO
          </Link>
        </div>
        <div className="max-w-lg mx-auto px-6 py-16 text-center gentle-fade-in">
          <h2 className="text-3xl mb-3" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            How would you like to begin?
          </h2>
          <p className="text-[#9B8E99] mb-10" style={{ fontFamily: 'var(--font-lora)' }}>
            Tell your own story, or create a musical gift for someone you love.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleModeSelect('self')}
              className="glass-card p-6 text-left hover:border-[#E8A87C]/30 transition-colors group"
            >
              <Mic className="h-8 w-8 text-[#E8A87C] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-[#F5F0EB] mb-1">Tell your own story</h3>
              <p className="text-sm text-[#9B8E99]">Three moments from your life become three songs.</p>
            </button>

            <button
              onClick={() => handleModeSelect('gift')}
              className="glass-card p-6 text-left hover:border-[#E8A87C]/30 transition-colors group"
            >
              <Gift className="h-8 w-8 text-[#E8A87C] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-[#F5F0EB] mb-1">Make one for someone</h3>
              <p className="text-sm text-[#9B8E99]">Create a musical biography as a gift for someone special.</p>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Gift name/message input (before session creation)
  if (mode === 'gift' && !projectId) {
    return (
      <main className="min-h-screen text-[#F5F0EB]">
        <div className="text-center pt-8 mb-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[#F5F0EB]/60 hover:text-[#F5F0EB] transition-colors" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            LIBRETTO
          </Link>
        </div>
        <div className="max-w-md mx-auto px-6 py-16 gentle-fade-in">
          <div className="text-center mb-8">
            <Gift className="h-10 w-10 text-[#E8A87C] mx-auto mb-4" />
            <h2 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-dm-serif)' }}>
              Who is this for?
            </h2>
            <p className="text-[#9B8E99] text-sm" style={{ fontFamily: 'var(--font-lora)' }}>
              They&apos;ll see a special unwrapping page before the album.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#9B8E99] mb-1.5">Recipient&apos;s name</label>
              <input
                type="text"
                placeholder="e.g., Mom, Sarah, Dad"
                value={giftName}
                onChange={e => setGiftName(e.target.value)}
                maxLength={100}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-[#F5F0EB] placeholder-[#9B8E99]/50 focus:outline-none focus:border-[#E8A87C]/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9B8E99] mb-1.5">Gift message (optional)</label>
              <textarea
                placeholder="A personal note they'll see before unwrapping..."
                value={giftMessage}
                onChange={e => setGiftMessage(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-[#F5F0EB] placeholder-[#9B8E99]/50 focus:outline-none focus:border-[#E8A87C]/30 transition-colors resize-none"
              />
            </div>
            <button
              onClick={handleGiftContinue}
              disabled={!giftName.trim()}
              className="w-full py-3 rounded-full bg-[#E8A87C] text-[#1A1518] font-medium hover:brightness-110 transition-all disabled:opacity-40"
            >
              Continue
            </button>
            <button
              onClick={() => setMode(null)}
              className="w-full py-2 text-sm text-[#9B8E99] hover:text-[#F5F0EB] transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Waiting screen after all 3 moments
  if (currentStep === 4) {
    return (
      <main className="min-h-screen text-[#F5F0EB]">
        <div className="text-center pt-8 mb-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[#F5F0EB]/60 hover:text-[#F5F0EB] transition-colors" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            LIBRETTO
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2
              className="text-3xl mb-3"
              style={{ fontFamily: 'var(--font-dm-serif)' }}
            >
              {allDone ? 'Your libretto is ready' : 'Your story is taking shape'}
            </h2>
            <p className="text-[#9B8E99]" style={{ fontFamily: 'var(--font-lora)' }}>
              {allDone
                ? 'Redirecting to your album...'
                : 'Each moment is becoming music. This takes about a minute per track.'
              }
            </p>
            {!allDone && (
              <Loader2 className="h-5 w-5 animate-spin text-[#E8A87C] mx-auto mt-4" />
            )}
          </div>

          {tracks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tracks.map((track, i) => (
                <TrackCard key={track.id} track={track} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Progress dot labels: profile(0), moment1(1), moment2(2), moment3(3)
  const totalDots = 4;

  return (
    <main className="min-h-screen text-[#F5F0EB]">
      <div className="text-center pt-8 mb-4">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#F5F0EB]/60 hover:text-[#F5F0EB] transition-colors" style={{ fontFamily: 'var(--font-dm-serif)' }}>
          LIBRETTO
        </Link>
      </div>
      <div className="px-6 py-12">
        {/* Mode indicator */}
        {mode === 'gift' && (
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8A87C]/10 text-[#E8A87C] text-xs">
              <Gift className="h-3 w-3" /> Gift for {giftName}
            </span>
          </div>
        )}

        {/* Progress dots — 4 dots now */}
        <div className="flex justify-center gap-2 mb-12">
          {Array.from({ length: totalDots }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                i === currentStep
                  ? 'bg-[#E8A87C] scale-125'
                  : i < currentStep
                    ? 'bg-[#8FBC8B]'
                    : 'bg-white/[0.1]'
              }`}
            />
          ))}
        </div>

        {/* Track status indicators between moments */}
        {tracks.length > 0 && currentStep >= 1 && currentStep <= 3 && (
          <div className="max-w-[640px] mx-auto mb-8">
            <div className="flex gap-2 justify-center">
              {tracks.map(track => (
                <div
                  key={track.id}
                  className={`px-3 py-1 rounded-full text-xs ${
                    track.status === 'complete'
                      ? 'bg-[#8FBC8B]/15 text-[#8FBC8B]'
                      : track.status === 'failed'
                        ? 'bg-[#D4A5A5]/15 text-[#D4A5A5]'
                        : 'bg-[#B8A9C9]/15 text-[#B8A9C9]'
                  }`}
                >
                  Track {track.track_number}: {
                    track.status === 'complete' ? 'Ready' :
                    track.status === 'failed' ? 'Failed' :
                    track.status === 'generating_audio' ? 'Composing...' :
                    track.status === 'generating_lyrics' ? 'Writing...' :
                    'Pending'
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 0: Profile picker */}
        {currentStep === 0 && (
          <ProfilePicker
            onSubmit={handleProfileSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Steps 1-3: Moment input */}
        {currentStep >= 1 && currentStep <= 3 && (
          <MomentInput
            key={currentStep}
            momentIndex={currentStep}
            onSubmit={handleMomentSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </main>
  );
}
