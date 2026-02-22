'use client';

import type { PlaybillContent, Track } from '@/lib/types';
import { SongCard } from './SongCard';

interface PlaybillViewProps {
  playbill: PlaybillContent;
  tracks: Track[];
  showTitle: string;
  showTagline: string | null;
  highlightedTrack: number;
}

export function PlaybillView({ playbill, tracks, showTitle, showTagline, highlightedTrack }: PlaybillViewProps) {
  const act1Tracks = tracks.filter(t => t.track_number <= 3);
  const act2Tracks = tracks.filter(t => t.track_number >= 4);

  return (
    <div className="space-y-12">
      {/* Synopsis */}
      <section>
        <h2 className="text-sm tracking-widest text-[#9B8E99] uppercase mb-4">Synopsis</h2>
        <p className="text-xs text-[#B8A9C9] mb-3" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          {playbill.setting}
        </p>
        <div
          className="text-[#A89DAF] text-base leading-relaxed space-y-3"
          style={{ fontFamily: 'var(--font-lora)', lineHeight: '1.8' }}
        >
          {playbill.synopsis.split('\n').filter(Boolean).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Cast of Characters */}
      {playbill.characters.length > 0 && (
        <section>
          <h2 className="text-sm tracking-widest text-[#9B8E99] uppercase mb-4">Cast of Characters</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {playbill.characters.map((char, i) => (
              <div key={i} className="glass-card px-4 py-3">
                <div className="font-semibold text-[#F5F0EB] text-sm">{char.name}</div>
                <div className="text-[#9B8E99] text-xs mt-0.5" style={{ fontFamily: 'var(--font-lora)' }}>
                  {char.description}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Musical Numbers */}
      <section>
        <h2 className="text-sm tracking-widest text-[#9B8E99] uppercase mb-6">Musical Numbers</h2>

        {/* Act I */}
        <div className="mb-6">
          <h3 className="text-xs tracking-widest text-[#E8A87C] uppercase mb-3">Act I</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {act1Tracks.map((track, i) => (
              <SongCard
                key={track.id}
                track={track}
                index={i}
                isHighlighted={highlightedTrack === i}
                isNowPlaying={highlightedTrack === i}
              />
            ))}
          </div>
        </div>

        {/* Intermission */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-xs tracking-widest text-[#9B8E99] uppercase">Intermission</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Act II */}
        <div>
          <h3 className="text-xs tracking-widest text-[#E8A87C] uppercase mb-3">Act II</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {act2Tracks.map((track, i) => (
              <SongCard
                key={track.id}
                track={track}
                index={i}
                isHighlighted={highlightedTrack === i + 3}
                isNowPlaying={highlightedTrack === i + 3}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
