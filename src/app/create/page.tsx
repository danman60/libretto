'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MomentInput } from '@/components/MomentInput';
import { TrackCard } from '@/components/TrackCard';
import { Loader2 } from 'lucide-react';
import type { MomentFormState, Track, Album } from '@/lib/types';

export default function CreatePage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [currentMoment, setCurrentMoment] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [album, setAlbum] = useState<Album | null>(null);
  const [allDone, setAllDone] = useState(false);

  // Create session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('libretto_project_id');
    if (stored) {
      setProjectId(stored);
      return;
    }

    fetch('/api/session', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setProjectId(data.projectId);
        sessionStorage.setItem('libretto_project_id', data.projectId);
      })
      .catch(console.error);
  }, []);

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

        // Check if everything is done
        const allTracksComplete = data.tracks?.length === 3 &&
          data.tracks.every((t: Track) => t.status === 'complete' || t.status === 'failed');
        const hasAlbum = !!data.album;

        if (allTracksComplete && hasAlbum) {
          setAllDone(true);
          clearInterval(interval);
          // Redirect to album page after brief delay
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
    if (currentMoment > 1 || tracks.length > 0) {
      return pollStatus();
    }
  }, [currentMoment, tracks.length, pollStatus]);

  const handleMomentSubmit = async (data: MomentFormState) => {
    if (!projectId || !data.emotion) return;

    setIsSubmitting(true);
    try {
      // Fire track generation — AI infers music style from story
      await fetch('/api/generate-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          momentIndex: currentMoment,
          story: data.story,
          emotion: data.emotion,
        }),
      });

      // If this is moment 3, also fire meta generation
      if (currentMoment === 3) {
        await fetch('/api/generate-meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });
      }

      if (currentMoment < 3) {
        setCurrentMoment(prev => prev + 1);
      } else {
        // All moments submitted — stay on page and wait for completion
        setCurrentMoment(4); // sentinel: all submitted
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Waiting screen after all 3 moments
  if (currentMoment === 4) {
    return (
      <main className="min-h-screen bg-[#0D0B0E] text-[#F5F0EB]">
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

          {/* 3-column track grid */}
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

  return (
    <main className="min-h-screen bg-[#0D0B0E] text-[#F5F0EB]">
      <div className="px-6 py-12">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-12">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                i === currentMoment
                  ? 'bg-[#E8A87C] scale-125'
                  : i < currentMoment
                    ? 'bg-[#8FBC8B]'
                    : 'bg-white/[0.1]'
              }`}
            />
          ))}
        </div>

        {/* Track status indicators between moments */}
        {tracks.length > 0 && currentMoment <= 3 && (
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

        {/* Moment input */}
        <MomentInput
          key={currentMoment}
          momentIndex={currentMoment}
          onSubmit={handleMomentSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </main>
  );
}
