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
              ? 'ring-2 ring-[#E8A87C] shadow-lg shadow-[#E8A87C]/10 border-[#E8A87C]/30'
              : 'hover:border-[#E8A87C]/20'
          }`}
        >
          <div className="text-2xl mb-2">{type.icon}</div>
          <h3 className="text-[#F5F0EB] font-semibold text-sm mb-0.5">{type.label}</h3>
          <p className="text-[#9B8E99] text-xs leading-snug">{type.tagline}</p>
        </button>
      ))}
    </div>
  );
}
