'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SceneCard } from '@/components/SceneCard';
import type { Scene } from '@/lib/types';
import { ArrowLeft, ArrowRight, Disc3 } from 'lucide-react';

const EMPTY_SCENE: Scene = {
  location: '',
  who_was_present: '',
  what_changed: '',
  dominant_emotion: 'hope',
};

const STEP_META = [
  { num: 1, title: 'Life Turning Points', desc: 'Tell us about the key moments that shaped who you are. Include when they happened and how they made you feel.' },
  { num: 2, title: 'Inner World', desc: 'What drives you? What keeps you up at night? What patterns do you notice in your life?' },
  { num: 3, title: 'Cinematic Scenes', desc: 'Describe at least 3 key scenes from your life — moments you can picture vividly. These become the emotional anchors of your album.' },
];

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [turningPoints, setTurningPoints] = useState('');
  const [innerWorld, setInnerWorld] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([
    { ...EMPTY_SCENE },
    { ...EMPTY_SCENE },
    { ...EMPTY_SCENE },
  ]);

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
    if (scenes.length < 6) setScenes([...scenes, { ...EMPTY_SCENE }]);
  };

  const updateScene = (index: number, scene: Scene) => {
    const updated = [...scenes];
    updated[index] = scene;
    setScenes(updated);
  };

  const removeScene = (index: number) => {
    setScenes(scenes.filter((_, i) => i !== index));
  };

  const meta = STEP_META[step - 1];
  const charCount = step === 1 ? turningPoints.length : step === 2 ? innerWorld.length : 0;
  const charMin = step === 1 ? 800 : step === 2 ? 600 : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Disc3 className="h-5 w-5 text-gray-600" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">
                Step {step} of 4
              </span>
              <span className="text-xs text-gray-700">{step * 25}%</span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500/60 to-purple-400/40 rounded-full transition-all duration-500"
                style={{ width: `${step * 25}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{meta.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{meta.desc}</p>
        </div>

        {/* Step 1: Turning Points */}
        {step === 1 && (
          <div className="space-y-4">
            <Textarea
              value={turningPoints}
              onChange={(e) => setTurningPoints(e.target.value)}
              rows={14}
              placeholder="I grew up in a small town where everyone knew each other. The first turning point came when I was 14..."
              className="bg-white/[0.04] border-white/[0.08] text-gray-200 placeholder:text-gray-700 text-base resize-none focus:border-purple-500/30 focus:ring-purple-500/10"
            />
            <div className="flex justify-end">
              <span className={`text-xs tabular-nums ${charCount >= charMin ? 'text-green-500/70' : 'text-gray-600'}`}>
                {charCount} / {charMin} min
              </span>
            </div>
          </div>
        )}

        {/* Step 2: Inner World */}
        {step === 2 && (
          <div className="space-y-4">
            <Textarea
              value={innerWorld}
              onChange={(e) => setInnerWorld(e.target.value)}
              rows={14}
              placeholder="I've always been someone who feels things deeply. The pattern I notice most is..."
              className="bg-white/[0.04] border-white/[0.08] text-gray-200 placeholder:text-gray-700 text-base resize-none focus:border-purple-500/30 focus:ring-purple-500/10"
            />
            <div className="flex justify-end">
              <span className={`text-xs tabular-nums ${charCount >= charMin ? 'text-green-500/70' : 'text-gray-600'}`}>
                {charCount} / {charMin} min
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Cinematic Scenes */}
        {step === 3 && (
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

            {scenes.length < 6 && (
              <button
                type="button"
                onClick={addScene}
                className="w-full py-3 rounded-lg border border-dashed border-white/10 text-sm text-gray-500 hover:border-white/20 hover:text-gray-400 transition-colors"
              >
                + Add another scene
              </button>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10 pt-6 border-t border-white/[0.06]">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="text-gray-500 hover:text-white gap-2 disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="bg-white text-black hover:bg-gray-200 gap-2 disabled:opacity-30 disabled:bg-white/10 disabled:text-gray-600"
          >
            {saving ? 'Saving...' : step === 3 ? 'Music Preferences' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
