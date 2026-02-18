'use client';

import { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { NARRATIVE_ROLES } from '@/lib/types';
import type { Track } from '@/lib/types';

interface TrackCardProps {
  track: Track;
}

export function TrackCard({ track }: TrackCardProps) {
  const [showLyrics, setShowLyrics] = useState(false);

  const roleInfo = NARRATIVE_ROLES.find((r) => r.role === track.narrative_role);

  return (
    <div className="group rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {/* Track number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-medium text-gray-500 group-hover:text-gray-300 transition-colors">
          {track.track_number}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + role */}
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{track.title}</h3>
            {roleInfo && (
              <span className="text-xs text-gray-600 flex-shrink-0">
                {roleInfo.description}
              </span>
            )}
          </div>

          {/* Audio player */}
          {track.audio_url && (
            <div className="mt-3">
              <AudioPlayer src={track.audio_url} title={track.title} />
            </div>
          )}

          {/* Lyrics toggle */}
          {track.lyrics && (
            <div className="mt-3">
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showLyrics ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Hide lyrics
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Show lyrics
                  </>
                )}
              </button>
              {showLyrics && (
                <pre className="mt-3 text-sm text-gray-500 whitespace-pre-wrap font-sans leading-relaxed bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
                  {track.lyrics}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
