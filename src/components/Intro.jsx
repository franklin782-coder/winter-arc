import React, { useEffect, useRef, useState } from 'react';

// Короткое приветствие: один раз за сессию вкладки. Таймер и жест оба снимают оверлей.
export default function Intro({ dayLabel, onClose }) {
  const [out, setOut] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      closeRef.current();
      return undefined;
    }
    const t = setTimeout(() => setOut(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!out) return undefined;
    const t = setTimeout(() => closeRef.current(), 420);
    return () => clearTimeout(t);
  }, [out]);

  const skip = (e) => {
    e.stopPropagation();
    setOut(true);
  };

  return (
    <div
      className={`intro-overlay${out ? ' intro-overlay--out' : ''}`}
      role="dialog"
      aria-label="Приветствие Winter Arc"
      onClick={skip}
    >
      <div className="intro-copy">
        <div className="font-semibold tracking-tight text-white text-[1.65rem] leading-none">WINTER ARC</div>
        <div className="mt-2 text-sm text-slate-400">{dayLabel}</div>
      </div>

      <div className="intro-figure" aria-hidden="true">
        <svg viewBox="0 0 240 320" className="intro-svg">
          <ellipse cx="120" cy="300" rx="54" ry="8" fill="#02040a" opacity="0.45" />

          {/* зимнее пальто, приглушённый сине-серый */}
          <path d="M92 156c-28 10-40 46-46 112-2 22 10 40 28 44h92c18-4 30-22 28-44-6-66-18-102-46-112-10 16-36 16-56 0z" fill="#5d6e80" />
          <path d="M104 164l16 28 16-28c-6 12-26 12-32 0z" fill="#8ea0b2" />
          <path d="M120 196v78" stroke="#4a5b6c" strokeWidth="1.4" opacity="0.7" />
          <circle cx="120" cy="214" r="2" fill="#d5dee8" />
          <circle cx="120" cy="236" r="2" fill="#d5dee8" />
          <circle cx="120" cy="258" r="2" fill="#d5dee8" />

          {/* левая рука опущена */}
          <path d="M156 168c16 8 26 36 24 74-1 10-12 14-16 6-6-28-8-52-16-66-2-6 2-16 8-14z" fill="#526578" />
          <ellipse cx="176" cy="248" rx="8" ry="7" fill="#f0c9b4" />

          {/* правая рука — один взмах */}
          <g className="intro-wave">
            <path d="M92 164C74 150 58 132 54 112c-2-12 8-18 16-12 10 14 22 32 34 46 4 4-2 16-12 18z" fill="#526578" />
            <path d="M62 108C48 96 44 78 54 68c8-8 18-2 20 10 2 14 6 24 16 32-8 2-20 0-28-2z" fill="#526578" />
            <ellipse cx="54" cy="66" rx="12" ry="11" fill="#f0c9b4" />
            <path d="M46 60c-1-8 3-13 7-12M54 56c0-9 5-13 8-11M63 60c2-8 7-11 10-7" stroke="#f0c9b4" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          </g>

          {/* шея, чтобы фон не просвечивал между лицом и пальто */}
          <path d="M106 136h28v28c-4 6-10 8-14 8s-10-2-14-8z" fill="#f3ccb6" />

          {/* голова */}
          <circle cx="120" cy="112" r="32" fill="#f3ccb6" />
          <path d="M88 108c0-36 16-54 32-54s32 18 32 54c-6-16-16-24-32-24s-26 8-32 24z" fill="#3d2b22" />
          <path d="M90 104c8 10 16 8 22-2-10 2-16 0-22 2z" fill="#3d2b22" />
          <path d="M150 104c-8 10-16 8-22-2 10 2 16 0 22 2z" fill="#3d2b22" />
          <path d="M96 78c8-16 18-22 24-22 2 8-2 16-8 22-6-2-12-2-16 0z" fill="#5a4032" opacity="0.9" />

          <ellipse cx="108" cy="114" rx="3.2" ry="3.8" fill="#2a211c" />
          <ellipse cx="132" cy="114" rx="3.2" ry="3.8" fill="#2a211c" />
          <circle cx="107" cy="112.5" r="1" fill="#fff" />
          <circle cx="131" cy="112.5" r="1" fill="#fff" />
          <path d="M114 128q6 5 12 0" stroke="#c48474" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <ellipse cx="98" cy="124" rx="5" ry="2.4" fill="#e7a090" opacity="0.35" />
          <ellipse cx="142" cy="124" rx="5" ry="2.4" fill="#e7a090" opacity="0.35" />

          {/* длинные тёмно-каштановые пряди по бокам, пальто остаётся видно */}
          <path d="M86 114C66 150 60 210 72 268c6 28 16 40 26 36 2-48 4-110 14-156 2-14-6-30-26-34z" fill="#3d2b22" />
          <path d="M154 114c20 36 26 96 14 154-6 28-16 40-26 36-2-48-4-110-14-156-2-14 6-30 26-34z" fill="#3d2b22" />
          <path d="M96 124c-10 36-8 96-2 150 6-44 8-96 10-132-2-8-4-14-8-18z" fill="#5a4032" />
          <path d="M144 124c10 36 8 96 2 150-6-44-8-96-10-132 2-8 4-14 8-18z" fill="#5a4032" />
        </svg>
      </div>

      <button type="button" className="intro-skip" onClick={skip}>
        Пропустить
      </button>
    </div>
  );
}
