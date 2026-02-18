'use client';

import { useState, useRef, useEffect } from 'react';
import { EMOTIONS, MOMENT_ROLES } from '@/lib/types';
import type { Emotion, MomentFormState } from '@/lib/types';

interface MomentInputProps {
  momentIndex: number; // 1, 2, or 3
  onSubmit: (data: MomentFormState) => void;
  isSubmitting: boolean;
}

export function MomentInput({ momentIndex, onSubmit, isSubmitting }: MomentInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState<MomentFormState>({
    story: '',
    emotion: null,
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

  const canSubmit = form.story.trim().length > 20 && form.emotion !== null;
  const isLast = momentIndex === 3;

  return (
    <div className="gentle-fade-in max-w-[640px] mx-auto">
      {/* Moment header */}
      <div className="mb-10 text-center">
        <p className="text-[#B8A9C9] text-sm tracking-widest uppercase mb-4">
          Moment {momentIndex} of 3
        </p>
        <h2
          className="text-3xl sm:text-4xl text-[#F5F0EB] mb-3"
          style={{ fontFamily: 'var(--font-dm-serif)' }}
        >
          {moment.prompt}
        </h2>
        <p className="text-[#A89DAF] text-base leading-relaxed max-w-md mx-auto" style={{ fontFamily: 'var(--font-lora)' }}>
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
          className="w-full bg-transparent text-[#F5F0EB] placeholder:text-[#B8A9C9]/40 text-lg leading-[1.7] resize-none border-0 outline-none p-6 min-h-[200px]"
          style={{ fontFamily: 'var(--font-lora)' }}
        />
      </div>

      {/* Emotion picker */}
      <div className="mb-10">
        <p className="text-[#A89DAF] text-sm mb-3" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          If this moment were a feeling, what would it be?
        </p>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map(emotion => (
            <button
              key={emotion}
              onClick={() => setForm(prev => ({ ...prev, emotion }))}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                form.emotion === emotion
                  ? 'bg-[#E8A87C] text-[#1A1518] font-medium shadow-lg shadow-[#E8A87C]/20'
                  : 'bg-white/[0.05] text-[#B8A9C9] hover:bg-white/[0.1] hover:text-[#F5F0EB]'
              }`}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="text-center">
        <button
          onClick={() => canSubmit && !isSubmitting && onSubmit(form)}
          disabled={!canSubmit || isSubmitting}
          className={`px-10 py-4 rounded-full text-base font-medium transition-all ${
            canSubmit && !isSubmitting
              ? 'bg-[#E8A87C] text-[#1A1518] hover:brightness-110 hover:scale-[1.02] shadow-lg shadow-[#E8A87C]/25'
              : 'bg-white/[0.06] text-[#9B8E99] cursor-not-allowed'
          }`}
        >
          {isSubmitting
            ? 'Saving...'
            : isLast
              ? 'Complete your story'
              : 'Next moment'
          }
        </button>
        <p className="text-[#B8A9C9]/50 text-xs mt-4" style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
          Your words are safe here. We&apos;ll find the music in them.
        </p>
      </div>
    </div>
  );
}
