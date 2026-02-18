'use client';

interface TherapistPromptProps {
  question: string;
  detail?: string;
}

export function TherapistPrompt({ question, detail }: TherapistPromptProps) {
  return (
    <div className="flex items-start gap-4 mb-8">
      {/* Robot therapist avatar */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-lg select-none">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Robot head */}
          <rect x="5" y="8" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
          {/* Antenna */}
          <line x1="14" y1="4" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" className="text-gray-500" />
          <circle cx="14" cy="3.5" r="1.5" fill="currentColor" className="text-purple-400/60" />
          {/* Glasses - left lens */}
          <circle cx="10.5" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.2" className="text-gray-300" />
          {/* Glasses - right lens */}
          <circle cx="17.5" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.2" className="text-gray-300" />
          {/* Glasses bridge */}
          <line x1="13" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1" className="text-gray-300" />
          {/* Mouth - friendly smile */}
          <path d="M11 19 Q14 21 17 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" className="text-gray-400" />
          {/* Eyes (behind glasses) */}
          <circle cx="10.5" cy="13.5" r="0.8" fill="currentColor" className="text-purple-400/80" />
          <circle cx="17.5" cy="13.5" r="0.8" fill="currentColor" className="text-purple-400/80" />
        </svg>
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
