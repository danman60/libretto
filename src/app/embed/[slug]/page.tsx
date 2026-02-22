'use client';

import { useEffect, useState, use } from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Loader2 } from 'lucide-react';
import type { AlbumPageData } from '@/lib/types';

export default function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<AlbumPageData | null>(null);

  useEffect(() => {
    fetch(`/api/album/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {});
  }, [slug]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#E8A87C]" />
      </div>
    );
  }

  const { album, tracks } = data;
  const completeTracks = tracks.filter(t => t.status === 'complete' && t.audio_url);

  return (
    <div className="p-4 max-w-md mx-auto bg-[#0D0B0E] min-h-screen relative z-10">
      <div className="flex items-center gap-4 mb-4">
        {album.cover_image_url ? (
          <img src={album.cover_image_url} alt={album.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/[0.08] flex items-center justify-center flex-shrink-0">
            <span className="text-xl text-[#E8A87C]/30" style={{ fontFamily: 'var(--font-dm-serif)' }}>L</span>
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg text-[#F5F0EB] font-semibold truncate" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            {album.title}
          </h1>
          {album.tagline && (
            <p className="text-xs text-[#9B8E99] italic truncate" style={{ fontFamily: 'var(--font-lora)' }}>
              {album.tagline}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {completeTracks.map(track => (
          <div key={track.id} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
            <p className="text-sm text-[#F5F0EB] mb-2">{track.track_number}. {track.title}</p>
            <AudioPlayer src={track.audio_url!} title={track.title} />
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a
          href={`/album/${slug}`}
          target="_blank"
          className="text-xs text-[#9B8E99]/50 hover:text-[#E8A87C] transition-colors"
        >
          View full album on Broadwayify
        </a>
      </div>
    </div>
  );
}
