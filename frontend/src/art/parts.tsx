/** Shared pieces for the food illustrations. All art is drawn top-down on a 120 × 120 canvas. */

export function Plate() {
  return (
    <>
      <circle cx="60" cy="62.5" r="55" fill="#000" opacity=".07" />
      <circle cx="60" cy="60" r="55" fill="#fff" />
      <circle cx="60" cy="60" r="46.5" fill="none" stroke="#eceef1" strokeWidth="1.5" />
    </>
  );
}

export function Bowl({ fill }: { fill: string }) {
  return (
    <>
      <circle cx="60" cy="62.5" r="55" fill="#000" opacity=".07" />
      <circle cx="60" cy="60" r="55" fill="#fff" />
      <circle cx="60" cy="60" r="47" fill="#e9ebee" />
      <circle cx="60" cy="60" r="45" fill={fill} />
    </>
  );
}

export function Cucumber({ x, y, r = 7.5 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#3d8b3a" />
      <circle r={r * 0.8} fill="#d3ebbb" />
      <g fill="#a9cf88">
        <ellipse cx="0" cy={-r * 0.32} rx={r * 0.11} ry={r * 0.2} />
        <ellipse cx={r * 0.3} cy={r * 0.17} rx={r * 0.11} ry={r * 0.2} transform={`rotate(120 ${r * 0.3} ${r * 0.17})`} />
        <ellipse cx={-r * 0.3} cy={r * 0.17} rx={r * 0.11} ry={r * 0.2} transform={`rotate(240 ${-r * 0.3} ${r * 0.17})`} />
      </g>
    </g>
  );
}

export function HalfEgg({ x, y, rotate = 0, scale = 1 }: { x: number; y: number; rotate?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <ellipse rx="12" ry="9.5" fill="#fff" stroke="#ebe3d1" strokeWidth="1.2" />
      <circle r="5.4" fill="#f2a516" />
      <circle cx="-1.4" cy="-1.4" r="1.9" fill="#f8c650" />
    </g>
  );
}

export function FriedEgg({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-15 -2c-1-8 7-13 14-12 6-4 15 0 15 7 5 5 2 13-5 14-4 5-13 5-17 0-6 0-9-4-7-9z"
        fill="#fff"
        stroke="#e7d2ac"
        strokeWidth="1.4"
      />
      <circle cx="1" cy="0" r="6.2" fill="#f39c12" />
      <circle cx="-0.8" cy="-1.8" r="2.1" fill="#f8c35a" />
    </g>
  );
}

export function Prawn({ x, y, rotate = 0, scale = 1 }: { x: number; y: number; rotate?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M-7 4a8 8 0 1 1 12 -7" fill="none" stroke="#ef7d43" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M-5 0.5a5 5 0 0 1 4-5M0 -5.5a5 5 0 0 1 4.5 1.8" fill="none" stroke="#f7b089" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M-8 5l-3 3M-7 6l-1 4" stroke="#e5642a" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

export function Sprouts({ points, color = '#f5efd3' }: { points: [number, number, number][]; color?: string }) {
  return (
    <g stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none">
      {points.map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y}q4 -2 8 0`} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  );
}

export function Dots({ points, fill, r = 1.2 }: { points: [number, number][]; fill: string; r?: number }) {
  return (
    <g fill={fill}>
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r} />
      ))}
    </g>
  );
}

/** Small sauce dish placed on the rim of a plate. */
export function SauceDish({ x, y, fill, r = 11 }: { x: number; y: number; fill: string; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r + 3} fill="#f5f6f8" stroke="#e1e4e8" strokeWidth="1.1" />
      <circle r={r} fill={fill} />
      <path d={`M${-r * 0.6} ${-r * 0.2}c${r * 0.3} ${-r * 0.4} ${r * 0.8} ${-r * 0.5} ${r * 1.1} ${-r * 0.2}`} stroke="#fff" strokeOpacity=".35" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function Noodles({ paths, color, width = 3 }: { paths: string[]; color: string; width?: number }) {
  return (
    <g stroke={color} strokeWidth={width} strokeLinecap="round" fill="none">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}
