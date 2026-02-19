'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
}

interface GuestbookProps {
  slug: string;
}

export function Guestbook({ slug }: GuestbookProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/album/${slug}/comments`)
      .then(r => r.json())
      .then(data => setComments(data.comments || []))
      .catch(() => {});
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/album/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: name.trim(), message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to post');
        return;
      }

      const data = await res.json();
      setComments(prev => [data.comment, ...prev]);
      setMessage('');
    } catch {
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <h2 className="text-sm tracking-widest text-[#9B8E99] uppercase mb-6">Guestbook</h2>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#F5F0EB] placeholder-[#9B8E99]/50 focus:outline-none focus:border-[#E8A87C]/30 transition-colors"
        />
        <div className="flex gap-2">
          <textarea
            placeholder="Leave a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={500}
            rows={2}
            className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#F5F0EB] placeholder-[#9B8E99]/50 focus:outline-none focus:border-[#E8A87C]/30 transition-colors resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim() || !message.trim()}
            className="self-end h-10 w-10 rounded-xl bg-[#E8A87C] flex items-center justify-center flex-shrink-0 hover:brightness-110 transition-all disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 text-[#0D0B0E] animate-spin" />
            ) : (
              <Send className="h-4 w-4 text-[#0D0B0E]" />
            )}
          </button>
        </div>
        {error && <p className="text-[#D4A5A5] text-xs">{error}</p>}
      </form>

      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.04]">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-[#B8A9C9]">{comment.author_name}</span>
                <span className="text-[10px] text-[#9B8E99]/50">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm text-[#A89DAF] leading-relaxed" style={{ fontFamily: 'var(--font-lora)' }}>
                {comment.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
