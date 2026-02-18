'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GENRES } from '@/lib/types';
import { ArrowLeft, Loader2, Disc3 } from 'lucide-react';

export default function PreferencesPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [genres, setGenres] = useState<string[]>([]);
  const [artists, setArtists] = useState(['', '', '']);
  const [favoriteSongs, setFavoriteSongs] = useState(['', '']);
  const [vocalMode, setVocalMode] = useState<'vocals' | 'instrumental' | 'mixed'>('vocals');
  const [energy, setEnergy] = useState<'calm' | 'mid' | 'dynamic' | 'mixed'>('mid');
  const [era, setEra] = useState<'classic' | 'modern' | 'mixed'>('modern');
  const [allowRealNames, setAllowRealNames] = useState(false);

  const toggleGenre = (genre: string) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else if (genres.length < 3) {
      setGenres([...genres, genre]);
    }
  };

  const handleSubmit = async () => {
    const projectId = sessionStorage.getItem('libretto_project_id');
    if (!projectId) {
      router.push('/create');
      return;
    }

    setSubmitting(true);

    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          genres,
          artists: artists.filter(Boolean),
          favoriteSongs: favoriteSongs.filter(Boolean),
          vocalMode,
          energy,
          era,
          allowRealNames,
        }),
      });

      // Kick off generation
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      }).catch(console.error);

      router.push(`/processing/${projectId}`);
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitting(false);
    }
  };

  const canSubmit = genres.length >= 1 && !submitting;

  const inputClasses = "bg-white/[0.04] border-white/[0.08] text-gray-200 placeholder:text-gray-700 focus:border-purple-500/30 focus:ring-purple-500/10";

  const radioButton = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm rounded-lg border transition-colors capitalize ${
        active
          ? 'bg-white text-black border-white font-medium'
          : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Disc3 className="h-5 w-5 text-gray-600" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Step 4 of 4</span>
              <span className="text-xs text-gray-700">100%</span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500/60 to-purple-400/40 rounded-full w-full" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Music Preferences</h2>
          <p className="text-gray-500 text-sm">
            Shape the sound of your album. Pick your genres, influences, and vibe.
          </p>
        </div>

        <div className="space-y-8">
          {/* Genres */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
              Genres (up to 3)
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                    genres.includes(genre)
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Artist References */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
              Artist references (optional)
            </label>
            <div className="space-y-2">
              {artists.map((artist, i) => (
                <Input
                  key={i}
                  placeholder={`Artist ${i + 1}`}
                  value={artist}
                  onChange={(e) => {
                    const updated = [...artists];
                    updated[i] = e.target.value;
                    setArtists(updated);
                  }}
                  className={inputClasses}
                />
              ))}
            </div>
          </div>

          {/* Favorite Songs */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
              Favorite songs (optional)
            </label>
            <div className="space-y-2">
              {favoriteSongs.map((song, i) => (
                <Input
                  key={i}
                  placeholder={`Song ${i + 1}`}
                  value={song}
                  onChange={(e) => {
                    const updated = [...favoriteSongs];
                    updated[i] = e.target.value;
                    setFavoriteSongs(updated);
                  }}
                  className={inputClasses}
                />
              ))}
            </div>
          </div>

          {/* Vocal Mode */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
              Vocal style
            </label>
            <div className="flex gap-2">
              {(['vocals', 'instrumental', 'mixed'] as const).map((mode) =>
                radioButton(mode, vocalMode === mode, () => setVocalMode(mode))
              )}
            </div>
          </div>

          {/* Energy */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
              Energy
            </label>
            <div className="flex gap-2">
              {(['calm', 'mid', 'dynamic', 'mixed'] as const).map((e) =>
                radioButton(e, energy === e, () => setEnergy(e))
              )}
            </div>
          </div>

          {/* Era */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
              Era
            </label>
            <div className="flex gap-2">
              {(['classic', 'modern', 'mixed'] as const).map((e) =>
                radioButton(e, era === e, () => setEra(e))
              )}
            </div>
          </div>

          {/* Allow Real Names */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllowRealNames(!allowRealNames)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                allowRealNames ? 'bg-purple-500/60' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  allowRealNames ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span
              className="text-sm text-gray-400 cursor-pointer"
              onClick={() => setAllowRealNames(!allowRealNames)}
            >
              Allow real names in lyrics
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-10 pt-6 border-t border-white/[0.06]">
          <Button
            variant="ghost"
            onClick={() => router.push('/create')}
            className="text-gray-500 hover:text-white gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className="bg-white text-black hover:bg-gray-200 font-semibold gap-2 disabled:opacity-30 disabled:bg-white/10 disabled:text-gray-600 rounded-full px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Generate My Album'
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
