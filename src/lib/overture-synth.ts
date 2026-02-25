/**
 * Orchestra warmup synthesizer using Web Audio API.
 * Creates a gentle, theatrical "tuning up" ambiance:
 * - Low drone (concert A foundation)
 * - Warm pad chords
 * - Gentle volume swell
 *
 * Plays during the loading wait before the show is ready.
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let nodes: AudioNode[] = [];

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function createDrone(ctx: AudioContext, freq: number, gain: number, type: OscillatorType = 'sine'): OscillatorNode {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(masterGain!);
  nodes.push(osc, g);
  return osc;
}

/**
 * Start playing the orchestra warmup ambiance.
 * Call this when the user clicks "Create My Show".
 * Returns a cleanup function.
 */
export function startOverture(): () => void {
  if (isPlaying) return stopOverture;

  const ctx = getContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);
  nodes.push(masterGain);

  // Fade in over 2 seconds
  masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);

  // Concert A drone (220Hz) — like the oboe giving the tuning note
  const drone = createDrone(ctx, 220, 0.3, 'sine');
  drone.start();

  // Fifth above (330Hz, E) — warm harmony
  const fifth = createDrone(ctx, 330, 0.15, 'sine');
  fifth.start();

  // Octave below (110Hz) — deep warmth
  const bass = createDrone(ctx, 110, 0.2, 'triangle');
  bass.start();

  // Gentle shimmer (880Hz) — high harmonic
  const shimmer = createDrone(ctx, 880, 0.03, 'sine');
  shimmer.start();

  // Subtle LFO on the shimmer for life
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.3; // very slow wobble
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain);
  lfoGain.connect(shimmer.frequency);
  lfo.start();
  nodes.push(lfo, lfoGain);

  isPlaying = true;
  return stopOverture;
}

/**
 * Fade out and stop the overture.
 * Takes ~1.5s to fade.
 */
export function stopOverture(): void {
  if (!isPlaying || !audioCtx || !masterGain) return;

  const ctx = audioCtx;
  masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

  setTimeout(() => {
    nodes.forEach(node => {
      try {
        if (node instanceof OscillatorNode) node.stop();
        node.disconnect();
      } catch { /* already stopped */ }
    });
    nodes = [];
    masterGain = null;
    isPlaying = false;
  }, 1600);
}

/**
 * Crossfade from overture to a real audio element.
 * Fades out the synth while the real audio fades in.
 */
export function crossfadeToTrack(audioElement: HTMLAudioElement): void {
  if (!audioCtx || !masterGain) {
    // No overture playing, just play the track
    audioElement.volume = 1;
    audioElement.play().catch(() => {});
    return;
  }

  const ctx = audioCtx;

  // Fade out synth over 2s
  masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);

  // Start real audio at 0 volume, fade in
  audioElement.volume = 0;
  audioElement.play().catch(() => {});

  let vol = 0;
  const fadeIn = setInterval(() => {
    vol += 0.05;
    if (vol >= 1) {
      audioElement.volume = 1;
      clearInterval(fadeIn);
      // Clean up synth nodes
      stopOverture();
    } else {
      audioElement.volume = vol;
    }
  }, 100); // 20 steps over 2s
}

/** Check if the overture is currently playing */
export function isOvertureActive(): boolean {
  return isPlaying;
}
