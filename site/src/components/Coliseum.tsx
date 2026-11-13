/** Original amphitheatre drawing (not copied from a third-party page). */
export function Coliseum() {
  const far = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const ang = Math.PI * (1 - t);
    return {
      x: 500 + 400 * Math.cos(ang),
      y: 178 - 52 * Math.sin(Math.PI * t),
      w: 18 + 10 * Math.sin(Math.PI * t),
      h: 28 + 16 * Math.sin(Math.PI * t),
    };
  });
  const mid = Array.from({ length: 15 }, (_, i) => {
    const t = i / 14;
    const ang = Math.PI * (1 - t);
    return {
      x: 500 + 355 * Math.cos(ang),
      y: 214 - 38 * Math.sin(Math.PI * t),
      w: 14 + 8 * Math.sin(Math.PI * t),
      h: 18 + 10 * Math.sin(Math.PI * t),
    };
  });

  return (
    <svg className="coliseum-art" viewBox="0 40 1000 440" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id="hill-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ea07a" />
          <stop offset="100%" stopColor="#5d7a55" />
        </linearGradient>
        <linearGradient id="hill-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a9a4a" />
          <stop offset="100%" stopColor="#6b7a38" />
        </linearGradient>
        <radialGradient id="sand" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#f0ddb0" />
          <stop offset="70%" stopColor="#d4b47a" />
          <stop offset="100%" stopColor="#b08a52" />
        </radialGradient>
      </defs>
      <path d="M0 150 C 120 110 220 130 340 118 C 460 104 520 138 640 122 C 760 106 880 128 1000 100 L 1000 240 L 0 240 Z" fill="url(#hill-far)" />
      <path d="M0 188 C 160 150 280 176 420 158 C 560 140 700 172 840 154 C 920 144 970 150 1000 142 L 1000 280 L 0 280 Z" fill="url(#hill-near)" />
      <ellipse cx="500" cy="318" rx="478" ry="168" fill="#8d6a45" />
      <ellipse cx="500" cy="312" rx="452" ry="152" fill="#c4a06e" />
      <ellipse cx="500" cy="308" rx="410" ry="132" fill="#a67c4e" />
      {far.map((a, i) => (
        <path
          key={`f${i}`}
          d={`M ${a.x - a.w} ${a.y + a.h} V ${a.y + 8} A ${a.w} ${a.w} 0 0 1 ${a.x + a.w} ${a.y + 8} V ${a.y + a.h} Z`}
          fill="#8fb7d4"
          stroke="#7a5532"
          strokeWidth="3"
        />
      ))}
      <ellipse cx="500" cy="328" rx="330" ry="102" fill="#b89564" />
      {mid.map((a, i) => (
        <path
          key={`m${i}`}
          d={`M ${a.x - a.w} ${a.y + a.h} V ${a.y + 6} A ${a.w} ${a.w} 0 0 1 ${a.x + a.w} ${a.y + 6} V ${a.y + a.h} Z`}
          fill="#9ec4dc"
          stroke="#6e4c2c"
          strokeWidth="2.5"
        />
      ))}
      <ellipse cx="500" cy="348" rx="232" ry="72" fill="#d8b888" />
      <ellipse cx="500" cy="358" rx="188" ry="50" fill="url(#sand)" stroke="#8a6238" strokeWidth="6" />
      <path d="M 330 378 Q 500 408 670 378" fill="none" stroke="#6e4c2c" strokeWidth="5" />
    </svg>
  );
}
