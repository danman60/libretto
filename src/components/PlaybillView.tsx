'use client';

import type { PlaybillContent, Track } from '@/lib/types';
import { SongCard } from './SongCard';

interface PlaybillViewProps {
  playbill: PlaybillContent;
  tracks: Track[];
  showTitle: string;
  showTagline: string | null;
  highlightedTrack: number;
  lockedTrackNumbers?: Set<number>;
  onGenerateTrack?: (trackNumber: number) => void;
}

export function PlaybillView({ playbill, tracks, showTitle, showTagline, highlightedTrack, lockedTrackNumbers, onGenerateTrack }: PlaybillViewProps) {
  const act1Tracks = tracks.filter(t => t.track_number <= 3);
  const act2Tracks = tracks.filter(t => t.track_number >= 4);

  return (
    <div className="playbill-spread playbill-spread-enter">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left Page */}
        <div className="playbill-page border-b md:border-b-0 md:border-r border-[#C9A84C]/15">
          {/* Title block */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl text-[#1A0F1E] mb-1"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {showTitle}
            </h2>
            <p className="text-xs tracking-[0.2em] uppercase text-[#8A7434]"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              A Musical in Two Acts
            </p>
          </div>

          {/* Synopsis */}
          <div className="mb-6">
            <div className="playbill-section-header" style={{ fontFamily: 'var(--font-oswald)' }}>
              Synopsis
            </div>
            <div className="text-sm text-[#1A0F1E]/75 leading-relaxed"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', lineHeight: '1.7' }}
            >
              {playbill.synopsis.split('\n').filter(Boolean).map((paragraph, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Cast of Characters */}
          {playbill.characters.length > 0 && (
            <div className="mb-4">
              <div className="playbill-section-header" style={{ fontFamily: 'var(--font-oswald)' }}>
                Cast of Characters
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {playbill.characters.map((char, i) => (
                  <div key={i}>
                    <span className="text-sm font-bold text-[#1A0F1E]"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {char.name}
                    </span>
                    <span className="text-xs text-[#1A0F1E]/50 ml-1"
                      style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
                    >
                      {char.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Setting */}
          <div className="mt-auto pt-4 border-t border-[#C9A84C]/15">
            <p className="text-xs text-[#1A0F1E]/50"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
            >
              {playbill.setting}
            </p>
          </div>
        </div>

        {/* Right Page */}
        <div className="playbill-page playbill-spine">
          <div className="playbill-section-header" style={{ fontFamily: 'var(--font-oswald)' }}>
            Musical Numbers
          </div>

          {/* Act I */}
          <div className="mb-2">
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-[#8A7434] mb-1"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Act I
            </h4>
            <div className="divide-y divide-[#C9A84C]/10">
              {act1Tracks.map((track, i) => (
                <SongCard
                  key={track.id}
                  track={track}
                  index={i}
                  isHighlighted={highlightedTrack === i}
                  isNowPlaying={highlightedTrack === i}
                  isLocked={lockedTrackNumbers?.has(track.track_number)}
                  onGenerateTrack={onGenerateTrack}
                  variant="playbill"
                />
              ))}
            </div>
          </div>

          {/* Intermission */}
          <div className="playbill-intermission">
            <span className="text-[10px] tracking-[0.3em] uppercase whitespace-nowrap"
              style={{ fontFamily: 'var(--font-oswald)', color: '#8A7434' }}
            >
              Intermission
            </span>
          </div>

          {/* Act II */}
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-[#8A7434] mb-1"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Act II
            </h4>
            <div className="divide-y divide-[#C9A84C]/10">
              {act2Tracks.map((track, i) => (
                <SongCard
                  key={track.id}
                  track={track}
                  index={i}
                  isHighlighted={highlightedTrack === i + 3}
                  isNowPlaying={highlightedTrack === i + 3}
                  isLocked={lockedTrackNumbers?.has(track.track_number)}
                  onGenerateTrack={onGenerateTrack}
                  variant="playbill"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
