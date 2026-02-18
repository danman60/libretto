'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { SceneCard } from '@/components/SceneCard';
import type { Scene } from '@/lib/types';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const EMPTY_SCENE: Scene = {
  location: '',
  who_was_present: '',
  what_changed: '',
  dominant_emotion: 'hope',
};

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [turningPoints, setTurningPoints] = useState('');
  // Step 2
  const [innerWorld, setInnerWorld] = useState('');
  // Step 3
  const [scenes, setScenes] = useState<Scene[]>([
    { ...EMPTY_SCENE },
    { ...EMPTY_SCENE },
    { ...EMPTY_SCENE },
  ]);

  // Create session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('libretto_project_id');
    if (stored) {
      setProjectId(stored);
      return;
    }

    fetch('/api/session', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        setProjectId(data.projectId);
        sessionStorage.setItem('libretto_project_id', data.projectId);
        sessionStorage.setItem('libretto_session_token', data.sessionToken);
      })
      .catch(console.error);
  }, []);

  const saveStep = async (stepName: string, content: unknown) => {
    if (!projectId) return;
    setSaving(true);
    try {
      await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, step: stepName, content }),
      });
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      await saveStep('turning_points', { text: turningPoints });
      setStep(2);
    } else if (step === 2) {
      await saveStep('inner_world', { text: innerWorld });
      setStep(3);
    } else if (step === 3) {
      await saveStep('scenes', { scenes });
      router.push('/create/preferences');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    if (step === 1) return turningPoints.length >= 800;
    if (step === 2) return innerWorld.length >= 600;
    if (step === 3) {
      return scenes.length >= 3 && scenes.every(
        (s) => s.location && s.who_was_present && s.what_changed && s.dominant_emotion
      );
    }
    return false;
  };

  const addScene = () => {
    if (scenes.length < 6) {
      setScenes([...scenes, { ...EMPTY_SCENE }]);
    }
  };

  const updateScene = (index: number, scene: Scene) => {
    const updated = [...scenes];
    updated[index] = scene;
    setScenes(updated);
  };

  const removeScene = (index: number) => {
    setScenes(scenes.filter((_, i) => i !== index));
  };

  const progressValue = (step / 4) * 100;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500 mb-1">
            Step {step} of 4
          </p>
          <Progress value={progressValue} className="h-1.5" />
        </div>

        {/* Step 1: Turning Points */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Life Turning Points
              </h2>
              <p className="text-gray-600">
                Tell us about the key moments that shaped who you are. Include when
                they happened and how they made you feel.
              </p>
            </div>
            <Textarea
              value={turningPoints}
              onChange={(e) => setTurningPoints(e.target.value)}
              rows={12}
              placeholder="I grew up in a small town where everyone knew each other. The first turning point came when I was 14..."
              className="text-base"
            />
            <div className="flex justify-between items-center">
              <span
                className={`text-sm ${
                  turningPoints.length >= 800 ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {turningPoints.length} / 800 characters minimum
              </span>
            </div>
          </div>
        )}

        {/* Step 2: Inner World */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Inner World
              </h2>
              <p className="text-gray-600">
                What drives you? What keeps you up at night? What patterns do you
                notice in your life?
              </p>
            </div>
            <Textarea
              value={innerWorld}
              onChange={(e) => setInnerWorld(e.target.value)}
              rows={12}
              placeholder="I've always been someone who feels things deeply. The pattern I notice most is..."
              className="text-base"
            />
            <div className="flex justify-between items-center">
              <span
                className={`text-sm ${
                  innerWorld.length >= 600 ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {innerWorld.length} / 600 characters minimum
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Cinematic Scenes */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Cinematic Scenes
              </h2>
              <p className="text-gray-600">
                Describe at least 3 key scenes from your life — moments you can
                picture vividly. These will become the emotional anchors of your
                album.
              </p>
            </div>

            <div className="space-y-4">
              {scenes.map((scene, i) => (
                <SceneCard
                  key={i}
                  index={i}
                  scene={scene}
                  onChange={(s) => updateScene(i, s)}
                  onRemove={() => removeScene(i)}
                  canRemove={scenes.length > 3}
                />
              ))}
            </div>

            {scenes.length < 6 && (
              <Button
                type="button"
                variant="outline"
                onClick={addScene}
                className="w-full"
              >
                + Add another scene
              </Button>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="gap-2"
          >
            {saving ? 'Saving...' : step === 3 ? 'Music Preferences' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
