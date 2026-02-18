'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressTracker } from '@/components/ProgressTracker';
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

        // Redirect when complete
        if (data.project.status === 'complete' && data.album?.share_slug) {
          router.push(`/album/${data.album.share_slug}`);
          return;
        }

        if (data.project.status === 'failed') {
          setError('Album generation failed. Please try again.');
          return;
        }

        // Continue polling
        setTimeout(poll, POLL_INTERVAL);
      } catch {
        if (active) setTimeout(poll, POLL_INTERVAL);
      }
    };

    poll();

    return () => {
      active = false;
    };
  }, [projectId, router]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Creating your album
          </h1>
          <p className="text-gray-600">
            This may take several minutes. Feel free to keep this tab open.
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        ) : status ? (
          <ProgressTracker
            projectStatus={status.project.status}
            tracks={status.tracks}
          />
        ) : (
          <div className="text-center text-gray-500">
            Connecting...
          </div>
        )}
      </div>
    </main>
  );
}
