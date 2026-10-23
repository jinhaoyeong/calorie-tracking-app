import { Bowl, Cucumber, Dots, FriedEgg, HalfEgg, Noodles, Plate, Prawn, SauceDish, Sprouts } from './parts';

/** Parameterised art so every food in the database gets a distinct illustration. */

export function Glass({ liquid, foam, ice = true, lime = false }: { liquid: string; foam?: string; ice?: boolean; lime?: boolean }) {
  return (
    <>
      <circle cx="60" cy="63" r="42" fill="#000" opacity=".07" />
      <circle cx="60" cy="60" r="42" fill="#f3f6f8" stroke="#dfe5ea" strokeWidth="2" />
      <circle cx="60" cy="60" r="36" fill={liquid} />
      {foam && <circle cx="60" cy="60" r="30" fill={foam} />}
      {foam && <circle cx="60" cy="60" r="22" fill="none" stroke={liquid} strokeOpacity=".35" strokeWidth="2" />}
      {ice && (
        <g fill="#fff" fillOpacity=".55" stroke="#fff" strokeOpacity=".8" strokeWidth="1">
          <rect x="40" y="40" width="15" height="15" rx="3.5" transform="rotate(14 47 47)" />
          <rect x="62" y="48" width="14" height="14" rx="3.5" transform="rotate(-18 69 55)" />
          <rect x="46" y="64" width="13" height="13" rx="3.5" transform="rotate(30 52 70)" />
        </g>
      )}
      {lime && (
        <g transform="translate(76 74)">
          <circle r="10" fill="#7fb43a" />
          <circle r="8.3" fill="#e2f2b0" />
          <path d="M0 -8v16M-7 -4l14 8M-7 4l14 -8" stroke="#bddb7d" strokeWidth="1.1" />
        </g>
      )}
      <circle cx="74" cy="44" r="4.5" fill="#fff" stroke="#d9473c" strokeWidth="2.4" />
    </>
  );
}

export function Cup({ liquid, crema }: { liquid: string; crema?: string }) {
  return (
    <>
      <circle cx="60" cy="62.5" r="52" fill="#000" opacity=".07" />
      <circle cx="60" cy="60" r="52" fill="#fff" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#eceef1" strokeWidth="1.5" />
      <rect x="86" y="54" width="18" height="12" rx="6" fill="#f2f3f5" stroke="#dde1e5" strokeWidth="1.5" />
      <circle cx="56" cy="60" r="32" fill="#f7f8fa" stroke="#dde1e5" strokeWidth="1.5" />
      <circle cx="56" cy="60" r="26" fill={liquid} />
      {crema && <path d="M38 56c6-8 18-10 28-4 6 4 4 12-4 13-8 1-12-4-18-3-5 0-8-2-6-6z" fill={crema} opacity=".8" />}
      <path d="M22 86l14 -12" stroke="#c9ced4" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="40" cy="70" rx="5" ry="3" transform="rotate(-40 40 70)" fill="#c9ced4" />
    </>
  );
}

interface RicePlateProps {
  rice: string;
  grain?: string;
  sides: string[];
  egg?: 'half' | 'fried';
  cucumber?: boolean;
  leaf?: boolean;
  wrap?: boolean;
}

export function RicePlate({ rice, grain = '#ffffff', sides, egg, cucumber = true, leaf = false, wrap = false }: RicePlateProps) {
  const sideSpots: [number, number, number][] = [
    [78, 50, 14],
    [76, 78, 13],
    [46, 86, 11],
  ];
  return (
    <>
      <Plate />
      {leaf && <path d="M60 18c14 6 30 9 38 22 7 12 4 30-6 42-9 11-25 17-38 16-13-1-26-9-33-21-8-13-6-30 3-42 9-12 22-12 36-17z" fill="#2f8a45" />}
      {wrap ? (
        <g>
          <path d="M24 60c0-16 14-28 34-28s34 12 34 28-14 27-34 27-34-11-34-27z" fill="#f3c74f" />
          <path d="M34 52c8 6 40 6 48 0M32 66c10 6 42 6 52 0" stroke="#e2a82c" strokeWidth="1.6" fill="none" />
          <path d="M40 44l6 6M76 44l-6 6" stroke="#d9472c" strokeWidth="2" strokeLinecap="round" />
        </g>
      ) : (
        <>
          <path d="M24 58c-1-14 10-25 24-25 13 0 23 10 22 23-1 13-11 21-23 21-12 0-22-6-23-19z" fill={rice} />
          <Dots fill={grain} r={1.1} points={[[36, 44], [44, 41], [52, 47], [40, 53], [48, 58], [34, 58], [58, 54]]} />
          {sides.slice(0, 3).map((color, i) => {
            const [x, y, r] = sideSpots[i];
            return (
              <g key={i}>
                <path
                  d={`M${x - r} ${y}c0-${r * 0.7} ${r * 0.5}-${r} ${r}-${r}s${r} ${r * 0.4} ${r} ${r}-${r * 0.5} ${r * 0.9}-${r} ${r * 0.9}-${r}-${r * 0.3}-${r}-${r * 0.9}z`}
                  fill={color}
                />
                <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.22} fill="#fff" opacity=".18" />
              </g>
            );
          })}
        </>
      )}
      {egg === 'half' && <HalfEgg x={40} y={84} rotate={-20} scale={0.9} />}
      {egg === 'fried' && <FriedEgg x={44} y={84} scale={0.8} />}
      {cucumber && !wrap && <Cucumber x={30} y={32} r={6.5} />}
    </>
  );
}

const NOODLE_PATHS = [
  'M36 50c6-5 11 3 17-1s11 3 17-1 9 2 14 0',
  'M32 60c6-5 11 3 17-1s11 3 17-1 11 3 18-1',
  'M34 70c6-5 11 3 17-1s11 3 17-1 9 2 14 0',
  'M40 80c6-4 10 3 16-1s10 3 15 0',
  'M42 40c5-4 9 3 14-1s9 3 14 0',
];

export function NoodleBowl({ broth, noodle, toppings = [], prawn = false, egg = false }: { broth: string; noodle: string; toppings?: string[]; prawn?: boolean; egg?: boolean }) {
  return (
    <>
      <Bowl fill={broth} />
      <Noodles width={2.8} color={noodle} paths={NOODLE_PATHS} />
      {toppings.map((color, i) => {
        const spots = [
          [36, 42],
          [82, 46],
          [80, 76],
          [40, 80],
          [62, 34],
        ];
        const [x, y] = spots[i % spots.length];
        return <circle key={i} cx={x} cy={y} r="6" fill={color} />;
      })}
      {egg && <HalfEgg x={70} y={62} rotate={15} scale={0.8} />}
      {prawn && <Prawn x={50} y={58} rotate={-20} scale={0.85} />}
      <g fill="#4f9a39">
        <path d="M58 80c2-4 7-5 9-2-2 4-6 5-9 2z" />
        <path d="M84 60c2-4 7-5 9-2-2 4-6 5-9 2z" />
      </g>
    </>
  );
}

export function NoodlePlate({ noodle, sauce, accents = [], egg = false, thin = false }: { noodle: string; sauce: string; accents?: string[]; egg?: boolean; thin?: boolean }) {
  return (
    <>
      <Plate />
      <path d="M22 62c0-20 17-38 38-38 22 0 37 17 37 36s-16 36-37 36-38-15-38-34z" fill={sauce} />
      <Noodles width={thin ? 2 : 3.4} color={noodle} paths={[...NOODLE_PATHS, 'M30 66c6-5 11 3 17-1s11 3 17-1 11 3 18-1', 'M38 88c6-3 11 2 16 0s9 2 14 0']} />
      {accents.map((color, i) => {
        const spots = [
          [44, 52],
          [70, 70],
          [64, 44],
          [40, 74],
        ];
        const [x, y] = spots[i % spots.length];
        return <path key={i} d={`M${x} ${y}c3-4 9-4 11 0-3 4-8 4-11 0z`} fill={color} />;
      })}
      <g fill="#4f9a39">
        <path d="M30 56c3-6 9-7 12-4-2 5-7 6-12 4z" />
        <path d="M76 84c3-6 9-7 12-4-2 5-7 6-12 4z" />
      </g>
      {egg && <FriedEgg x={64} y={58} scale={0.85} />}
    </>
  );
}

type BreadVariant = 'round' | 'cone' | 'squares' | 'toast' | 'net' | 'discs';

export function Bread({ variant, color = '#e6b465', filling }: { variant: BreadVariant; color?: string; filling?: string }) {
  return (
    <>
      <Plate />
      {variant === 'round' && (
        <>
          <path d="M22 62c-1-18 14-32 34-33 20-1 36 12 37 30 1 19-15 32-35 33-20 1-35-11-36-30z" fill={color} />
          {filling && (
            <g fill={filling}>
              <path d="M36 52c5-6 14-6 18 0-4 6-13 6-18 0z" />
              <path d="M58 70c5-6 14-6 18 0-4 6-13 6-18 0z" />
              <path d="M66 46c4-4 10-4 12 0-3 4-9 4-12 0z" />
            </g>
          )}
          <g fill="#00000022">
            <ellipse cx="40" cy="74" rx="5" ry="2.4" />
            <ellipse cx="72" cy="56" rx="4" ry="2" />
            <ellipse cx="52" cy="40" rx="4" ry="1.8" />
          </g>
          <path d="M30 60c4-12 18-20 32-18" stroke="#ffffff55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )}
      {variant === 'cone' && (
        <>
          <path d="M60 18L94 86c-18 10-50 10-68 0z" fill={color} />
          <path d="M60 18L48 90M60 18L72 90M60 18l-24 66M60 18l24 66" stroke="#c78a3a" strokeWidth="1.2" opacity=".6" />
          <path d="M28 84c18 8 46 8 64 0" stroke="#fff" strokeOpacity=".7" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {variant === 'squares' && (
        <g>
          {[
            [26, 34],
            [60, 34],
            [26, 62],
            [60, 62],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <rect x={x} y={y} width="32" height="26" rx="4" fill={color} />
              <rect x={x + 3} y={y + 3} width="26" height="20" rx="3" fill="none" stroke="#c88a3c" strokeWidth="1.2" />
              <Dots fill="#7a4a22" r={1.1} points={[[x + 10, y + 10], [x + 20, y + 15], [x + 14, y + 19]]} />
            </g>
          ))}
          <SauceDish x={90} y={92} fill="#c7782f" r={8} />
        </g>
      )}
      {variant === 'toast' && (
        <g>
          {[
            [24, 30, -8],
            [52, 52, 8],
          ].map(([x, y, r]) => (
            <g key={`${x}`} transform={`rotate(${r} ${x + 22} ${y + 20})`}>
              <rect x={x} y={y} width="44" height="40" rx="10" fill="#c98a43" />
              <rect x={x + 4} y={y + 4} width="36" height="32" rx="7" fill="#efcf8f" />
              <rect x={x + 8} y={y + 12} width="28" height="14" rx="4" fill={filling ?? '#7b9a3c'} />
              <rect x={x + 10} y={y + 15} width="10" height="7" rx="2" fill="#fff4cc" />
            </g>
          ))}
        </g>
      )}
      {variant === 'net' && (
        <g>
          <path d="M24 60c0-18 16-32 36-32s36 14 36 32-16 32-36 32-36-14-36-32z" fill={color} opacity=".35" />
          <g fill="none" stroke={color} strokeWidth="2.6">
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={36 + i * 12} cy={50} r="7" />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={42 + i * 12} cy={62} r="7" />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={36 + i * 12} cy={74} r="7" />
            ))}
          </g>
        </g>
      )}
      {variant === 'discs' && (
        <g>
          {[
            [44, 44],
            [72, 52],
            [48, 74],
          ].map(([x, y]) => (
            <g key={`${x}`}>
              <ellipse cx={x} cy={y + 2} rx="15" ry="13" fill="#e6e1d3" />
              <ellipse cx={x} cy={y} rx="15" ry="13" fill="#fbf9f2" />
              <Dots fill="#ebe5d4" r={0.9} points={[[x - 5, y - 3], [x + 4, y + 2], [x - 1, y + 5]]} />
            </g>
          ))}
          <SauceDish x={84} y={84} fill="#c7782f" r={9} />
        </g>
      )}
    </>
  );
}

export function CurryBowl({ gravy, chunk, potato = false, clear = false }: { gravy: string; chunk: string; potato?: boolean; clear?: boolean }) {
  return (
    <>
      <Bowl fill={gravy} />
      {!clear && <Dots fill="#ffffff" r={2} points={[[36, 46], [84, 70], [52, 86], [76, 34]]} />}
      {[
        [48, 50, 13, 10, 20],
        [72, 54, 12, 9, -15],
        [56, 72, 13, 10, 5],
      ].map(([x, y, rx, ry, r]) => (
        <g key={`${x}`} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse rx={rx} ry={ry} fill={chunk} />
          <ellipse rx={rx * 0.6} ry={ry * 0.45} cx={-2} cy={-2.5} fill="#ffffff" opacity=".22" />
        </g>
      ))}
      {potato && (
        <g fill="#f1cf7e">
          <rect x="30" y="62" width="11" height="10" rx="3" transform="rotate(15 35 67)" />
          <rect x="76" y="70" width="10" height="9" rx="3" transform="rotate(-20 81 74)" />
        </g>
      )}
      {clear && (
        <g fill="#f08a3c">
          <circle cx="36" cy="48" r="3.4" />
          <circle cx="82" cy="72" r="3" />
        </g>
      )}
      <g fill="#4f9a39">
        <path d="M80 40c2-4 7-5 9-2-2 4-6 5-9 2z" />
        <path d="M34 78c2-4 7-5 9-2-2 4-6 5-9 2z" />
      </g>
    </>
  );
}

type MainVariant = 'chicken' | 'fish' | 'omelette' | 'tofu' | 'veg';

export function Main({ variant }: { variant: MainVariant }) {
  return (
    <>
      <Plate />
      {variant === 'chicken' && (
        <g>
          <path d="M34 72c-8-10-4-26 10-32 15-6 30 2 32 16 2 12-8 22-20 24l-10 10c-3 3-8 1-8-3 0-4 1-8-4-15z" fill="#b8642a" />
          <path d="M42 50c6-6 16-6 22 0" stroke="#d98c4a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Dots fill="#7d3e16" r={1.5} points={[[48, 60], [58, 56], [52, 68], [62, 66], [44, 62]]} />
          <path d="M36 86l-6 6" stroke="#f3e3c5" strokeWidth="5" strokeLinecap="round" />
          <Cucumber x={82} y={78} r={7} />
          <path d="M78 34c4-3 10-2 12 2-4 4-9 3-12-2z" fill="#4f9a39" />
        </g>
      )}
      {variant === 'fish' && (
        <g>
          <path d="M18 60c10-14 34-22 58-10 8-6 16-8 24-6-4 6-4 14 0 20-8 2-16 0-24-6-24 12-48 4-58-10z" fill="#2f8a45" opacity=".9" />
          <path d="M24 60c10-12 30-18 50-8 6-4 12-6 18-5-3 5-3 10 0 15-6 1-12-1-18-5-20 10-40 3-50-9z" fill="#b5602d" />
          <path d="M40 52l6 16M52 50l6 18M64 52l5 14" stroke="#7d3a14" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="58" r="2" fill="#fff" />
          <path d="M44 80c4-5 12-5 15 0-4 5-11 5-15 0z" fill="#c62f1c" />
        </g>
      )}
      {variant === 'omelette' && (
        <g>
          <path d="M24 64c0-18 16-30 36-30s36 12 36 30c-14 10-58 10-72 0z" fill="#f2c94c" />
          <path d="M24 64c14 10 58 10 72 0-2 14-18 24-36 24s-34-10-36-24z" fill="#e8b53a" />
          <Dots fill="#d9472c" r={1.4} points={[[44, 50], [66, 46], [56, 58], [78, 56]]} />
          <Dots fill="#4f9a39" r={1.4} points={[[50, 44], [72, 54], [40, 58]]} />
        </g>
      )}
      {variant === 'tofu' && (
        <g>
          <path d="M28 82L60 26l32 56z" fill="#d79a46" />
          <path d="M36 78L60 36l24 42z" fill="#ecc074" />
          <Sprouts color="#f6f0d4" points={[[52, 56, -60], [60, 50, -80], [66, 60, -100]]} />
          <g fill="#7fb43a">
            <rect x="54" y="62" width="6" height="10" rx="2" />
            <rect x="62" y="64" width="6" height="9" rx="2" />
          </g>
          <SauceDish x={88} y={36} fill="#b9692b" r={9} />
        </g>
      )}
      {variant === 'veg' && (
        <g>
          {[
            [44, 46, 20],
            [68, 44, -30],
            [56, 64, 60],
            [40, 72, -10],
            [74, 70, 40],
          ].map(([x, y, r]) => (
            <path key={`${x}`} d="M-14 0c4-9 22-9 28 0-6 9-24 9-28 0z" transform={`translate(${x} ${y}) rotate(${r})`} fill="#3f9142" />
          ))}
          <g fill="#f08a3c">
            <circle cx="52" cy="52" r="4" />
            <circle cx="66" cy="76" r="3.6" />
          </g>
          <g fill="#f6f2dc">
            <rect x="60" y="54" width="7" height="7" rx="1.5" />
            <rect x="36" y="58" width="6" height="6" rx="1.5" />
          </g>
          <Prawn x={78} y={52} rotate={30} scale={0.8} />
        </g>
      )}
    </>
  );
}

type KuihVariant = 'layer' | 'balls' | 'puff' | 'fritter' | 'sticks' | 'pancake' | 'roll' | 'bun' | 'twoLayer';

export function Kuih({ variant, colors }: { variant: KuihVariant; colors: string[] }) {
  const [a, b = '#fff', c = a] = colors;
  return (
    <>
      <Plate />
      {variant === 'layer' &&
        [
          [30, 36, -10],
          [62, 56, 12],
        ].map(([x, y, r]) => (
          <g key={`${x}`} transform={`rotate(${r} ${x + 14} ${y + 14})`}>
            <rect x={x} y={y + 2} width="28" height="30" rx="4" fill="#00000012" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={x} y={y + i * 5} width="28" height="5.4" fill={colors[i % colors.length]} rx={i === 0 || i === 5 ? 3 : 0} />
            ))}
          </g>
        ))}
      {variant === 'twoLayer' &&
        [
          [30, 40],
          [60, 60],
        ].map(([x, y]) => (
          <g key={`${x}`}>
            <rect x={x} y={y} width="30" height="24" rx="3" fill={b} />
            <rect x={x} y={y} width="30" height="11" rx="3" fill={a} />
            <Dots fill="#d9d2be" r={0.9} points={[[x + 8, y + 17], [x + 18, y + 19], [x + 24, y + 15]]} />
          </g>
        ))}
      {variant === 'balls' &&
        [
          [46, 48],
          [70, 52],
          [56, 72],
        ].map(([x, y]) => (
          <g key={`${x}`}>
            <circle cx={x} cy={y + 2} r="12" fill="#00000012" />
            <circle cx={x} cy={y} r="12" fill={a} />
            <Dots fill="#fff" r={1.2} points={[[x - 5, y - 4], [x + 3, y - 6], [x + 6, y + 1], [x - 2, y + 4], [x - 7, y + 2], [x + 2, y + 7]]} />
          </g>
        ))}
      {variant === 'puff' &&
        [
          [44, 56, -20],
          [70, 66, 25],
        ].map(([x, y, r]) => (
          <g key={`${x}`} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path d="M-18 4c0-12 8-20 18-20s18 8 18 20z" fill={a} />
            <path d="M-18 4h36" stroke={c} strokeWidth="4" strokeLinecap="round" strokeDasharray="3 3" />
            <path d="M-8 -6c4-3 10-3 14 0" stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        ))}
      {variant === 'fritter' &&
        [
          [40, 50, -25],
          [66, 64, 20],
        ].map(([x, y, r]) => (
          <g key={`${x}`} transform={`translate(${x} ${y}) rotate(${r})`}>
            <ellipse rx="22" ry="10" fill={a} />
            <ellipse rx="16" ry="5" cy="-2" fill={b} opacity=".55" />
            <Dots fill={c} r={1.3} points={[[-10, 3], [4, 5], [12, -3], [-4, -5]]} />
          </g>
        ))}
      {variant === 'sticks' && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={30 + i * 9} y={34 + (i % 2) * 6} width="8" height="40" rx="4" fill={a} transform={`rotate(${-14 + i * 6} ${34 + i * 9} 54)`} />
          ))}
          <SauceDish x={80} y={82} fill="#d23b22" r={10} />
        </g>
      )}
      {variant === 'pancake' && (
        <g>
          <path d="M22 70c0-22 17-38 38-38s38 16 38 38z" fill={a} />
          <path d="M28 70c0-18 14-32 32-32s32 14 32 32z" fill={b} />
          <Dots fill={c} r={1.6} points={[[42, 62], [52, 54], [62, 60], [72, 52], [80, 64], [48, 66], [66, 66]]} />
          <path d="M22 70h76" stroke="#b9772f" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {variant === 'roll' &&
        [
          [38, 44],
          [62, 52],
          [46, 72],
        ].map(([x, y]) => (
          <g key={`${x}`}>
            <circle cx={x} cy={y} r="11" fill="#f6efe0" stroke="#e6dac2" strokeWidth="1.4" />
            <circle cx={x} cy={y} r="7" fill={a} />
            <Dots fill={b} r={1.2} points={[[x - 2, y - 2], [x + 3, y + 1], [x - 1, y + 3]]} />
          </g>
        ))}
      {variant === 'bun' &&
        [
          [46, 50],
          [72, 68],
        ].map(([x, y]) => (
          <g key={`${x}`}>
            <circle cx={x} cy={y + 2} r="17" fill="#00000010" />
            <circle cx={x} cy={y} r="17" fill="#fbf8f1" />
            <path d={`M${x} ${y - 8}l-6 -4M${x} ${y - 8}l6 -4M${x} ${y - 8}l0 -6`} stroke="#e7dfcc" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx={x} cy={y - 8} r="2.4" fill={a} />
          </g>
        ))}
    </>
  );
}

type DessertVariant = 'cendol' | 'abc' | 'chacha';

export function Dessert({ variant }: { variant: DessertVariant }) {
  return (
    <>
      <Bowl fill={variant === 'chacha' ? '#f6efe0' : '#f3f6f8'} />
      {variant === 'cendol' && (
        <g>
          <path d="M28 64c0-16 14-30 32-30s32 14 32 30z" fill="#f7f3ea" />
          <Noodles width={3} color="#5aa83c" paths={['M34 58c4-3 8 2 12-1', 'M48 52c4-3 8 2 12-1', 'M62 56c4-3 8 2 12-1', 'M40 66c4-3 8 2 12-1', 'M56 64c4-3 8 2 12-1', 'M70 66c4-3 8 2 12-1']} />
          <path d="M30 70c10 10 50 10 60 0 0 10-14 20-30 20s-30-10-30-20z" fill="#8a4b1f" />
          <Dots fill="#7b2f1f" r={2.4} points={[[46, 76], [58, 80], [70, 76]]} />
        </g>
      )}
      {variant === 'abc' && (
        <g>
          <path d="M26 64c0-20 15-36 34-36s34 16 34 36c-10 10-58 10-68 0z" fill="#fbfbfc" />
          <path d="M34 50c8-10 24-14 34-6" stroke="#e2405a" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M40 62c10-6 24-6 32 2" stroke="#42a85f" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M60 42c6 2 12 8 14 14" stroke="#f2b632" strokeWidth="5" strokeLinecap="round" fill="none" />
          <Dots fill="#7a2c26" r={2.2} points={[[40, 78], [52, 82], [64, 80], [76, 76]]} />
          <Dots fill="#f5cf45" r={2} points={[[46, 72], [70, 72], [58, 74]]} />
        </g>
      )}
      {variant === 'chacha' && (
        <g>
          {[
            [44, 46, '#8c5bb5'],
            [70, 48, '#f08a3c'],
            [56, 66, '#f2c94c'],
            [40, 70, '#8c5bb5'],
            [76, 70, '#f08a3c'],
          ].map(([x, y, color]) => (
            <rect key={`${x}-${y}`} x={(x as number) - 6} y={(y as number) - 6} width="12" height="12" rx="3" fill={color as string} />
          ))}
          <Dots fill="#e64c79" r={1.8} points={[[56, 44], [64, 58], [48, 58], [62, 80]]} />
        </g>
      )}
    </>
  );
}

type FruitVariant = 'banana' | 'wedge' | 'durian' | 'cubes' | 'round' | 'rambutan';

export function Fruit({ variant, flesh = '#f08a3c', rind = '#3d8b3a', seeds }: { variant: FruitVariant; flesh?: string; rind?: string; seeds?: string }) {
  return (
    <>
      <Plate />
      {variant === 'banana' && (
        <g>
          <path d="M26 46c6 30 40 46 66 34 4-2 2-8-2-7-24 6-48-6-56-30-2-5-9-3-8 3z" fill="#f4cd3d" />
          <path d="M30 50c8 22 30 34 54 30" stroke="#e0ad1e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M24 44l-2 -6" stroke="#6d5320" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {variant === 'wedge' &&
        [
          [36, 0],
          [62, 22],
        ].map(([x, r]) => (
          <g key={x} transform={`translate(${x} 58) rotate(${r})`}>
            <path d="M-16 -18L18 -18L1 22z" fill={flesh} />
            <path d="M-18 -21h38" stroke={rind} strokeWidth="5" strokeLinecap="round" />
            {seeds && <Dots fill={seeds} r={1.6} points={[[-4, -8], [5, -9], [0, 0], [-8, -14], [9, -14]]} />}
          </g>
        ))}
      {variant === 'durian' && (
        <g>
          <path d="M22 60c0-20 17-36 38-36s38 16 38 36-17 36-38 36-38-16-38-36z" fill="#8a9a3a" />
          <g fill="#6e7d2a">
            {Array.from({ length: 14 }, (_, i) => {
              const angle = (i / 14) * Math.PI * 2;
              const x = 60 + Math.cos(angle) * 34;
              const y = 60 + Math.sin(angle) * 32;
              return <path key={i} d={`M${x} ${y}l3 -6 3 6z`} transform={`rotate(${(angle * 180) / Math.PI + 90} ${x + 3} ${y - 3})`} />;
            })}
          </g>
          <path d="M30 60c0-14 13-26 30-26s30 12 30 26-13 26-30 26-30-12-30-26z" fill="#f4f0e2" />
          {[
            [48, 52],
            [70, 52],
            [58, 70],
          ].map(([x, y]) => (
            <ellipse key={`${x}`} cx={x} cy={y} rx="11" ry="9" fill="#f6d35c" />
          ))}
        </g>
      )}
      {variant === 'cubes' && (
        <g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={34 + (i % 3) * 18} y={40 + Math.floor(i / 3) * 20} width="15" height="15" rx="3" fill={flesh} stroke="#00000010" />
          ))}
          <path d="M30 34c20-8 44-8 60 0" stroke={rind} strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      )}
      {variant === 'round' &&
        [
          [48, 54, 0],
          [72, 66, 1],
        ].map(([x, y, cut]) => (
          <g key={`${x}`}>
            <circle cx={x} cy={y} r="16" fill={rind} />
            {cut ? (
              <>
                <circle cx={x} cy={y} r="13" fill={flesh} />
                {seeds && <Dots fill={seeds} r={1.4} points={[[x - 4, y - 3], [x + 3, y - 4], [x + 4, y + 3], [x - 3, y + 4], [x, y]]} />}
              </>
            ) : (
              <circle cx={x - 5} cy={y - 5} r="4" fill="#fff" opacity=".25" />
            )}
          </g>
        ))}
      {variant === 'rambutan' &&
        [
          [44, 50],
          [70, 52],
          [56, 74],
        ].map(([x, y], i) => (
          <g key={`${x}`}>
            <circle cx={x} cy={y} r="12" fill={i === 2 ? '#f4f1e6' : '#d23b2a'} />
            {i < 2 ? (
              <g stroke="#7fae35" strokeWidth="1.6" strokeLinecap="round">
                {Array.from({ length: 10 }, (_, k) => {
                  const angle = (k / 10) * Math.PI * 2;
                  return (
                    <path
                      key={k}
                      d={`M${x + Math.cos(angle) * 11} ${y + Math.sin(angle) * 11}l${Math.cos(angle) * 4} ${Math.sin(angle) * 4}`}
                    />
                  );
                })}
              </g>
            ) : (
              <circle cx={x - 3} cy={y - 3} r="3" fill="#fff" opacity=".7" />
            )}
          </g>
        ))}
    </>
  );
}

