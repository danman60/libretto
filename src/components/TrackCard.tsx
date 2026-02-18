'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from './AudioPlayer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { NARRATIVE_ROLES } from '@/lib/types';
import type { Track } from '@/lib/types';

interface TrackCardProps {
  track: Track;
}

export function TrackCard({ track }: TrackCardProps) {
  const [showLyrics, setShowLyrics] = useState(false);

  const roleInfo = NARRATIVE_ROLES.find((r) => r.role === track.narrative_role);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
              {track.track_number}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{track.title}</h3>
              {roleInfo && (
                <p className="text-sm text-gray-500">{roleInfo.description}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {roleInfo?.label}
          </Badge>
        </div>

        {track.audio_url && (
          <AudioPlayer src={track.audio_url} title={track.title} />
        )}

        {track.lyrics && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLyrics(!showLyrics)}
              className="text-gray-500 hover:text-gray-700 px-0"
            >
              {showLyrics ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide lyrics
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show lyrics
                </>
              )}
            </Button>
            {showLyrics && (
              <pre className="mt-2 text-sm text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-4">
                {track.lyrics}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
