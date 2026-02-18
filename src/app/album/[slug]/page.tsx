'use client';

import { useEffect, useState, use } from 'react';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Share2, Check } from 'lucide-react';
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Album not found</h1>
          <p className="text-gray-600">This album may have been removed or the link is incorrect.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading album...</p>
      </main>
    );
  }

  const { album, tracks } = data;

  return (
    <main className="min-h-screen bg-white">
      {/* Album Header */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="flex flex-col sm:flex-row items-start gap-8">
            {album.cover_image_url && (
              <img
                src={album.cover_image_url}
                alt={album.title}
                className="w-48 h-48 rounded-lg shadow-2xl object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-2">
                Libretto
              </p>
              <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
              {album.tagline && (
                <p className="text-lg text-gray-300 italic mb-6">{album.tagline}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 bg-transparent"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Link copied
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share album
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Biography */}
      {album.biography_markdown && (
        <section className="max-w-3xl mx-auto px-6 py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">The Story</h2>
          <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {album.biography_markdown}
          </div>
        </section>
      )}

      <div className="max-w-3xl mx-auto px-6">
        <Separator />
      </div>

      {/* Tracks */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Tracks</h2>
        <div className="space-y-4">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100">
        Made with Libretto &mdash; your life, your libretto.
      </footer>
    </main>
  );
}
