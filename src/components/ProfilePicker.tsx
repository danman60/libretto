'use client';

import { useState } from 'react';

const ERAS = [
  { value: '70s/80s', label: '70s / 80s' },
  { value: '90s/00s', label: '90s / 00s' },
  { value: '2010s+', label: '2010s+' },
  { value: 'Timeless', label: 'Timeless' },
];

const GENRES = [
  { value: 'Pop', label: 'Pop' },
  { value: 'R&B/Soul', label: 'R&B / Soul' },
  { value: 'Folk/Indie', label: 'Folk / Indie' },
  { value: 'Hip-Hop', label: 'Hip-Hop' },
  { value: 'Rock', label: 'Rock' },
  { value: 'Electronic', label: 'Electronic' },
];

interface ProfilePickerProps {
  onSubmit: (data: { genre: string; era: string; artistReference: string }) => void;
  isSubmitting: boolean;
}

export function ProfilePicker({ onSubmit, isSubmitting }: ProfilePickerProps) {
  const [genre, setGenre] = useState<string | null>(null);
  const [era, setEra] = useState<string | null>(null);
  const [artistReference, setArtistReference] = useState('');

  const canSubmit = genre !== null && era !== null;

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
          Pick the sound and era that feels like home. This shapes the entire album.
        </p>
      </div>

      {/* Genre picker */}
      <div className="mb-10">
        <p className="text-[#A89DAF] text-sm mb-3" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          What genre feels like your story?
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(g => (
            <button
              key={g.value}
              onClick={() => setGenre(g.value)}
              className={`px-5 py-2.5 rounded-full text-sm transition-all ${
                genre === g.value
                  ? 'bg-[#E8A87C] text-[#1A1518] font-medium shadow-lg shadow-[#E8A87C]/20'
                  : 'bg-white/[0.05] text-[#B8A9C9] hover:bg-white/[0.1] hover:text-[#F5F0EB]'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Era picker */}
      <div className="mb-10">
        <p className="text-[#A89DAF] text-sm mb-3" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          What era does it belong to?
        </p>
        <div className="flex flex-wrap gap-2">
          {ERAS.map(e => (
            <button
              key={e.value}
              onClick={() => setEra(e.value)}
              className={`px-5 py-2.5 rounded-full text-sm transition-all ${
                era === e.value
                  ? 'bg-[#E8A87C] text-[#1A1518] font-medium shadow-lg shadow-[#E8A87C]/20'
                  : 'bg-white/[0.05] text-[#B8A9C9] hover:bg-white/[0.1] hover:text-[#F5F0EB]'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Artist reference (optional) */}
      <div className="mb-10">
        <p className="text-[#A89DAF] text-sm mb-3" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          Name an artist who sounds like your story (optional)
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

      {/* Submit */}
      <div className="text-center">
        <button
          onClick={() => canSubmit && !isSubmitting && onSubmit({ genre: genre!, era: era!, artistReference })}
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
