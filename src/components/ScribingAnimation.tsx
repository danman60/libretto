'use client';

import { useRef, useEffect } from 'react';

interface ScribingAnimationProps {
  className?: string;
  /** Playback speed — 0.5 = half speed, 0.3 = very dreamy. Default 0.4 */
  speed?: number;
}

export function ScribingAnimation({ className = '', speed = 0.4 }: ScribingAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      className={`pointer-events-none ${className}`}
    >
      <source src="/animations/scribing.webm" type="video/webm" />
      <source src="/animations/scribing.mp4" type="video/mp4" />
    </video>
  );
}
