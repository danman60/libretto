'use client';

import { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { MOMENT_ROLES } from '@/lib/types';
import type { Track } from '@/lib/types';

interface TrackCardProps {
  track: Track;
  index: number; // 0, 1, 2 for cascade animation
}

export function TrackCard({ track, index }: TrackCardProps) {
  const [showLyrics, setShowLyrics] = useState(false);

  const momentRole = MOMENT_ROLES.find(r => r.role === track.narrative_role);
  const isLoading = track.status !== 'complete' && track.status !== 'failed';
  const isFailed = track.status === 'failed';

  return (
    <div className={`track-cascade track-cascade-${index + 1} glass-card p-5 flex flex-col`}>
      {/* Track number badge */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#E8A87C]/15 flex items-center justify-center text-sm font-medium text-[#E8A87C]">
          {track.track_number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#F5F0EB] font-semibold text-base truncate">{track.title}</h3>
          {momentRole && (
            <p className="text-[#9B8E99] text-sm">{momentRole.label}</p>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 text-[#B8A9C9] text-sm py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          {track.status === 'generating_lyrics' && 'Writing lyrics...'}
          {track.status === 'lyrics_done' && 'Lyrics ready, generating audio...'}
          {track.status === 'generating_audio' && 'Composing music...'}
          {track.status === 'pending' && 'Waiting to begin...'}
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <p className="text-[#D4A5A5] text-sm py-2">Generation failed</p>
      )}

      {/* Audio player */}
      {track.audio_url && track.status === 'complete' && (
        <div className="mt-1">
          <AudioPlayer src={track.audio_url} title={track.title} />
        </div>
      )}

      {/* Lyrics toggle */}
      {track.lyrics && (
        <div className="mt-3">
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className="flex items-center gap-1 text-sm text-[#9B8E99] hover:text-[#F5F0EB] transition-colors"
          >
            {showLyrics ? (
              <><ChevronUp className="h-4 w-4" /> Hide lyrics</>
            ) : (
              <><ChevronDown className="h-4 w-4" /> Show lyrics</>
            )}
          </button>
          {showLyrics && (
            <pre className="mt-3 text-sm text-[#9B8E99] whitespace-pre-wrap leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]"
              style={{ fontFamily: 'var(--font-lora)' }}
            >
              {track.lyrics}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
