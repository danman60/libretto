'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EMOTIONS } from '@/lib/types';
import type { Scene, Emotion } from '@/lib/types';
import { X } from 'lucide-react';

interface SceneCardProps {
  index: number;
  scene: Scene;
  onChange: (scene: Scene) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SceneCard({ index, scene, onChange, onRemove, canRemove }: SceneCardProps) {
  const inputClasses = "bg-white/[0.04] border-white/[0.08] text-gray-200 placeholder:text-gray-700 focus:border-purple-500/30 focus:ring-purple-500/10";

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Scene {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-600 hover:text-red-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Location</label>
          <Input
            placeholder="Where did this happen?"
            value={scene.location}
            onChange={(e) => onChange({ ...scene, location: e.target.value })}
            className={inputClasses}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Who was present?</label>
          <Input
            placeholder="Who was there with you?"
            value={scene.who_was_present}
            onChange={(e) => onChange({ ...scene, who_was_present: e.target.value })}
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">What changed?</label>
        <Textarea
          placeholder="What shifted in this moment?"
          value={scene.what_changed}
          onChange={(e) => onChange({ ...scene, what_changed: e.target.value })}
          rows={2}
          className={`${inputClasses} resize-none`}
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-2 block">Dominant emotion</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion}
              type="button"
              onClick={() => onChange({ ...scene, dominant_emotion: emotion as Emotion })}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                scene.dominant_emotion === emotion
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'
              }`}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
