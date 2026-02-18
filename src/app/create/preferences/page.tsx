'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { GENRES } from '@/lib/types';
import { ArrowLeft, Loader2 } from 'lucide-react';

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

      // Start generation (fire and forget — long-running)
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500 mb-1">Step 4 of 4</p>
          <Progress value={100} className="h-1.5" />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Music Preferences
            </h2>
            <p className="text-gray-600">
              Help us shape the sound of your album. Pick your genres, influences,
              and vibe.
            </p>
          </div>

          {/* Genres */}
          <div className="space-y-3">
            <Label>Genres (pick up to 3)</Label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                    genres.includes(genre)
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Artist References */}
          <div className="space-y-3">
            <Label>Artist references (optional)</Label>
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
              />
            ))}
          </div>

          {/* Favorite Songs */}
          <div className="space-y-3">
            <Label>Favorite songs (optional)</Label>
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
              />
            ))}
          </div>

          {/* Vocal Mode */}
          <div className="space-y-3">
            <Label>Vocal style</Label>
            <div className="flex gap-3">
              {(['vocals', 'instrumental', 'mixed'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setVocalMode(mode)}
                  className={`flex-1 py-3 text-sm rounded-lg border transition-colors capitalize ${
                    vocalMode === mode
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div className="space-y-3">
            <Label>Energy</Label>
            <div className="flex gap-3">
              {(['calm', 'mid', 'dynamic', 'mixed'] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEnergy(e)}
                  className={`flex-1 py-3 text-sm rounded-lg border transition-colors capitalize ${
                    energy === e
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Era */}
          <div className="space-y-3">
            <Label>Era</Label>
            <div className="flex gap-3">
              {(['classic', 'modern', 'mixed'] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEra(e)}
                  className={`flex-1 py-3 text-sm rounded-lg border transition-colors capitalize ${
                    era === e
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Allow Real Names */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllowRealNames(!allowRealNames)}
              className={`w-10 h-6 rounded-full transition-colors ${
                allowRealNames ? 'bg-gray-900' : 'bg-gray-300'
              } relative`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  allowRealNames ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </button>
            <Label className="cursor-pointer" onClick={() => setAllowRealNames(!allowRealNames)}>
              Allow real names in lyrics
            </Label>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Button
            variant="ghost"
            onClick={() => router.push('/create')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating your album...
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
