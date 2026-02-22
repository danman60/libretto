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
      <section className="playbill-card p-8">
        <h2 className="text-sm tracking-[0.3em] text-[#6B1D2A] uppercase mb-4"
          style={{ fontFamily: 'var(--font-oswald)' }}
        >
          Synopsis
        </h2>
        <p className="text-xs text-[#1A0F1E]/60 mb-3" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
          {playbill.setting}
        </p>
        <div className="text-[#1A0F1E]/80 text-base leading-relaxed space-y-3"
          style={{ fontFamily: 'var(--font-cormorant)', lineHeight: '1.8' }}
        >
          {playbill.synopsis.split('\n').filter(Boolean).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Cast of Characters */}
      {playbill.characters.length > 0 && (
        <section>
          <h2 className="text-sm tracking-[0.3em] text-[#C9A84C]/60 uppercase mb-4"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            Cast of Characters
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {playbill.characters.map((char, i) => (
              <div key={i} className="glass-card px-4 py-3">
                <div className="font-semibold text-[#F2E8D5] text-sm" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {char.name}
                </div>
                <div className="text-[#F2E8D5]/50 text-xs mt-0.5" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {char.description}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Musical Numbers */}
      <section>
        <h2 className="text-sm tracking-[0.3em] text-[#C9A84C]/60 uppercase mb-6"
          style={{ fontFamily: 'var(--font-oswald)' }}
        >
          Musical Numbers
        </h2>

        {/* Act I */}
        <div className="mb-6">
          <h3 className="text-xs tracking-[0.3em] text-[#C9A84C] uppercase mb-3"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            Act I
          </h3>
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
        <div className="intermission-divider my-8">
          <span className="text-xs tracking-[0.3em] text-[#C9A84C]/60 uppercase whitespace-nowrap"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            Intermission
          </span>
        </div>

        {/* Act II */}
        <div>
          <h3 className="text-xs tracking-[0.3em] text-[#C9A84C] uppercase mb-3"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            Act II
          </h3>
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
