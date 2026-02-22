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
      isHighlighted || isNowPlaying ? 'ring-1 ring-[#C9A84C]/50 shadow-lg shadow-[#C9A84C]/15' : ''
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-7 h-7 rounded-full bg-[#C9A84C]/15 flex items-center justify-center text-xs font-medium text-[#C9A84C] flex-shrink-0">
          {track.track_number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#F2E8D5] font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-playfair)' }}>
            {track.title}
            {isNowPlaying && <span className="text-[#C9A84C] text-xs ml-2 tracking-wider uppercase" style={{ fontFamily: 'var(--font-oswald)' }}>NOW PLAYING</span>}
          </h3>
          {roleLabel && (
            <p className="text-[#F2E8D5]/40 text-xs" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>{roleLabel}</p>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-[#F2E8D5]/40 text-xs py-3">
          <Loader2 className="h-3 w-3 animate-spin" />
          {track.status === 'generating_lyrics' && 'Writing lyrics...'}
          {track.status === 'lyrics_done' && 'Composing music...'}
          {track.status === 'generating_audio' && 'Composing music...'}
          {track.status === 'pending' && 'Waiting...'}
        </div>
      )}

      {isFailed && (
        <p className="text-[#6B1D2A] text-xs py-2">Generation failed</p>
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
            className="flex items-center gap-1 text-xs text-[#F2E8D5]/40 hover:text-[#C9A84C] transition-colors"
          >
            {showLyrics ? (
              <><ChevronUp className="h-3 w-3" /> Hide lyrics</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Show lyrics</>
            )}
          </button>
          {showLyrics && (
            <pre className="mt-2 text-xs text-[#F2E8D5]/60 whitespace-pre-wrap leading-relaxed bg-[#1A0F1E]/30 rounded-xl p-3 border border-[#C9A84C]/10"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {track.lyrics}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
