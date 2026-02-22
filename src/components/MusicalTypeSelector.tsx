'use client';

import { MUSICAL_TYPES } from '@/lib/musical-types';
import type { MusicalType } from '@/lib/types';

interface MusicalTypeSelectorProps {
  selected: MusicalType | null;
  onSelect: (type: MusicalType) => void;
}

export function MusicalTypeSelector({ selected, onSelect }: MusicalTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {MUSICAL_TYPES.map((type) => (
        <button
          key={type.id}
          onClick={() => onSelect(type.id)}
          className={`glass-card p-4 text-left transition-all duration-200 group ${
            selected === type.id
              ? 'ring-2 ring-[#C9A84C] shadow-lg shadow-[#C9A84C]/20 border-[#C9A84C]/40'
              : 'hover:border-[#C9A84C]/25'
          }`}
        >
          <div className="text-2xl mb-2">{type.icon}</div>
          <h3 className="text-[#F2E8D5] font-semibold text-sm mb-0.5" style={{ fontFamily: 'var(--font-playfair)' }}>
            {type.label}
          </h3>
          <p className="text-[#F2E8D5]/40 text-xs leading-snug" style={{ fontFamily: 'var(--font-cormorant)' }}>
            {type.tagline}
          </p>
        </button>
      ))}
    </div>
  );
}
