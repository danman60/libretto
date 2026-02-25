'use client';

export function ScribingAnimation({ className = '' }: { className?: string }) {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      className={`pointer-events-none object-contain ${className}`}
    >
      <source src="/animations/scribing.webm" type="video/webm" />
      <source src="/animations/scribing.mp4" type="video/mp4" />
    </video>
  );
}
