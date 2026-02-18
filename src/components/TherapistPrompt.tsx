'use client';

interface TherapistPromptProps {
  question: string;
  detail?: string;
}

function OliverBot() {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Curly hair - wild and voluminous */}
      <ellipse cx="32" cy="16" rx="18" ry="10" fill="#8B6914" opacity="0.7" />
      <circle cx="16" cy="18" r="6" fill="#8B6914" opacity="0.6" />
      <circle cx="48" cy="18" r="6" fill="#8B6914" opacity="0.6" />
      <circle cx="20" cy="12" r="5" fill="#9B7924" opacity="0.7" />
      <circle cx="44" cy="12" r="5" fill="#9B7924" opacity="0.7" />
      <circle cx="26" cy="9" r="4.5" fill="#8B6914" opacity="0.65" />
      <circle cx="38" cy="9" r="4.5" fill="#8B6914" opacity="0.65" />
      <circle cx="32" cy="8" r="4" fill="#9B7924" opacity="0.6" />
      <circle cx="14" cy="24" r="4" fill="#8B6914" opacity="0.5" />
      <circle cx="50" cy="24" r="4" fill="#8B6914" opacity="0.5" />
      <circle cx="12" cy="30" r="3" fill="#8B6914" opacity="0.4" />
      <circle cx="52" cy="30" r="3" fill="#8B6914" opacity="0.4" />

      {/* Robot head */}
      <rect x="16" y="18" width="32" height="28" rx="6" fill="#2A2A3A" stroke="#4A4A6A" strokeWidth="1.5" />

      {/* Antenna */}
      <line x1="32" y1="14" x2="32" y2="18" stroke="#6A6A8A" strokeWidth="1.5" />
      <circle cx="32" cy="12" r="2.5" fill="#A78BFA" opacity="0.8">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Glasses - round frames */}
      <circle cx="25" cy="31" r="6.5" stroke="#C0C0C0" strokeWidth="1.8" fill="none" />
      <circle cx="39" cy="31" r="6.5" stroke="#C0C0C0" strokeWidth="1.8" fill="none" />
      {/* Glasses bridge */}
      <path d="M31.5 31 Q32 29.5 32.5 31" stroke="#C0C0C0" strokeWidth="1.5" fill="none" />
      {/* Glasses arms */}
      <line x1="18.5" y1="30" x2="16" y2="29" stroke="#C0C0C0" strokeWidth="1.2" />
      <line x1="45.5" y1="30" x2="48" y2="29" stroke="#C0C0C0" strokeWidth="1.2" />

      {/* Eyes behind glasses - friendly */}
      <circle cx="25" cy="30.5" r="2" fill="#A78BFA" />
      <circle cx="39" cy="30.5" r="2" fill="#A78BFA" />
      {/* Eye shine */}
      <circle cx="26" cy="29.5" r="0.8" fill="white" opacity="0.7" />
      <circle cx="40" cy="29.5" r="0.8" fill="white" opacity="0.7" />

      {/* Mustache - handlebar style */}
      <path d="M26 39 Q28 37.5 32 38 Q36 37.5 38 39" stroke="#8B6914" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M25 39 Q24 40.5 23 40" stroke="#8B6914" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M39 39 Q40 40.5 41 40" stroke="#8B6914" strokeWidth="1.3" strokeLinecap="round" fill="none" />

      {/* Smile under mustache */}
      <path d="M28 41.5 Q32 43.5 36 41.5" stroke="#6A6A8A" strokeWidth="1" strokeLinecap="round" fill="none" />

      {/* Cheek bolts (robot detail) */}
      <circle cx="19" cy="35" r="1.2" fill="#4A4A6A" />
      <circle cx="45" cy="35" r="1.2" fill="#4A4A6A" />

      {/* Body hint */}
      <rect x="22" y="46" width="20" height="10" rx="4" fill="#2A2A3A" stroke="#4A4A6A" strokeWidth="1" />
      {/* Hoodie/collar detail */}
      <path d="M24 46 L28 50 L32 47 L36 50 L40 46" stroke="#3D6B5A" strokeWidth="1.5" fill="#3D6B5A" opacity="0.7" />
    </svg>
  );
}

export function TherapistPrompt({ question, detail }: TherapistPromptProps) {
  return (
    <div className="flex items-start gap-4 mb-8">
      {/* Robot therapist avatar */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/[0.04] flex items-center justify-center">
        <OliverBot />
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
