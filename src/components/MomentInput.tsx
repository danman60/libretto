'use client';

import { useState, useRef, useEffect } from 'react';
import { GENRES, EMOTIONS, MOMENT_ROLES } from '@/lib/types';
import type { Emotion, MomentFormState } from '@/lib/types';

interface MomentInputProps {
  momentIndex: number; // 1, 2, or 3
  onSubmit: (data: MomentFormState) => void;
  isSubmitting: boolean;
}

const ENERGY_OPTIONS = [
  { value: 'calm' as const, label: 'Calm' },
  { value: 'mid' as const, label: 'Balanced' },
  { value: 'dynamic' as const, label: 'Dynamic' },
];

const VOCAL_OPTIONS = [
  { value: 'vocals' as const, label: 'Vocals' },
  { value: 'instrumental' as const, label: 'Instrumental' },
  { value: 'mixed' as const, label: 'Mixed' },
];

export function MomentInput({ momentIndex, onSubmit, isSubmitting }: MomentInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState<MomentFormState>({
    story: '',
    emotion: null,
    genres: [],
    energy: 'mid',
    vocalPreference: 'vocals',
  });

  const moment = MOMENT_ROLES[momentIndex - 1];

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.max(200, ta.scrollHeight) + 'px';
    }
  }, [form.story]);

  const toggleGenre = (genre: string) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : prev.genres.length < 3 ? [...prev.genres, genre] : prev.genres,
    }));
  };

  const canSubmit = form.story.trim().length > 20 && form.emotion !== null;
  const isLast = momentIndex === 3;

  return (
    <div className="gentle-fade-in max-w-[640px] mx-auto">
      {/* Moment header */}
      <div className="mb-10 text-center">
        <p className="text-[#9B8E99] text-sm tracking-widest uppercase mb-4">
          Moment {momentIndex} of 3
        </p>
        <h2
          className="text-3xl sm:text-4xl text-[#F5F0EB] mb-3"
          style={{ fontFamily: 'var(--font-dm-serif)' }}
        >
          {moment.prompt}
        </h2>
        <p className="text-[#9B8E99] text-base leading-relaxed max-w-md mx-auto" style={{ fontFamily: 'var(--font-lora)' }}>
          {moment.subtitle}
        </p>
      </div>

      {/* Story textarea */}
      <div className="listening-pulse rounded-[20px] transition-shadow duration-500 mb-8">
        <textarea
          ref={textareaRef}
          value={form.story}
          onChange={e => setForm(prev => ({ ...prev, story: e.target.value }))}
          placeholder="Begin writing here..."
          className="w-full bg-transparent text-[#F5F0EB] placeholder:text-[#9B8E99]/40 text-lg leading-[1.7] resize-none border-0 outline-none p-6 min-h-[200px]"
          style={{ fontFamily: 'var(--font-lora)' }}
        />
      </div>

      {/* Emotion picker */}
      <div className="mb-8">
        <p className="text-[#9B8E99] text-sm mb-3">How does this moment feel?</p>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map(emotion => (
            <button
              key={emotion}
              onClick={() => setForm(prev => ({ ...prev, emotion }))}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                form.emotion === emotion
                  ? 'bg-[#E8A87C] text-[#0D0B0E] font-medium'
                  : 'bg-white/[0.04] text-[#9B8E99] hover:bg-white/[0.08] hover:text-[#F5F0EB]'
              }`}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      {/* Music feel section */}
      <div className="glass-card p-6 mb-8">
        <p className="text-[#B8A9C9] text-sm font-medium mb-4">Shape the music</p>

        {/* Genre pills */}
        <div className="mb-5">
          <p className="text-[#9B8E99] text-xs mb-2">Genre (up to 3)</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  form.genres.includes(genre)
                    ? 'bg-[#E8A87C]/20 text-[#E8A87C] border border-[#E8A87C]/30'
                    : 'bg-white/[0.04] text-[#9B8E99] hover:bg-white/[0.08] border border-transparent'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div className="mb-5">
          <p className="text-[#9B8E99] text-xs mb-2">Energy</p>
          <div className="flex gap-2">
            {ENERGY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, energy: opt.value }))}
                className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                  form.energy === opt.value
                    ? 'bg-[#B8A9C9]/20 text-[#B8A9C9] border border-[#B8A9C9]/30'
                    : 'bg-white/[0.04] text-[#9B8E99] hover:bg-white/[0.08] border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vocal preference */}
        <div>
          <p className="text-[#9B8E99] text-xs mb-2">Vocal style</p>
          <div className="flex gap-2">
            {VOCAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, vocalPreference: opt.value }))}
                className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                  form.vocalPreference === opt.value
                    ? 'bg-[#D4A5A5]/20 text-[#D4A5A5] border border-[#D4A5A5]/30'
                    : 'bg-white/[0.04] text-[#9B8E99] hover:bg-white/[0.08] border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="text-center">
        <button
          onClick={() => canSubmit && !isSubmitting && onSubmit(form)}
          disabled={!canSubmit || isSubmitting}
          className={`px-10 py-4 rounded-full text-base font-medium transition-all ${
            canSubmit && !isSubmitting
              ? 'bg-[#E8A87C] text-[#0D0B0E] hover:brightness-110 hover:scale-[1.02]'
              : 'bg-white/[0.06] text-[#9B8E99] cursor-not-allowed'
          }`}
        >
          {isSubmitting
            ? 'Sharing...'
            : isLast
              ? 'Complete your story'
              : 'Share this moment'
          }
        </button>
        <p className="text-[#9B8E99]/50 text-xs mt-4" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          Your words are safe here
        </p>
      </div>
    </div>
  );
}
