import type { SVGProps } from 'react';

const PATHS = {
  diary: (
    <>
      <path d="M6.5 3.5H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5z" />
      <path d="M8.5 3.5v17M11.5 8h4.5M11.5 11.5h4.5" />
    </>
  ),
  progress: <path d="M4 20h16M7 16v-4M12 16V7M17 16v-6.5" />,
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  dishes: (
    <>
      <path d="M3.5 11.5h17a8.5 7.5 0 0 1-17 0z" />
      <path d="M8.5 20h7M9.5 4.5c-.8.9.8 2.1 0 3M14.5 4.5c-.8.9.8 2.1 0 3" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.75 20c.9-3.7 3.7-5.6 7.25-5.6s6.35 1.9 7.25 5.6" />
    </>
  ),
  chevronLeft: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  chevronRight: <path d="M9.5 5.5L16 12l-6.5 6.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="M20.5 15.5l-4.8-4.8L6.5 19.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.9v.1" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.9L3 17.4a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4.25M12 16.9v.1" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M10 3.75h4M6.5 7l.85 11.6a1.5 1.5 0 0 0 1.5 1.4h6.3a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.25" />
      <path d="M15.75 15.75L20 20" />
    </>
  ),
  edit: <path d="M14.5 6.5l3 3M4.5 19.5l.9-3.9L15.8 5.2a2.1 2.1 0 0 1 3 3L8.4 18.6z" />,
  shield: <path d="M12 3.5l7 2.6v5.4c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6.1z" />,
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </>
  ),
  frame: (
    <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5" />
  ),
  single: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5c-1.8-1.3-4.3-2-7.5-2v13c3.2 0 5.7.7 7.5 2 1.8-1.3 4.3-2 7.5-2v-13c-3.2 0-5.7.7-7.5 2z" />
      <path d="M12 6.5v13" />
    </>
  ),
  retake: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.9-5.2L19.5 9" />
      <path d="M19.5 4.5V9H15M19.5 12a7.5 7.5 0 0 1-12.9 5.2L4.5 15" />
      <path d="M4.5 19.5V15H9" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, strokeWidth = 1.75, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
