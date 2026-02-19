'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title: string;
  coverUrl?: string | null;
}

export function AudioPlayer({ src, title, coverUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <audio ref={audioRef} src={src} preload="metadata" />

      {coverUrl ? (
        <button
          onClick={togglePlay}
          className="relative h-9 w-9 rounded-full flex-shrink-0 overflow-hidden hover:scale-105 transition-transform"
          aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
        >
          <img
            src={coverUrl}
            alt=""
            className={`w-full h-full object-cover ${isPlaying ? 'vinyl-spinning' : 'vinyl-paused'}`}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            {isPlaying ? (
              <Pause className="h-3 w-3 text-white" />
            ) : (
              <Play className="h-3 w-3 text-white ml-0.5" />
            )}
          </div>
        </button>
      ) : (
        <button
          onClick={togglePlay}
          className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 hover:brightness-110 transition-all hover:scale-105"
          style={{ backgroundColor: 'var(--mood-accent, #E8A87C)' }}
          aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5 text-[#0D0B0E]" />
          ) : (
            <Play className="h-3.5 w-3.5 text-[#0D0B0E] ml-0.5" />
          )}
        </button>
      )}

      <div className="flex-1 space-y-1">
        <div
          className="h-1.5 bg-white/[0.08] rounded-full cursor-pointer group/bar"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full transition-all duration-100 group-hover/bar:opacity-100"
            style={{ width: `${progress}%`, backgroundColor: 'var(--mood-accent, #E8A87C)', opacity: 0.6 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#9B8E99] tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
