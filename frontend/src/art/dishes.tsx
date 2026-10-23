import { Bowl, Cucumber, Dots, FriedEgg, HalfEgg, Noodles, Plate, Prawn, SauceDish, Sprouts } from './parts';

/** Bespoke art for the ten dishes the recognition model is trained on. */

export function NasiLemak() {
  return (
    <>
      <Plate />
      <path d="M60 17c14 6 30 9 38 22 7 12 4 30-6 42-9 11-25 17-38 16-13-1-26-9-33-21-8-13-6-30 3-42 9-12 22-12 36-17z" fill="#2f8a45" />
      <path d="M30 86L88 30M45 95l50-45M24 70l46-46" stroke="#3fa055" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      <path d="M38 62c-2-13 8-24 21-24 12 0 21 9 20 21-1 11-10 18-21 18-11 0-19-5-20-15z" fill="#fffdf6" />
      <path d="M44 70c6 5 16 6 24 2-7 6-18 6-24-2z" fill="#efe8d8" />
      <Dots fill="#f1ebdd" r={1.1} points={[[52, 50], [60, 47], [66, 55], [55, 60], [48, 58], [62, 64]]} />
      <path d="M70 66c3-7 12-10 18-6 6 4 5 13-1 17-6 4-15 3-17-3-1-3-1-5 0-8z" fill="#c62f1c" />
      <path d="M74 66c3-3 7-4 10-2" stroke="#e5604a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <Dots fill="#8f1f12" r={1.3} points={[[80, 72], [75, 74], [84, 68]]} />
      <HalfEgg x={40} y={80} rotate={-25} />
      <Cucumber x={83} y={40} r={8.5} />
      <Cucumber x={72} y={30} r={7.5} />
      <g fill="#c98a3d">
        <rect x="55" y="83" width="9" height="2.6" rx="1.3" transform="rotate(-20 55 83)" />
        <rect x="60" y="88" width="9" height="2.6" rx="1.3" transform="rotate(15 60 88)" />
        <rect x="66" y="84" width="8" height="2.4" rx="1.2" transform="rotate(-40 66 84)" />
      </g>
      <g fill="#b06b33">
        <ellipse cx="56" cy="91" rx="2.8" ry="2" />
        <ellipse cx="63" cy="94" rx="2.8" ry="2" transform="rotate(30 63 94)" />
        <ellipse cx="70" cy="90" rx="2.8" ry="2" />
        <ellipse cx="51" cy="87" rx="2.6" ry="1.9" />
      </g>
    </>
  );
}

export function RotiCanai() {
  return (
    <>
      <Plate />
      <path d="M20 66c-2-18 12-34 30-36 18-3 34 6 38 22 4 17-6 33-23 37-19 5-43-3-45-23z" fill="#e9b867" />
      <g fill="none" stroke="#d39a47" strokeWidth="2">
        <path d="M28 64c0-13 11-24 25-25 14-1 26 7 27 19 1 13-9 23-23 24-15 1-29-5-29-18z" />
        <path d="M37 63c1-8 8-14 17-14 9 0 16 6 16 13 0 8-7 13-16 13-10 0-17-4-17-12z" />
        <path d="M46 62c1-4 5-6 9-6 4 0 7 3 7 6 0 4-4 6-8 6-5 0-8-2-8-6z" />
      </g>
      <g fill="#c2802f" opacity=".8">
        <ellipse cx="34" cy="52" rx="4" ry="2.2" transform="rotate(-30 34 52)" />
        <ellipse cx="70" cy="76" rx="5" ry="2.4" transform="rotate(20 70 76)" />
        <ellipse cx="44" cy="80" rx="3.5" ry="2" />
        <ellipse cx="74" cy="46" rx="3" ry="1.8" transform="rotate(40 74 46)" />
        <ellipse cx="26" cy="72" rx="3" ry="1.6" />
      </g>
      <g fill="#f5d08f" opacity=".9">
        <ellipse cx="50" cy="40" rx="5" ry="1.6" transform="rotate(-10 50 40)" />
        <ellipse cx="78" cy="62" rx="4" ry="1.4" transform="rotate(70 78 62)" />
      </g>
      <SauceDish x={88} y={35} fill="#e3a335" r={11.5} />
      <Dots fill="#c47f1f" r={1.2} points={[[85, 38], [91, 36], [88, 41], [93, 40]]} />
    </>
  );
}

export function ChickenRice() {
  return (
    <>
      <Plate />
      <path d="M22 60c-1-15 10-26 24-26 13 0 23 10 22 24-1 13-11 21-23 21-12 0-22-6-23-19z" fill="#fbf0d3" />
      <path d="M29 70c7 7 21 8 31 1-9 9-25 9-31-1z" fill="#ecdcb1" />
      <Dots fill="#efe1bb" r={1.1} points={[[36, 45], [44, 42], [52, 48], [40, 54], [48, 58], [33, 58]]} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${70 + i * 4} ${44 + i * 10}) rotate(${-18 + i * 6})`}>
          <rect x="-14" y="-5.5" width="30" height="11" rx="5" fill="#fff3df" />
          <rect x="-14" y="-5.5" width="30" height="6" rx="3" fill="#e5ae6c" />
          <path d="M-9 -3.5h18" stroke="#f3cf9c" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      ))}
      <Dots fill="#5aa13b" r={1.2} points={[[72, 42], [78, 51], [74, 62], [82, 71]]} />
      <Cucumber x={40} y={88} r={7} />
      <Cucumber x={52} y={92} r={7} />
      <SauceDish x={86} y={88} fill="#df4527" r={9} />
      <Dots fill="#f7b49e" r={0.9} points={[[83, 86], [88, 90], [86, 84]]} />
    </>
  );
}

export function CharKueyTeow() {
  return (
    <>
      <Plate />
      <path d="M22 60c0-19 16-36 38-36s38 15 38 34-16 38-38 38-38-17-38-36z" fill="#a5642c" />
      <Noodles
        width={6}
        color="#c98845"
        paths={[
          'M30 48c8-6 16 4 24-2s16 2 24-3',
          'M28 62c9-5 15 5 25 0s17 3 26-2',
          'M34 76c8-4 14 4 22 0s14 2 22-2',
          'M40 36c6-3 12 2 18-1s12 1 18-1',
          'M33 86c7-2 12 2 18 0s12 1 17-1',
        ]}
      />
      <Noodles width={4} color="#b47035" paths={['M36 55c7-3 12 3 18 0s12 2 18-1', 'M38 69c7-3 12 3 18 0s12 2 18-1']} />
      <Dots fill="#6f3a15" r={1.6} points={[[44, 44], [62, 58], [52, 72], [70, 80], [36, 66], [78, 50]]} />
      <Sprouts color="#f6f0d4" points={[[42, 50, 20], [64, 66, -30], [52, 82, 10], [74, 42, 40], [30, 70, -10]]} />
      <g stroke="#4f9a39" strokeWidth="2.2" strokeLinecap="round">
        <path d="M50 38l9 5M70 74l8-4M34 58l7 4M60 88l8-2" />
      </g>
      <g fill="#f3c64e">
        <path d="M66 52c3-2 7-1 8 2-2 3-6 3-8-2z" />
        <path d="M40 78c3-2 6-1 7 2-2 2-5 2-7-2z" />
      </g>
      <Prawn x={58} y={52} rotate={20} />
      <Prawn x={78} y={64} rotate={-40} scale={0.9} />
      <Prawn x={44} y={64} rotate={160} scale={0.85} />
      <g fill="#8b5a3c">
        <ellipse cx="68" cy="40" rx="2.6" ry="2" />
        <ellipse cx="34" cy="48" rx="2.6" ry="2" />
      </g>
    </>
  );
}

export function MeeGorengMamak() {
  return (
    <>
      <Plate />
      <path d="M22 62c0-20 17-38 38-38 22 0 37 17 37 36s-16 36-37 36-38-15-38-34z" fill="#d9832f" />
      <Noodles
        width={3.4}
        color="#f0b24b"
        paths={[
          'M28 50c6-5 10 3 16-1s10 3 16-1 10 3 16-1 8 2 12 0',
          'M26 60c6-5 10 3 16-1s10 3 16-1 10 3 16-1 9 2 14 0',
          'M28 70c6-5 10 3 16-1s10 3 16-1 10 3 16-1 8 2 12 0',
          'M34 80c6-5 10 3 16-1s10 3 16-1 8 2 12 0',
          'M36 40c6-4 10 3 16-1s10 3 16-1 6 2 10 0',
          'M42 89c5-3 9 2 14 0s9 2 14 0',
        ]}
      />
      <Noodles width={2.4} color="#c4611f" paths={['M30 55c6-4 10 3 16-1s10 3 16-1 10 3 16-1', 'M32 75c6-4 10 3 16-1s10 3 16-1 8 2 12 0']} />
      <g>
        <rect x="44" y="52" width="9" height="9" rx="2" fill="#e8c17a" stroke="#c99a4e" strokeWidth="1" transform="rotate(12 48 56)" />
        <rect x="64" y="68" width="9" height="9" rx="2" fill="#e8c17a" stroke="#c99a4e" strokeWidth="1" transform="rotate(-10 68 72)" />
        <rect x="38" y="70" width="8" height="8" rx="2.5" fill="#f2d48c" transform="rotate(25 42 74)" />
      </g>
      <g fill="#f7d660">
        <path d="M58 44c4-3 9-2 10 2-3 3-8 3-10-2z" />
        <path d="M70 56c3-2 7-1 8 2-2 3-6 3-8-2z" />
      </g>
      <g fill="#4f9a39">
        <path d="M30 64c3-6 9-7 12-4-2 5-7 6-12 4z" />
        <path d="M74 82c3-6 9-7 12-4-2 5-7 6-12 4z" />
      </g>
      <g transform="translate(88 40)">
        <circle r="10" fill="#7fb43a" />
        <circle r="8.3" fill="#dcefa6" />
        <path d="M0 -8v16M-7 -4l14 8M-7 4l14 -8" stroke="#b8d978" strokeWidth="1.1" />
      </g>
      <Dots fill="#8a4a1d" r={1.1} points={[[52, 78], [60, 62], [46, 46], [76, 48]]} />
    </>
  );
}

export function NasiGoreng() {
  return (
    <>
      <Plate />
      <path d="M24 64c-2-18 13-34 34-35 21-1 36 13 37 31s-14 33-35 33-35-11-36-29z" fill="#d6a25a" />
      <Dots fill="#e7bd7d" r={1.4} points={[[34, 52], [42, 44], [50, 40], [62, 38], [74, 44], [82, 54], [86, 66], [34, 70], [42, 80], [56, 86], [70, 84], [80, 76], [30, 60]]} />
      <Dots fill="#d8442a" r={1.4} points={[[38, 58], [70, 50], [80, 68], [48, 80], [62, 78]]} />
      <Dots fill="#5ba33f" r={1.5} points={[[44, 52], [76, 58], [52, 74], [66, 88], [36, 76]]} />
      <g fill="#f08a3c">
        <rect x="56" y="46" width="3.2" height="3.2" rx="0.6" />
        <rect x="84" y="62" width="3.2" height="3.2" rx="0.6" />
        <rect x="40" y="64" width="3.2" height="3.2" rx="0.6" />
      </g>
      <FriedEgg x={62} y={60} scale={1.15} />
      <Cucumber x={27} y={36} r={7} />
      <Cucumber x={36} y={28} r={6.5} />
      <path d="M86 26c6 1 10 6 9 12-6 2-12-1-14-6 1-3 3-5 5-6z" fill="#f6e5d8" stroke="#ecd2bf" strokeWidth="1" />
      <path d="M80 92c5-3 11-2 13 2-3 4-10 4-13-2z" fill="#e2563f" />
    </>
  );
}

export function Laksa() {
  return (
    <>
      <Bowl fill="#e8862c" />
      <Dots fill="#f4a647" r={2.2} points={[[30, 52], [38, 86], [84, 84], [90, 50], [60, 26]]} />
      <g fill="none" stroke="#d2661a" strokeWidth="1.3" opacity=".8">
        <circle cx="34" cy="70" r="3.2" />
        <circle cx="86" cy="66" r="2.6" />
        <circle cx="70" cy="30" r="2.4" />
      </g>
      <Noodles
        width={2.6}
        color="#f5dc96"
        paths={['M38 56c6-6 12 4 18-2s12 4 18-2', 'M40 64c6-6 12 4 18-2s12 4 18-2', 'M44 72c6-5 11 3 16-1s10 3 14 0', 'M44 48c5-4 9 3 14-1s9 3 13 0']}
      />
      {[
        [34, 40, 10],
        [78, 40, -15],
        [72, 76, 20],
      ].map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
          <rect x="-7" y="-7" width="14" height="14" rx="4" fill="#d9a441" />
          <rect x="-4.5" y="-4.5" width="9" height="9" rx="3" fill="#e9bd5f" />
        </g>
      ))}
      <HalfEgg x={48} y={82} rotate={20} scale={0.85} />
      <Prawn x={62} y={44} rotate={10} scale={0.9} />
      <Sprouts color="#fbf6e2" points={[[56, 60, 30], [66, 66, -20], [30, 62, 70], [86, 56, 100]]} />
      <g fill="#3f8f3f">
        <path d="M84 72c2-4 7-5 9-2-2 4-6 5-9 2z" />
        <path d="M80 77c2-4 7-5 9-2-2 4-6 5-9 2z" />
      </g>
      <path d="M26 58c3-4 9-4 11 0-2 4-8 5-11 0z" fill="#b8321c" />
    </>
  );
}

export function Satay() {
  return (
    <>
      <Plate />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${(i - 1.6) * 9} ${(i - 1.6) * 9})`}>
          <path d="M26 92L86 32" stroke="#d6b479" strokeWidth="2.6" strokeLinecap="round" />
          {[0, 1, 2, 3].map((j) => (
            <g key={j} transform={`translate(${38 + j * 10.5} ${80 - j * 10.5}) rotate(-45)`}>
              <rect x="-6.5" y="-5" width="13" height="10" rx="3.5" fill="#a5532a" />
              <rect x="-6.5" y="-5" width="13" height="4" rx="2" fill="#c4703b" />
              <path d="M-3 2h6" stroke="#6b3214" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          ))}
        </g>
      ))}
      <SauceDish x={84} y={86} fill="#c27a32" r={12} />
      <Dots fill="#8e5320" r={1.3} points={[[80, 84], [86, 90], [88, 82], [82, 90]]} />
      <g>
        <rect x="22" y="30" width="9" height="9" rx="2" fill="#d6ecbd" stroke="#3d8b3a" strokeWidth="1.6" transform="rotate(15 26 34)" />
        <rect x="32" y="22" width="8" height="8" rx="2" fill="#d6ecbd" stroke="#3d8b3a" strokeWidth="1.6" transform="rotate(-10 36 26)" />
        <path d="M20 46c3-5 9-6 12-2-3 4-8 5-12 2z" fill="#a24f97" />
        <path d="M22 45c2-2 6-3 8-1" stroke="#e6c3e1" strokeWidth="1.1" fill="none" />
      </g>
    </>
  );
}

export function Rendang() {
  return (
    <>
      <Bowl fill="#7b4422" />
      <path d="M22 60c0-20 17-36 38-36s38 16 38 36-17 36-38 36-38-16-38-36z" fill="#8a5129" />
      {[
        [44, 46, 14, 10, 20],
        [70, 44, 13, 10, -15],
        [58, 62, 15, 11, 5],
        [38, 70, 12, 9, -25],
        [78, 66, 13, 9, 30],
        [56, 82, 12, 8, -10],
      ].map(([x, y, rx, ry, r]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse rx={rx} ry={ry} fill="#5a2f17" />
          <ellipse rx={rx * 0.75} ry={ry * 0.6} cx={-2} cy={-2} fill="#6f3b1c" />
        </g>
      ))}
      <Dots fill="#a8743f" r={1.2} points={[[40, 44], [48, 50], [66, 40], [74, 48], [54, 58], [62, 66], [36, 72], [80, 64], [52, 84], [60, 80]]} />
      <g stroke="#2f6b2a" strokeWidth="2.2" strokeLinecap="round">
        <path d="M30 54l8 -3M84 52l7 2M46 92l7 -2" />
      </g>
      <g fill="#e2d9a0">
        <circle cx="66" cy="54" r="2.4" />
        <circle cx="48" cy="72" r="2.2" />
      </g>
      <path d="M72 82c3-3 7-3 9 0-2 3-6 3-9 0z" fill="#c9341f" />
    </>
  );
}

export function Thosai() {
  return (
    <>
      <Plate />
      <g transform="rotate(-30 52 64)">
        <rect x="14" y="52" width="76" height="24" rx="12" fill="#e2b159" />
        <path d="M22 58h60M20 64h64M22 70h60" stroke="#c88e39" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
        <path d="M28 56h40" stroke="#f1d08d" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="88" cy="64" rx="5" ry="12" fill="#cf9a44" />
        <ellipse cx="88" cy="64" rx="2.5" ry="7" fill="#b98232" />
      </g>
      <SauceDish x={84} y={74} fill="#f2eedc" r={9} />
      <Dots fill="#5a9a3d" r={0.9} points={[[82, 72], [86, 76], [84, 70]]} />
      <SauceDish x={86} y={47} fill="#c7782f" r={9} />
      <Dots fill="#e9a65b" r={1.1} points={[[84, 45], [88, 49]]} />
      <SauceDish x={66} y={92} fill="#d8492f" r={8} />
    </>
  );
}
