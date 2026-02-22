'use client';

import { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { Track, SongRole } from '@/lib/types';

const SONG_ROLE_LABELS: Record<SongRole, string> = {
  'opening-number': 'Opening Number',
  'i-want-song': 'I Want Song',
  'confrontation': 'The Confrontation',
  'act-ii-opening': 'Act II Opening',
  'eleven-oclock': 'Eleven O\'Clock Number',
  'finale': 'Finale',
};

interface SongCardProps {
  track: Track;
  index: number;
  isHighlighted?: boolean;
  isNowPlaying?: boolean;
}

export function SongCard({ track, index, isHighlighted, isNowPlaying }: SongCardProps) {
  const [showLyrics, setShowLyrics] = useState(false);

  const isLoading = track.status !== 'complete' && track.status !== 'failed';
  const isFailed = track.status === 'failed';
  const roleLabel = track.song_role ? SONG_ROLE_LABELS[track.song_role] : null;

  return (
    <div className={`track-cascade track-cascade-${Math.min(index + 1, 3)} glass-card p-4 flex flex-col transition-all duration-300 ${
      isHighlighted || isNowPlaying ? 'ring-1 ring-[#E8A87C]/40 shadow-lg shadow-[#E8A87C]/10' : ''
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-7 h-7 rounded-full bg-[#E8A87C]/15 flex items-center justify-center text-xs font-medium text-[#E8A87C] flex-shrink-0">
          {track.track_number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#F5F0EB] font-semibold text-sm truncate">
            {track.title}
            {isNowPlaying && <span className="text-[#E8A87C] text-xs ml-2">NOW PLAYING</span>}
          </h3>
          {roleLabel && (
            <p className="text-[#9B8E99] text-xs">{roleLabel}</p>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-[#B8A9C9] text-xs py-3">
          <Loader2 className="h-3 w-3 animate-spin" />
          {track.status === 'generating_lyrics' && 'Writing lyrics...'}
          {track.status === 'lyrics_done' && 'Composing music...'}
          {track.status === 'generating_audio' && 'Composing music...'}
          {track.status === 'pending' && 'Waiting...'}
        </div>
      )}

      {isFailed && (
        <p className="text-[#D4A5A5] text-xs py-2">Generation failed</p>
      )}

      {track.audio_url && track.status === 'complete' && (
        <div className="mt-1">
          <AudioPlayer src={track.audio_url} title={track.title} coverUrl={track.cover_image_url} />
        </div>
      )}

      {track.lyrics && (
        <div className="mt-2">
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className="flex items-center gap-1 text-xs text-[#9B8E99] hover:text-[#F5F0EB] transition-colors"
          >
            {showLyrics ? (
              <><ChevronUp className="h-3 w-3" /> Hide lyrics</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Show lyrics</>
            )}
          </button>
          {showLyrics && (
            <pre className="mt-2 text-xs text-[#9B8E99] whitespace-pre-wrap leading-relaxed bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]"
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
