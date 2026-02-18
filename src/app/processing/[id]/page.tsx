'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressTracker } from '@/components/ProgressTracker';
import { Disc3 } from 'lucide-react';
import type { StatusResponse } from '@/lib/types';

const POLL_INTERVAL = 5000;

const QUOTES = [
  'Every life is a story worth telling.',
  'Music is the shorthand of emotion.',
  'Your wounds are the places where the light enters you.',
  'The unexamined life may not be worth living, but the examined one is no picnic either.',
  'We are all just walking each other home.',
  'Stories are the creative conversion of life itself.',
  'Music gives a soul to the universe, wings to the mind, flight to the imagination.',
  'The most powerful person in the world is the storyteller.',
  'What matters most is how well you walk through the fire.',
  'Every song is a chapter. Every lyric, a confession.',
  'Healing is not linear, but it always moves forward.',
  'Your story didn\'t break you. It built you.',
  'In the middle of difficulty lies opportunity.',
  'There is no greater agony than bearing an untold story inside you.',
  'Art enables us to find ourselves and lose ourselves at the same time.',
  'The wound is the place where the Light enters you.',
  'You are allowed to be both a masterpiece and a work in progress.',
  'One good thing about music — when it hits you, you feel no pain.',
  'Life isn\'t about finding yourself. It\'s about creating yourself.',
  'The soul would have no rainbow had the eyes no tears.',
  'Music expresses that which cannot be said and on which it is impossible to be silent.',
  'Your life is your message to the world. Make sure it\'s inspiring.',
  'Every turning point is a new verse waiting to be written.',
  'The only way out is through.',
  'What we achieve inwardly will change outer reality.',
];

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteKey, setQuoteKey] = useState(0);

  // Rotate quotes every 8 seconds
  const rotateQuote = useCallback(() => {
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    setQuoteKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const interval = setInterval(rotateQuote, 8000);
    return () => clearInterval(interval);
  }, [rotateQuote]);

  useEffect(() => {
    let active = true;

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
            Creating your libretto
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

        {/* Rotating inspirational quotes */}
        <div className="mt-10 h-16 flex items-center justify-center">
          <p
            key={quoteKey}
            className="text-center text-sm italic text-gray-600 quote-animate max-w-xs"
          >
            &ldquo;{QUOTES[quoteIndex]}&rdquo;
          </p>
        </div>
      </div>
    </main>
  );
}
