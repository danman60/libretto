'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressTracker } from '@/components/ProgressTracker';
import { Disc3 } from 'lucide-react';
import type { StatusResponse } from '@/lib/types';

const POLL_INTERVAL = 5000;

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          // Small delay for the "complete" state to show
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
