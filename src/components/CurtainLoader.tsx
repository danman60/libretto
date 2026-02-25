'use client';

import { useState, useEffect } from 'react';
import { ScribingAnimation } from '@/components/ScribingAnimation';
import type { Track } from '@/lib/types';

const LOADING_MESSAGES = [
  'Orchestra tuning...',
  'Casting your characters...',
  'Writing the overture...',
  'Setting the stage...',
  'Rehearsing Act I...',
  'The curtain is rising...',
  'Composing your soundtrack...',
  'Lighting the marquee...',
  'The audience takes their seats...',
  'Cue the spotlight...',
];

interface CurtainLoaderProps {
  tracks: Track[];
  isComplete: boolean;
}

export function CurtainLoader({ tracks, isComplete }: CurtainLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isComplete]);

  const completedCount = tracks.filter(t => t.status === 'complete').length;
  const totalCount = tracks.length || 6;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="text-center gentle-fade-in">
      <div className="mb-8">
        {isComplete ? (
          <h2 className="text-3xl mb-3 gold-text-static"
            style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
          >
            Your show is ready
          </h2>
        ) : (
          <>
            <h2 className="text-3xl mb-3 text-[#F2E8D5]"
              style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
            >
              Creating your musical
            </h2>
            <p className="text-[#F2E8D5]/50 text-lg mb-6 min-h-[28px] transition-opacity duration-500"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
            >
              {LOADING_MESSAGES[messageIndex]}
            </p>
            <ScribingAnimation className="w-56 h-40 mx-auto opacity-75" />
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto mb-8">
        <div className="flex justify-between text-xs text-[#F2E8D5]/40 mb-2" style={{ fontFamily: 'var(--font-oswald)' }}>
          <span className="tracking-wider uppercase">Songs completed</span>
          <span>{completedCount} / {totalCount}</span>
        </div>
        <div className="h-2 bg-[#1A0F1E] rounded-full overflow-hidden border border-[#C9A84C]/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8C872] transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Track status cards */}
      {tracks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg mx-auto">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`glass-card px-3 py-2 text-xs ${
                track.status === 'complete'
                  ? 'border-[#C9A84C]/30'
                  : track.status === 'failed'
                    ? 'border-[#6B1D2A]/50'
                    : ''
              }`}
            >
              <div className="font-medium text-[#F2E8D5] truncate" style={{ fontFamily: 'var(--font-playfair)' }}>
                {track.title}
              </div>
              <div className={
                track.status === 'complete' ? 'text-[#C9A84C]' :
                track.status === 'failed' ? 'text-[#6B1D2A]' :
                track.status === 'generating_audio' ? 'text-[#E8C872]' :
                track.status === 'generating_lyrics' ? 'text-[#F2E8D5]/50' :
                'text-[#F2E8D5]/30'
              }>
                {track.status === 'complete' ? 'Ready' :
                 track.status === 'failed' ? 'Failed' :
                 track.status === 'generating_audio' ? 'Composing...' :
                 track.status === 'generating_lyrics' ? 'Writing...' :
                 track.status === 'lyrics_done' ? 'Composing...' :
                 'Waiting...'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
