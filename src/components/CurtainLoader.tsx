'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
          <h2
            className="text-3xl mb-3 text-[#F5F0EB]"
            style={{ fontFamily: 'var(--font-dm-serif)' }}
          >
            Your show is ready
          </h2>
        ) : (
          <>
            <h2
              className="text-3xl mb-3 text-[#F5F0EB]"
              style={{ fontFamily: 'var(--font-dm-serif)' }}
            >
              Creating your musical
            </h2>
            <p
              className="text-[#9B8E99] text-lg mb-6 min-h-[28px] transition-opacity duration-500"
              style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}
            >
              {LOADING_MESSAGES[messageIndex]}
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-[#E8A87C] mx-auto" />
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto mb-8">
        <div className="flex justify-between text-xs text-[#9B8E99] mb-2">
          <span>Songs completed</span>
          <span>{completedCount} / {totalCount}</span>
        </div>
        <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#E8A87C] transition-all duration-1000 ease-out"
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
                  ? 'border-[#8FBC8B]/30'
                  : track.status === 'failed'
                    ? 'border-[#D4A5A5]/30'
                    : ''
              }`}
            >
              <div className="font-medium text-[#F5F0EB] truncate">{track.title}</div>
              <div className={
                track.status === 'complete' ? 'text-[#8FBC8B]' :
                track.status === 'failed' ? 'text-[#D4A5A5]' :
                track.status === 'generating_audio' ? 'text-[#E8A87C]' :
                track.status === 'generating_lyrics' ? 'text-[#B8A9C9]' :
                'text-[#9B8E99]'
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
