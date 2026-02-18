'use client';

import { Check, Loader2, Circle } from 'lucide-react';
import type { ProjectStatus, Track } from '@/lib/types';

interface ProgressTrackerProps {
  projectStatus: ProjectStatus;
  tracks: Track[];
}

type StepState = 'pending' | 'active' | 'complete';

interface Step {
  label: string;
  state: StepState;
}

export function ProgressTracker({ projectStatus, tracks }: ProgressTrackerProps) {
  const completedTracks = tracks.filter((t) => t.status === 'complete').length;
  const lyricsDone = tracks.filter(
    (t) => t.status === 'lyrics_done' || t.status === 'generating_audio' || t.status === 'complete'
  ).length;

  const steps: Step[] = [
    {
      label: 'Analyzing your story',
      state: projectStatus === 'intake' ? 'active' : 'complete',
    },
    {
      label: 'Writing your biography',
      state:
        projectStatus === 'processing' && lyricsDone === 0
          ? 'active'
          : lyricsDone > 0 || projectStatus === 'generating_music' || projectStatus === 'complete'
            ? 'complete'
            : 'pending',
    },
    {
      label: `Composing lyrics${lyricsDone > 0 ? ` (${lyricsDone}/5)` : ''}`,
      state:
        projectStatus === 'processing' && lyricsDone > 0 && lyricsDone < 5
          ? 'active'
          : lyricsDone === 5 || projectStatus === 'generating_music' || projectStatus === 'complete'
            ? 'complete'
            : 'pending',
    },
    {
      label: `Generating music${completedTracks > 0 ? ` (${completedTracks}/5)` : ''}`,
      state:
        projectStatus === 'generating_music'
          ? 'active'
          : projectStatus === 'complete'
            ? 'complete'
            : 'pending',
    },
    {
      label: 'Finalizing your libretto',
      state: projectStatus === 'complete' ? 'complete' : 'pending',
    },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
            step.state === 'active'
              ? 'bg-white/[0.04] border border-white/[0.08]'
              : 'border border-transparent'
          }`}
        >
          {step.state === 'complete' ? (
            <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Check className="h-3 w-3 text-green-400" />
            </div>
          ) : step.state === 'active' ? (
            <Loader2 className="h-5 w-5 text-white animate-spin flex-shrink-0" />
          ) : (
            <Circle className="h-5 w-5 text-gray-800 flex-shrink-0" />
          )}
          <span
            className={`text-sm ${
              step.state === 'active'
                ? 'text-white font-medium'
                : step.state === 'complete'
                  ? 'text-gray-500'
                  : 'text-gray-700'
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
