'use client';

import { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AdminTrackRowProps {
  track: {
    id: string;
    title: string;
    track_number: number;
    lyrics: string | null;
    style_prompt: string | null;
    audio_url: string | null;
    duration: number | null;
    created_at: string;
    narrative_role: string;
    albums: {
      title: string;
      share_slug: string;
      project_id: string;
    };
  };
  logs: unknown[];
}

export function AdminTrackRow({ track, logs }: AdminTrackRowProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="border border-white/[0.08] rounded-xl p-4 bg-white/[0.02]">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-[#E8A87C]/15 flex items-center justify-center text-sm font-medium text-[#E8A87C] flex-shrink-0 mt-0.5">
          {track.track_number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-[#F5F0EB] font-medium truncate">{track.title}</h3>
            <span className="text-xs text-[#9B8E99]/60">from</span>
            <a
              href={`/album/${track.albums.share_slug}`}
              target="_blank"
              className="text-xs text-[#E8A87C] hover:underline truncate"
            >
              {track.albums.title}
            </a>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-full bg-[#B8A9C9]/15 text-[#B8A9C9] text-xs">{track.narrative_role}</span>
            {track.style_prompt?.split(',').slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[#9B8E99] text-xs">
                {tag.trim()}
              </span>
            ))}
            <span className="text-[10px] text-[#9B8E99]/40 self-center ml-auto">{formatDate(track.created_at)}</span>
          </div>

          {track.audio_url && (
            <AudioPlayer src={track.audio_url} title={track.title} />
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[#9B8E99] hover:text-[#F5F0EB] transition-colors mt-3"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Collapse' : 'Details'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {track.style_prompt && (
                <div>
                  <p className="text-[10px] text-[#9B8E99]/60 uppercase tracking-wider mb-1">Style Prompt</p>
                  <p className="text-xs text-[#A89DAF]">{track.style_prompt}</p>
                </div>
              )}

              {track.lyrics && (
                <div>
                  <p className="text-[10px] text-[#9B8E99]/60 uppercase tracking-wider mb-1">Lyrics</p>
                  <pre className="text-xs text-[#9B8E99] whitespace-pre-wrap leading-relaxed bg-white/[0.02] rounded-lg p-3 max-h-48 overflow-y-auto"
                    style={{ fontFamily: 'var(--font-lora)' }}>
                    {track.lyrics}
                  </pre>
                </div>
              )}

              {logs.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#9B8E99]/60 uppercase tracking-wider mb-1">Generation Log</p>
                  <div className="space-y-1">
                    {logs.map((log: unknown, i: number) => {
                      const l = log as { event: string; duration_ms?: number; model?: string; error_message?: string; created_at: string };
                      return (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className={`font-mono ${l.error_message ? 'text-[#D4A5A5]' : 'text-[#8FBC8B]'}`}>
                            {l.event}
                          </span>
                          {l.duration_ms && (
                            <span className="text-[#9B8E99]/50">{(l.duration_ms / 1000).toFixed(1)}s</span>
                          )}
                          {l.model && (
                            <span className="text-[#9B8E99]/40">{l.model}</span>
                          )}
                          {l.error_message && (
                            <span className="text-[#D4A5A5]/70 truncate max-w-[200px]">{l.error_message}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
