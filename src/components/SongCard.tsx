'use client';

import { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { ChevronDown, ChevronUp, Loader2, Lock, Music, RotateCcw } from 'lucide-react';
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
  isLocked?: boolean;
  onGenerateTrack?: (trackNumber: number) => void;
  variant?: 'dark' | 'playbill';
}

export function SongCard({ track, index, isHighlighted, isNowPlaying, isLocked, onGenerateTrack, variant = 'dark' }: SongCardProps) {
  const [showLyrics, setShowLyrics] = useState(false);

  const isComplete = track.status === 'complete';
  const isFailed = track.status === 'failed';
  const isLyricsReady = track.status === 'lyrics_complete';
  const isGeneratingAudio = track.status === 'generating_audio';
  const isLoading = track.status === 'generating_lyrics' || track.status === 'lyrics_done' || track.status === 'pending';
  const roleLabel = track.song_role ? SONG_ROLE_LABELS[track.song_role] : null;

  const isPlaybill = variant === 'playbill';

  if (isPlaybill) {
    return (
      <div className={`py-3 ${isHighlighted || isNowPlaying ? 'bg-[#C9A84C]/10 -mx-2 px-2 rounded' : ''}`}>
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-[#8A7434] mt-0.5 flex-shrink-0 w-5 text-right"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            {track.track_number}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#1A0F1E] truncate"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {track.title}
              </h4>
              {isNowPlaying && (
                <span className="text-[10px] tracking-wider uppercase text-[#8A7434] flex-shrink-0"
                  style={{ fontFamily: 'var(--font-oswald)' }}
                >
                  NOW PLAYING
                </span>
              )}
            </div>
            {roleLabel && (
              <p className="text-xs text-[#1A0F1E]/50 mt-0.5"
                style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
              >
                {roleLabel}
              </p>
            )}

            {/* Locked state: tracks 2-6 before purchase */}
            {isLocked && (
              <div className="mt-2">
                <button
                  onClick={() => alert('Coming soon!')}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#8A7434] hover:bg-[#C9A84C]/20 transition-colors"
                  style={{ fontFamily: 'var(--font-oswald)' }}
                >
                  <Lock className="h-3 w-3" />
                  Unlock Song — $0.99
                </button>
              </div>
            )}

            {/* Lyrics-ready: show generate button */}
            {!isLocked && isLyricsReady && onGenerateTrack && (
              <button
                onClick={() => onGenerateTrack(track.track_number)}
                className="generate-btn generate-btn-playbill mt-2"
                style={{ fontFamily: 'var(--font-oswald)' }}
              >
                <Music className="h-3 w-3" />
                Generate Song
              </button>
            )}

            {/* Generating audio */}
            {!isLocked && isGeneratingAudio && (
              <div className="flex items-center gap-2 text-[#8A7434] text-xs mt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Composing music...
              </div>
            )}

            {/* Loading (lyrics phase) */}
            {!isLocked && isLoading && (
              <div className="flex items-center gap-2 text-[#1A0F1E]/40 text-xs mt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                {track.status === 'generating_lyrics' && 'Writing lyrics...'}
                {track.status === 'lyrics_done' && 'Composing music...'}
                {track.status === 'pending' && 'Waiting...'}
              </div>
            )}

            {/* Failed: show retry button */}
            {!isLocked && isFailed && onGenerateTrack && (
              <button
                onClick={() => onGenerateTrack(track.track_number)}
                className="generate-btn generate-btn-playbill mt-2"
                style={{ fontFamily: 'var(--font-oswald)' }}
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </button>
            )}

            {!isLocked && isFailed && !onGenerateTrack && (
              <p className="text-[#6B1D2A] text-xs mt-1">Generation failed</p>
            )}

            {/* Audio player for complete tracks */}
            {!isLocked && isComplete && track.audio_url && (
              <div className="mt-2">
                <AudioPlayer src={track.audio_url} title={track.title} coverUrl={track.cover_image_url} />
              </div>
            )}

            {/* Lyrics toggle */}
            {!isLocked && track.lyrics && (
              <div className="mt-2">
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className="flex items-center gap-1 text-xs text-[#1A0F1E]/40 hover:text-[#8A7434] transition-colors"
                >
                  {showLyrics ? (
                    <><ChevronUp className="h-3 w-3" /> Hide lyrics</>
                  ) : (
                    <><ChevronDown className="h-3 w-3" /> Show lyrics</>
                  )}
                </button>
                {showLyrics && (
                  <pre className="mt-2 text-xs text-[#1A0F1E]/60 whitespace-pre-wrap leading-relaxed bg-[#1A0F1E]/5 rounded-lg p-3"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
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

  // Dark variant (original)
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

      {/* Locked state: tracks 2-6 before purchase */}
      {isLocked && (
        <div className="py-2">
          <button
            onClick={() => alert('Coming soon!')}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            <Lock className="h-3 w-3" />
            Unlock Song — $0.99
          </button>
        </div>
      )}

      {/* Lyrics-ready: show generate button */}
      {!isLocked && isLyricsReady && onGenerateTrack && (
        <div className="py-2">
          <button
            onClick={() => onGenerateTrack(track.track_number)}
            className="generate-btn"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            <Music className="h-3 w-3" />
            Generate Song
          </button>
        </div>
      )}

      {/* Generating audio */}
      {!isLocked && isGeneratingAudio && (
        <div className="flex items-center gap-2 text-[#C9A84C] text-xs py-3">
          <Loader2 className="h-3 w-3 animate-spin" />
          Composing music...
        </div>
      )}

      {!isLocked && isLoading && (
        <div className="flex items-center gap-2 text-[#F2E8D5]/40 text-xs py-3">
          <Loader2 className="h-3 w-3 animate-spin" />
          {track.status === 'generating_lyrics' && 'Writing lyrics...'}
          {track.status === 'lyrics_done' && 'Composing music...'}
          {track.status === 'lyrics_complete' && 'Lyrics ready'}
          {track.status === 'pending' && 'Waiting...'}
        </div>
      )}

      {!isLocked && isFailed && onGenerateTrack && (
        <div className="py-2">
          <button
            onClick={() => onGenerateTrack(track.track_number)}
            className="generate-btn"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {!isLocked && isFailed && !onGenerateTrack && (
        <p className="text-[#6B1D2A] text-xs py-2">Generation failed</p>
      )}

      {!isLocked && isComplete && track.audio_url && (
        <div className="mt-1">
          <AudioPlayer src={track.audio_url} title={track.title} coverUrl={track.cover_image_url} />
        </div>
      )}

      {!isLocked && track.lyrics && (
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
