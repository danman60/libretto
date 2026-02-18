'use client';

import Image from 'next/image';

interface TherapistPromptProps {
  question: string;
  detail?: string;
}

export function TherapistPrompt({ question, detail }: TherapistPromptProps) {
  return (
    <div className="flex items-start gap-4 mb-8">
      {/* Robot therapist avatar */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border border-white/10">
        <Image
          src="/therapist.png"
          alt="Oliver"
          width={48}
          height={48}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Speech bubble */}
      <div className="flex-1 relative bg-white/[0.04] border border-white/[0.08] rounded-xl rounded-tl-sm px-5 py-4">
        <h2 className="text-lg font-semibold text-white mb-1">{question}</h2>
        {detail && (
          <p className="text-gray-500 text-sm leading-relaxed">{detail}</p>
        )}
      </div>
    </div>
  );
}
