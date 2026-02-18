'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
  return (
    <Card className="relative">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Scene {index + 1}</h4>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`location-${index}`}>Location</Label>
          <Input
            id={`location-${index}`}
            placeholder="Where did this happen?"
            value={scene.location}
            onChange={(e) => onChange({ ...scene, location: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`present-${index}`}>Who was present?</Label>
          <Input
            id={`present-${index}`}
            placeholder="Who was there with you?"
            value={scene.who_was_present}
            onChange={(e) => onChange({ ...scene, who_was_present: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`changed-${index}`}>What changed?</Label>
          <Textarea
            id={`changed-${index}`}
            placeholder="What shifted in this moment?"
            value={scene.what_changed}
            onChange={(e) => onChange({ ...scene, what_changed: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Dominant emotion</Label>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion}
                type="button"
                onClick={() => onChange({ ...scene, dominant_emotion: emotion as Emotion })}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  scene.dominant_emotion === emotion
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
