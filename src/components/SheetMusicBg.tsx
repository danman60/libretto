'use client';

/**
 * Animated sheet music background — slightly blurry, drifting notation
 * elements (staff lines, notes, treble clefs) for a cinematic feel.
 */
export function SheetMusicBg() {
  return (
    <div className="sheet-music-bg" aria-hidden="true">
      {/* Layer 1: slow drift left */}
      <svg className="sheet-music-layer sheet-music-drift-1" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
        {/* Staff lines */}
        <g opacity="0.35" stroke="currentColor" strokeWidth="0.8" fill="none">
          <line x1="0" y1="100" x2="1200" y2="100" />
          <line x1="0" y1="112" x2="1200" y2="112" />
          <line x1="0" y1="124" x2="1200" y2="124" />
          <line x1="0" y1="136" x2="1200" y2="136" />
          <line x1="0" y1="148" x2="1200" y2="148" />
        </g>
        <g opacity="0.25" stroke="currentColor" strokeWidth="0.8" fill="none">
          <line x1="0" y1="420" x2="1200" y2="420" />
          <line x1="0" y1="432" x2="1200" y2="432" />
          <line x1="0" y1="444" x2="1200" y2="444" />
          <line x1="0" y1="456" x2="1200" y2="456" />
          <line x1="0" y1="468" x2="1200" y2="468" />
        </g>
        <g opacity="0.2" stroke="currentColor" strokeWidth="0.8" fill="none">
          <line x1="0" y1="680" x2="1200" y2="680" />
          <line x1="0" y1="692" x2="1200" y2="692" />
          <line x1="0" y1="704" x2="1200" y2="704" />
          <line x1="0" y1="716" x2="1200" y2="716" />
          <line x1="0" y1="728" x2="1200" y2="728" />
        </g>

        {/* Treble clef approximation */}
        <text x="40" y="145" fontSize="64" opacity="0.3" fill="currentColor" fontFamily="serif">&#119070;</text>
        <text x="40" y="465" fontSize="64" opacity="0.2" fill="currentColor" fontFamily="serif">&#119070;</text>

        {/* Quarter notes */}
        <g fill="currentColor">
          <ellipse cx="180" cy="124" rx="7" ry="5.5" opacity="0.3" transform="rotate(-15 180 124)" />
          <line x1="187" y1="124" x2="187" y2="82" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />

          <ellipse cx="280" cy="136" rx="7" ry="5.5" opacity="0.25" transform="rotate(-15 280 136)" />
          <line x1="287" y1="136" x2="287" y2="94" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />

          <ellipse cx="400" cy="112" rx="7" ry="5.5" opacity="0.3" transform="rotate(-15 400 112)" />
          <line x1="407" y1="112" x2="407" y2="70" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />

          <ellipse cx="520" cy="148" rx="7" ry="5.5" opacity="0.2" transform="rotate(-15 520 148)" />
          <line x1="527" y1="148" x2="527" y2="106" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />

          <ellipse cx="660" cy="100" rx="7" ry="5.5" opacity="0.3" transform="rotate(-15 660 100)" />
          <line x1="667" y1="100" x2="667" y2="58" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />

          <ellipse cx="800" cy="124" rx="7" ry="5.5" opacity="0.25" transform="rotate(-15 800 124)" />
          <line x1="807" y1="124" x2="807" y2="82" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />

          <ellipse cx="950" cy="136" rx="7" ry="5.5" opacity="0.2" transform="rotate(-15 950 136)" />
          <line x1="957" y1="136" x2="957" y2="94" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />

          {/* Second staff notes */}
          <ellipse cx="200" cy="444" rx="7" ry="5.5" opacity="0.2" transform="rotate(-15 200 444)" />
          <line x1="207" y1="444" x2="207" y2="402" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />

          <ellipse cx="380" cy="432" rx="7" ry="5.5" opacity="0.25" transform="rotate(-15 380 432)" />
          <line x1="387" y1="432" x2="387" y2="390" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />

          <ellipse cx="560" cy="456" rx="7" ry="5.5" opacity="0.2" transform="rotate(-15 560 456)" />
          <line x1="567" y1="456" x2="567" y2="414" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />

          <ellipse cx="740" cy="420" rx="7" ry="5.5" opacity="0.2" transform="rotate(-15 740 420)" />
          <line x1="747" y1="420" x2="747" y2="378" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />

          <ellipse cx="900" cy="444" rx="7" ry="5.5" opacity="0.15" transform="rotate(-15 900 444)" />
          <line x1="907" y1="444" x2="907" y2="402" stroke="currentColor" strokeWidth="1.2" opacity="0.15" />

          {/* Third staff notes */}
          <ellipse cx="150" cy="704" rx="7" ry="5.5" opacity="0.15" transform="rotate(-15 150 704)" />
          <line x1="157" y1="704" x2="157" y2="662" stroke="currentColor" strokeWidth="1.2" opacity="0.15" />

          <ellipse cx="450" cy="692" rx="7" ry="5.5" opacity="0.18" transform="rotate(-15 450 692)" />
          <line x1="457" y1="692" x2="457" y2="650" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />

          <ellipse cx="750" cy="716" rx="7" ry="5.5" opacity="0.15" transform="rotate(-15 750 716)" />
          <line x1="757" y1="716" x2="757" y2="674" stroke="currentColor" strokeWidth="1.2" opacity="0.15" />

          <ellipse cx="1050" cy="680" rx="7" ry="5.5" opacity="0.18" transform="rotate(-15 1050 680)" />
          <line x1="1057" y1="680" x2="1057" y2="638" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />
        </g>

        {/* Half notes (open) */}
        <g fill="none" stroke="currentColor">
          <ellipse cx="1080" cy="112" rx="7" ry="5.5" strokeWidth="1.5" opacity="0.25" transform="rotate(-15 1080 112)" />
          <line x1="1087" y1="112" x2="1087" y2="70" strokeWidth="1.2" opacity="0.25" />

          <ellipse cx="600" cy="136" rx="7" ry="5.5" strokeWidth="1.5" opacity="0.2" transform="rotate(-15 600 136)" />
          <line x1="607" y1="136" x2="607" y2="94" strokeWidth="1.2" opacity="0.2" />
        </g>

        {/* Eighth note beams */}
        <g fill="currentColor" opacity="0.22">
          <ellipse cx="320" cy="456" rx="6" ry="4.5" transform="rotate(-15 320 456)" />
          <line x1="326" y1="456" x2="326" y2="414" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="350" cy="444" rx="6" ry="4.5" transform="rotate(-15 350 444)" />
          <line x1="356" y1="444" x2="356" y2="414" stroke="currentColor" strokeWidth="1.2" />
          <line x1="326" y1="414" x2="356" y2="414" stroke="currentColor" strokeWidth="2" />
        </g>
      </svg>

      {/* Layer 2: slow drift right (offset) */}
      <svg className="sheet-music-layer sheet-music-drift-2" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.2" stroke="currentColor" strokeWidth="0.8" fill="none">
          <line x1="0" y1="260" x2="1200" y2="260" />
          <line x1="0" y1="272" x2="1200" y2="272" />
          <line x1="0" y1="284" x2="1200" y2="284" />
          <line x1="0" y1="296" x2="1200" y2="296" />
          <line x1="0" y1="308" x2="1200" y2="308" />
        </g>
        <g opacity="0.18" stroke="currentColor" strokeWidth="0.8" fill="none">
          <line x1="0" y1="560" x2="1200" y2="560" />
          <line x1="0" y1="572" x2="1200" y2="572" />
          <line x1="0" y1="584" x2="1200" y2="584" />
          <line x1="0" y1="596" x2="1200" y2="596" />
          <line x1="0" y1="608" x2="1200" y2="608" />
        </g>

        <text x="60" y="305" fontSize="64" opacity="0.2" fill="currentColor" fontFamily="serif">&#119070;</text>
        <text x="60" y="605" fontSize="64" opacity="0.15" fill="currentColor" fontFamily="serif">&#119070;</text>

        <g fill="currentColor">
          <ellipse cx="220" cy="284" rx="7" ry="5.5" opacity="0.2" transform="rotate(-15 220 284)" />
          <line x1="227" y1="284" x2="227" y2="242" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />

          <ellipse cx="420" cy="272" rx="7" ry="5.5" opacity="0.18" transform="rotate(-15 420 272)" />
          <line x1="427" y1="272" x2="427" y2="230" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />

          <ellipse cx="620" cy="296" rx="7" ry="5.5" opacity="0.2" transform="rotate(-15 620 296)" />
          <line x1="627" y1="296" x2="627" y2="254" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />

          <ellipse cx="820" cy="260" rx="7" ry="5.5" opacity="0.18" transform="rotate(-15 820 260)" />
          <line x1="827" y1="260" x2="827" y2="218" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />

          <ellipse cx="1020" cy="284" rx="7" ry="5.5" opacity="0.15" transform="rotate(-15 1020 284)" />
          <line x1="1027" y1="284" x2="1027" y2="242" stroke="currentColor" strokeWidth="1.2" opacity="0.15" />

          <ellipse cx="300" cy="584" rx="7" ry="5.5" opacity="0.15" transform="rotate(-15 300 584)" />
          <line x1="307" y1="584" x2="307" y2="542" stroke="currentColor" strokeWidth="1.2" opacity="0.15" />

          <ellipse cx="550" cy="572" rx="7" ry="5.5" opacity="0.18" transform="rotate(-15 550 572)" />
          <line x1="557" y1="572" x2="557" y2="530" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />

          <ellipse cx="800" cy="596" rx="7" ry="5.5" opacity="0.15" transform="rotate(-15 800 596)" />
          <line x1="807" y1="596" x2="807" y2="554" stroke="currentColor" strokeWidth="1.2" opacity="0.15" />

          <ellipse cx="1000" cy="560" rx="7" ry="5.5" opacity="0.15" transform="rotate(-15 1000 560)" />
          <line x1="1007" y1="560" x2="1007" y2="518" stroke="currentColor" strokeWidth="1.2" opacity="0.15" />
        </g>
      </svg>
    </div>
  );
}
