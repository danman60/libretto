'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import type { Track } from '@/lib/types';

interface AlbumPlayerProps {
  tracks: Track[];
  onTrackChange?: (trackIndex: number) => void;
}

export function AlbumPlayer({ tracks, onTrackChange }: AlbumPlayerProps) {
  const completeTracks = tracks.filter(t => t.status === 'complete' && t.audio_url);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioARef = useRef<HTMLAudioElement>(null);
  const audioBRef = useRef<HTMLAudioElement>(null);
  const activeRef = useRef<'A' | 'B'>('A');
  const crossfadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getActiveAudio = useCallback(() => {
    return activeRef.current === 'A' ? audioARef.current : audioBRef.current;
  }, []);

  const getNextAudio = useCallback(() => {
    return activeRef.current === 'A' ? audioBRef.current : audioARef.current;
  }, []);

  // Cleanup crossfade timer
  useEffect(() => {
    return () => {
      if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current);
    };
  }, []);

  const startCrossfade = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= completeTracks.length) return;

    const current = getActiveAudio();
    const next = getNextAudio();
    if (!current || !next) return;

    next.src = completeTracks[nextIdx].audio_url!;
    next.volume = 0;
    next.play().catch(() => {});

    const steps = 60; // 3s at 50ms intervals
    let step = 0;

    crossfadeTimerRef.current = setInterval(() => {
      step++;
      const progress = step / steps;
      if (current) current.volume = Math.max(0, 1 - progress);
      if (next) next.volume = Math.min(1, progress);

      if (step >= steps) {
        if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current);
        current.pause();
        current.volume = 1;
        activeRef.current = activeRef.current === 'A' ? 'B' : 'A';
        setCurrentIndex(nextIdx);
        onTrackChange?.(nextIdx);
      }
    }, 50);
  }, [currentIndex, completeTracks, getActiveAudio, getNextAudio, onTrackChange]);

  // Time update handler
  useEffect(() => {
    const audio = getActiveAudio();
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Start crossfade 3s before end
      if (audio.duration && audio.currentTime >= audio.duration - 3 && !crossfadeTimerRef.current) {
        startCrossfade();
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentIndex >= completeTracks.length - 1) {
        setIsPlaying(false);
        onTrackChange?.(-1);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, getActiveAudio, completeTracks.length, startCrossfade, onTrackChange]);

  if (completeTracks.length === 0) return null;

  const handlePlayAll = () => {
    const audio = getActiveAudio();
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onTrackChange?.(-1);
    } else {
      if (!audio.src || audio.src === '') {
        audio.src = completeTracks[currentIndex].audio_url!;
      }
      audio.play().catch(() => {});
      setIsPlaying(true);
      onTrackChange?.(currentIndex);
    }
  };

  const handleSkip = () => {
    if (crossfadeTimerRef.current) {
      clearInterval(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }

    const nextIdx = (currentIndex + 1) % completeTracks.length;
    const current = getActiveAudio();
    const next = getNextAudio();

    if (current) {
      current.pause();
      current.volume = 1;
    }
    if (next) {
      next.src = completeTracks[nextIdx].audio_url!;
      next.volume = 1;
      if (isPlaying) next.play().catch(() => {});
    }

    activeRef.current = activeRef.current === 'A' ? 'B' : 'A';
    setCurrentIndex(nextIdx);
    onTrackChange?.(nextIdx);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const currentTrack = completeTracks[currentIndex];

  return (
    <div className="glass-card p-4 mb-6">
      <audio ref={audioARef} preload="metadata" src={completeTracks[0]?.audio_url || ''} />
      <audio ref={audioBRef} preload="none" />

      <div className="flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          className="h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 hover:brightness-110 transition-all hover:scale-105"
          style={{ backgroundColor: 'var(--mood-accent, #E8A87C)' }}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-[#0D0B0E]" />
          ) : (
            <Play className="h-4 w-4 text-[#0D0B0E] ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm text-[#F5F0EB] truncate">{currentTrack?.title || 'Play All'}</span>
            <span className="text-[10px] text-[#9B8E99] tabular-nums ml-2 flex-shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.08] rounded-full">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{ width: `${progress}%`, backgroundColor: 'var(--mood-accent, #E8A87C)', opacity: 0.7 }}
            />
          </div>
        </div>

        <button
          onClick={handleSkip}
          className="h-8 w-8 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 hover:bg-white/[0.15] transition-colors"
        >
          <SkipForward className="h-3.5 w-3.5 text-[#9B8E99]" />
        </button>
      </div>
    </div>
  );
}
