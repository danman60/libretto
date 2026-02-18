'use client';

import { useEffect, useState, use } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { Share2, Check, Disc3 } from 'lucide-react';
import type { AlbumPageData } from '@/lib/types';

export default function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<AlbumPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/album/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Album not found');
        return r.json();
      })
      .then(setData)
      .catch(() => setError('Album not found'));
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Album not found</h1>
          <p className="text-gray-500">This album may have been removed or the link is incorrect.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Disc3 className="h-5 w-5 animate-spin" />
          Loading album...
        </div>
      </main>
    );
  }

  const { album, tracks } = data;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Album Header */}
      <section className="relative overflow-hidden">
        {/* Background blur from cover image */}
        {album.cover_image_url && (
          <div
            className="absolute inset-0 opacity-20 blur-3xl scale-110"
            style={{
              backgroundImage: `url(${album.cover_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" />

        <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8">
            {album.cover_image_url ? (
              <img
                src={album.cover_image_url}
                alt={album.title}
                className="w-52 h-52 rounded-lg shadow-2xl shadow-black/50 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-52 h-52 rounded-lg bg-gradient-to-br from-purple-900/40 to-gray-900 flex items-center justify-center flex-shrink-0 border border-white/10">
                <Disc3 className="h-16 w-16 text-gray-600" />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-medium tracking-widest text-gray-500 uppercase mb-2">
                Album
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{album.title}</h1>
              {album.tagline && (
                <p className="text-base text-gray-400 italic mb-5">{album.tagline}</p>
              )}
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <span className="text-xs text-gray-500">
                  {tracks.length} track{tracks.length !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-700">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-gray-400 hover:text-white h-auto py-1 px-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5 mr-1.5" />
                      Share
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <div className="space-y-3">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>

      {/* Biography */}
      {album.biography_markdown && (
        <section className="max-w-3xl mx-auto px-6 py-12">
          <div className="border-t border-white/[0.06] pt-12">
            <h2 className="text-xs font-medium tracking-widest text-gray-500 uppercase mb-6">
              The Story
            </h2>
            <div className="biography-content text-gray-400 leading-relaxed space-y-4 [&_h1]:text-white [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-gray-300 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_strong]:text-gray-300 [&_em]:text-gray-300 [&_hr]:border-white/10 [&_hr]:my-8 [&_a]:text-purple-400 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-white/10 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {album.biography_markdown}
              </ReactMarkdown>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center">
        <p className="text-xs text-gray-600">
          Made with{' '}
          <a href="/" className="text-gray-500 hover:text-gray-400 transition-colors">
            Libretto
          </a>
          {' '}&mdash; your life, your libretto.
        </p>
      </footer>
    </main>
  );
}
