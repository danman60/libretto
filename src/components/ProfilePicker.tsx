'use client';

import { useState } from 'react';
import { Shuffle } from 'lucide-react';

const GENRES = [
  'Pop', 'R&B', 'Soul', 'Folk', 'Indie',
  'Hip-Hop', 'Rock', 'Electronic', 'Country', 'Jazz',
];

const ERA_LABELS = ['60s/70s', '80s', '90s', '00s', '2010s', 'Now'];

function eraFromSlider(value: number): string {
  // 0-100 maps across 6 stops (0, 20, 40, 60, 80, 100)
  const segments = [
    { start: 0, end: 20, labels: ['60s/70s', 'Late 70s'] },
    { start: 20, end: 40, labels: ['80s', 'Late 80s'] },
    { start: 40, end: 60, labels: ['90s', 'Late 90s'] },
    { start: 60, end: 80, labels: ['00s', 'Late 00s'] },
    { start: 80, end: 100, labels: ['2010s', 'Now'] },
  ];

  for (const seg of segments) {
    if (value <= seg.end) {
      const pct = (value - seg.start) / (seg.end - seg.start);
      if (pct < 0.25) return `Early ${seg.labels[0]}`;
      if (pct < 0.75) return seg.labels[0];
      return seg.labels[1];
    }
  }
  return 'Now';
}

interface ProfilePickerProps {
  onSubmit: (data: { genres: string[]; era: string; artistReference: string }) => void;
  isSubmitting: boolean;
}

export function ProfilePicker({ onSubmit, isSubmitting }: ProfilePickerProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [eraValue, setEraValue] = useState(60); // default to '00s' region
  const [artistReference, setArtistReference] = useState('');

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSurpriseMe = () => {
    // Pick 1-2 random genres
    const shuffled = [...GENRES].sort(() => Math.random() - 0.5);
    const count = Math.random() > 0.5 ? 2 : 1;
    setSelectedGenres(shuffled.slice(0, count));
    // Random era
    setEraValue(Math.floor(Math.random() * 101));
    // Random artist from a fun pool
    const artists = [
      'Adele', 'The Weeknd', 'Bon Iver', 'Taylor Swift', 'Frank Ocean',
      'Fleetwood Mac', 'Billie Eilish', 'Kendrick Lamar', 'Amy Winehouse',
      'Radiohead', 'Stevie Wonder', 'Lana Del Rey', 'Prince', 'SZA',
    ];
    setArtistReference(artists[Math.floor(Math.random() * artists.length)]);
  };

  const canSubmit = selectedGenres.length > 0;
  const currentEra = eraFromSlider(eraValue);

  return (
    <div className="gentle-fade-in max-w-[640px] mx-auto">
      <div className="mb-10 text-center">
        <p className="text-[#B8A9C9] text-sm tracking-widest uppercase mb-4">
          Before we begin
        </p>
        <h2
          className="text-3xl sm:text-4xl text-[#F5F0EB] mb-3"
          style={{ fontFamily: 'var(--font-dm-serif)' }}
        >
          How do you hear your story?
        </h2>
        <p className="text-[#A89DAF] text-base leading-relaxed max-w-md mx-auto" style={{ fontFamily: 'var(--font-lora)' }}>
          Tag the vibes. Pick as many as you want.
        </p>
      </div>

      {/* Genre tags — multi-select */}
      <div className="mb-10">
        <p className="text-[#A89DAF] text-sm mb-3" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          What does it sound like?
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(genre => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                selectedGenres.includes(genre)
                  ? 'bg-[#E8A87C] text-[#1A1518] font-medium shadow-lg shadow-[#E8A87C]/20 scale-105'
                  : 'bg-white/[0.05] text-[#B8A9C9] hover:bg-white/[0.1] hover:text-[#F5F0EB]'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Era slider */}
      <div className="mb-10">
        <p className="text-[#A89DAF] text-sm mb-3" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          What era?
        </p>
        <div className="px-1">
          <div className="text-center mb-3">
            <span className="text-[#E8A87C] text-sm font-medium">{currentEra}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={eraValue}
            onChange={e => setEraValue(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#E8A87C] bg-white/[0.1]"
            style={{
              background: `linear-gradient(to right, #E8A87C 0%, #E8A87C ${eraValue}%, rgba(255,255,255,0.1) ${eraValue}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
          <div className="flex justify-between mt-2">
            {ERA_LABELS.map(label => (
              <span
                key={label}
                className="text-xs text-[#B8A9C9]/50"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Artist reference (optional) */}
      <div className="mb-10">
        <p className="text-[#A89DAF] text-sm mb-3" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          Who does it sound like? (optional)
        </p>
        <div className="listening-pulse rounded-[20px] transition-shadow duration-500">
          <input
            type="text"
            value={artistReference}
            onChange={e => setArtistReference(e.target.value)}
            placeholder="e.g. Adele, The Weeknd, Bon Iver..."
            className="w-full bg-transparent text-[#F5F0EB] placeholder:text-[#B8A9C9]/40 text-lg border-0 outline-none p-6"
            style={{ fontFamily: 'var(--font-lora)' }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleSurpriseMe}
          className="flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium transition-all bg-white/[0.05] text-[#B8A9C9] hover:bg-white/[0.1] hover:text-[#F5F0EB] hover:scale-[1.02]"
        >
          <Shuffle className="w-4 h-4" />
          Surprise me
        </button>
        <button
          onClick={() => canSubmit && !isSubmitting && onSubmit({ genres: selectedGenres, era: currentEra, artistReference })}
          disabled={!canSubmit || isSubmitting}
          className={`px-10 py-4 rounded-full text-base font-medium transition-all ${
            canSubmit && !isSubmitting
              ? 'bg-[#E8A87C] text-[#1A1518] hover:brightness-110 hover:scale-[1.02] shadow-lg shadow-[#E8A87C]/25'
              : 'bg-white/[0.06] text-[#9B8E99] cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Set the tone'}
        </button>
      </div>
    </div>
  );
}
