'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressTracker } from '@/components/ProgressTracker';
import { Disc3 } from 'lucide-react';
import type { StatusResponse, Track } from '@/lib/types';

const POLL_INTERVAL = 5000;

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generatingTrackId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const kickOffNextTrack = async (tracks: Track[]) => {
      // Don't fire if we're already generating a track
      if (generatingTrackId.current) {
        // Check if the track we're generating is done
        const currentTrack = tracks.find((t) => t.id === generatingTrackId.current);
        if (currentTrack && (currentTrack.status === 'complete' || currentTrack.status === 'failed')) {
          generatingTrackId.current = null;
        } else {
          return; // Still generating
        }
      }

      // Also bail if any track is currently generating_audio (could be from a previous session)
      const alreadyGenerating = tracks.find((t) => t.status === 'generating_audio');
      if (alreadyGenerating) {
        generatingTrackId.current = alreadyGenerating.id;
        return;
      }

      // Find the next track that needs audio generation
      const nextTrack = tracks.find(
        (t) => t.status === 'lyrics_done' && t.lyrics && !t.audio_url
      );
      if (!nextTrack) return;

      generatingTrackId.current = nextTrack.id;

      try {
        await fetch('/api/generate-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, trackId: nextTrack.id }),
        });
      } catch (err) {
        console.error('Failed to kick off track generation:', err);
        generatingTrackId.current = null;
      }
    };

    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${projectId}`);
        if (!res.ok) {
          setError('Failed to fetch status');
          return;
        }
        const data: StatusResponse = await res.json();
        if (!active) return;
        setStatus(data);

        if (data.project.status === 'complete' && data.album?.share_slug) {
          setTimeout(() => router.push(`/album/${data.album!.share_slug}`), 1500);
          return;
        }

        if (data.project.status === 'failed') {
          setError('Something went wrong during generation. Please try again.');
          return;
        }

        // Drive per-track music generation from the client
        if (data.project.status === 'generating_music' && data.tracks.length > 0) {
          kickOffNextTrack(data.tracks);
        }

        setTimeout(poll, POLL_INTERVAL);
      } catch {
        if (active) setTimeout(poll, POLL_INTERVAL);
      }
    };

    poll();
    return () => { active = false; };
  }, [projectId, router]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(120,80,200,0.06)_0%,_transparent_60%)]" />

      <div className="relative max-w-sm w-full mx-auto px-6">
        {/* Spinning disc */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <Disc3 className="h-16 w-16 text-gray-700 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#0a0a0a]" />
            </div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-xl font-semibold text-white mb-2">
            Creating your album
          </h1>
          <p className="text-sm text-gray-500">
            This takes a few minutes. Keep this tab open.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : status ? (
          <ProgressTracker
            projectStatus={status.project.status}
            tracks={status.tracks}
          />
        ) : (
          <div className="text-center text-gray-600 text-sm">
            Connecting...
          </div>
        )}
      </div>
    </main>
  );
}
