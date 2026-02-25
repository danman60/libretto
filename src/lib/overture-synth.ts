/**
 * Overture audio player.
 * Plays a preloaded audio file during the generation wait.
 * Replace /audio/overture.mp3 with your own file.
 */

const OVERTURE_SRC = '/audio/overture.mp3';

let audio: HTMLAudioElement | null = null;
let playing = false;

/**
 * Start playing the overture audio.
 * Call on user gesture (button click) to satisfy autoplay policy.
 */
export function startOverture(): () => void {
  if (playing) return stopOverture;
  if (typeof window === 'undefined') return () => {};

  try {
    audio = new Audio(OVERTURE_SRC);
    audio.loop = true;
    audio.volume = 0.3;
    audio.play().catch(() => {});
    playing = true;
  } catch {
    // Audio not available
  }

  return stopOverture;
}

/**
 * Fade out and stop the overture. ~1.5s fade.
 */
export function stopOverture(): void {
  if (!playing || !audio) return;

  const el = audio;
  const fade = setInterval(() => {
    if (el.volume > 0.02) {
      el.volume = Math.max(0, el.volume - 0.02);
    } else {
      el.pause();
      el.currentTime = 0;
      clearInterval(fade);
    }
  }, 50);

  audio = null;
  playing = false;
}

/**
 * Crossfade from overture to a real audio element.
 */
export function crossfadeToTrack(audioElement: HTMLAudioElement): void {
  if (!audio || !playing) {
    audioElement.volume = 1;
    audioElement.play().catch(() => {});
    return;
  }

  // Fade out overture
  const old = audio;
  const fadeOut = setInterval(() => {
    if (old.volume > 0.02) {
      old.volume = Math.max(0, old.volume - 0.02);
    } else {
      old.pause();
      clearInterval(fadeOut);
    }
  }, 50);

  // Fade in real track
  audioElement.volume = 0;
  audioElement.play().catch(() => {});

  let vol = 0;
  const fadeIn = setInterval(() => {
    vol += 0.05;
    if (vol >= 1) {
      audioElement.volume = 1;
      clearInterval(fadeIn);
    } else {
      audioElement.volume = vol;
    }
  }, 100);

  audio = null;
  playing = false;
}

/** Check if overture is currently playing */
export function isOvertureActive(): boolean {
  return playing;
}
