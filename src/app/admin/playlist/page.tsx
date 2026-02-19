'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminTrackRow } from '@/components/AdminTrackRow';
import { Loader2, Search, Lock } from 'lucide-react';

export default function AdminPlaylistPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [tracks, setTracks] = useState<unknown[]>([]);
  const [logs, setLogs] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const storedPassword = typeof window !== 'undefined' ? sessionStorage.getItem('libretto_admin_pw') : null;

  useEffect(() => {
    if (storedPassword) {
      setPassword(storedPassword);
      setAuthenticated(true);
    }
  }, [storedPassword]);

  const fetchTracks = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/tracks?${params}`, {
        headers: { 'x-admin-password': password },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          sessionStorage.removeItem('libretto_admin_pw');
          setAuthError('Invalid password');
        }
        return;
      }

      const data = await res.json();
      setTracks(data.tracks || []);
      setLogs(data.logs || {});
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [authenticated, password, page, search]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('libretto_admin_pw', password);
    setAuthenticated(true);
    setAuthError('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center text-[#F5F0EB]">
        <form onSubmit={handleLogin} className="glass-card p-8 w-80 text-center">
          <Lock className="h-8 w-8 text-[#E8A87C] mx-auto mb-4" />
          <h1 className="text-xl mb-4" style={{ fontFamily: 'var(--font-dm-serif)' }}>Admin Playlist</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#F5F0EB] placeholder-[#9B8E99]/50 focus:outline-none focus:border-[#E8A87C]/30 transition-colors mb-3"
          />
          {authError && <p className="text-[#D4A5A5] text-xs mb-2">{authError}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#E8A87C] text-[#1A1518] text-sm font-medium hover:brightness-110 transition-all"
          >
            Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-[#F5F0EB]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-dm-serif)' }}>Admin Playlist</h1>
        <p className="text-[#9B8E99] text-sm mb-8">{total} tracks total</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9B8E99]/50" />
            <input
              type="text"
              placeholder="Search titles, lyrics, style..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F5F0EB] placeholder-[#9B8E99]/50 focus:outline-none focus:border-[#E8A87C]/30 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#E8A87C] text-[#1A1518] text-sm font-medium hover:brightness-110 transition-all"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#E8A87C]" />
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((track: unknown) => {
              const t = track as { id: string; track_number: number; title: string; lyrics: string | null; style_prompt: string | null; audio_url: string | null; duration: number | null; created_at: string; narrative_role: string; albums: { title: string; share_slug: string; project_id: string } };
              const logKey = `${t.albums.project_id}_${t.track_number}`;
              return (
                <AdminTrackRow
                  key={t.id}
                  track={t}
                  logs={logs[logKey] || []}
                />
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-white/[0.06] text-sm text-[#9B8E99] hover:bg-white/[0.1] transition-colors disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-sm text-[#9B8E99]">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl bg-white/[0.06] text-sm text-[#9B8E99] hover:bg-white/[0.1] transition-colors disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
