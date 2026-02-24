'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

interface FeedbackWidgetProps {
  slug: string;
}

const REACTIONS = [
  { value: 1, emoji: '😐', label: 'Meh' },
  { value: 2, emoji: '🙂', label: 'OK' },
  { value: 3, emoji: '👏', label: 'Bravo' },
  { value: 4, emoji: '🤩', label: 'Encore' },
  { value: 5, emoji: '🌹', label: 'Standing Ovation' },
];

export function FeedbackWidget({ slug }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === null) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/album/${slug}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch { /* ignore */ } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="text-[#C9A84C] text-lg mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>
          Thank you!
        </p>
        <p className="text-[#F2E8D5]/40 text-sm" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
          Your feedback helps us make better shows.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm tracking-[0.3em] text-[#C9A84C]/60 uppercase mb-4"
        style={{ fontFamily: 'var(--font-oswald)' }}
      >
        Rate This Show
      </h2>

      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
        {REACTIONS.map((r) => (
          <button
            key={r.value}
            onClick={() => setRating(r.value)}
            className={`flex flex-col items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl border transition-all ${
              rating === r.value
                ? 'border-[#C9A84C]/60 bg-[#C9A84C]/10 scale-110'
                : 'border-[#C9A84C]/10 bg-[#1A0F1E]/30 hover:border-[#C9A84C]/30 hover:bg-[#1A0F1E]/50'
            }`}
          >
            <span className="text-xl sm:text-2xl">{r.emoji}</span>
            <span className={`text-[9px] sm:text-[10px] tracking-wide uppercase ${
              rating === r.value ? 'text-[#C9A84C]' : 'text-[#F2E8D5]/30'
            }`} style={{ fontFamily: 'var(--font-oswald)' }}>
              {r.label}
            </span>
          </button>
        ))}
      </div>

      {rating !== null && (
        <div className="flex gap-2 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
          <textarea
            placeholder="Any thoughts? (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={2}
            className="flex-1 bg-[#1A0F1E]/50 border border-[#C9A84C]/15 rounded-xl px-4 py-2.5 text-sm text-[#F2E8D5] placeholder-[#F2E8D5]/30 focus:outline-none focus:border-[#C9A84C]/40 transition-colors resize-none"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="self-end h-10 w-10 rounded-xl bg-[#C9A84C] flex items-center justify-center flex-shrink-0 hover:brightness-110 transition-all disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 text-[#08070A] animate-spin" />
            ) : (
              <Send className="h-4 w-4 text-[#08070A]" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
