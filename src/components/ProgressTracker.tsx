'use client';

import { Progress } from '@/components/ui/progress';
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
      label: 'Analyzing your story...',
      state:
        projectStatus === 'intake'
          ? 'active'
          : 'complete',
    },
    {
      label: 'Writing your biography...',
      state:
        projectStatus === 'processing' && lyricsDone === 0
          ? 'active'
          : lyricsDone > 0 || projectStatus === 'generating_music' || projectStatus === 'complete'
            ? 'complete'
            : 'pending',
    },
    {
      label: `Composing lyrics... (${lyricsDone}/5)`,
      state:
        projectStatus === 'processing' && lyricsDone > 0 && lyricsDone < 5
          ? 'active'
          : lyricsDone === 5 || projectStatus === 'generating_music' || projectStatus === 'complete'
            ? 'complete'
            : 'pending',
    },
    {
      label: `Generating music... (${completedTracks}/5)`,
      state:
        projectStatus === 'generating_music'
          ? 'active'
          : projectStatus === 'complete'
            ? 'complete'
            : 'pending',
    },
    {
      label: 'Finalizing your album...',
      state: projectStatus === 'complete' ? 'complete' : 'pending',
    },
  ];

  const completedSteps = steps.filter((s) => s.state === 'complete').length;
  const progressValue = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-6">
      <Progress value={progressValue} className="h-2" />

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.state === 'complete' ? (
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            ) : step.state === 'active' ? (
              <Loader2 className="h-6 w-6 text-gray-900 animate-spin" />
            ) : (
              <Circle className="h-6 w-6 text-gray-300" />
            )}
            <span
              className={`text-sm ${
                step.state === 'active'
                  ? 'text-gray-900 font-medium'
                  : step.state === 'complete'
                    ? 'text-gray-500'
                    : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
