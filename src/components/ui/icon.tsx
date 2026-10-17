import type { SVGProps } from "react";

// 24px сүлжээн дээр 1.6 зузаантай, нэгэн хэв маягийн дүрс тэмдгүүд
const PATHS = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h3",
  table: "M3 9h18M5 9v10M19 9v10M8 9V5h8v4M8 15h8",
  book: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h10M9 8h5",
  calendar: "M4 6h16v14H4V6Zm0 4h16M8 3v5M16 3v5M8 14h3",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5c1.8.9 3 2.9 3 5.5",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-2.1.1-.9-.1-.9 2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.6-.9L15 3h-4l-.4 2.6c-.6.2-1.1.5-1.6.9l-2.4-1-2 3.4 2 1.6-.1.9.1.9-2 1.6 2 3.4 2.4-1c.5.4 1 .7 1.6.9L11 21h4l.4-2.6c.6-.2 1.1-.5 1.6-.9l2.4 1 2-3.4-2-1.6Z",
  qr: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z",
  flame: "M12 21c3.9 0 7-2.9 7-6.8 0-4.4-4-6.2-4.5-10.2C12 5.5 10.5 8 10.6 10.4 9.3 9.8 8.6 8.6 8.4 7.4 6.3 9 5 11.3 5 14.2 5 18.1 8.1 21 12 21Z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 3-4-4",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  x: "M6 6l12 12M18 6 6 18",
  check: "m5 12.5 4.5 4.5L19 7.5",
  chevronDown: "m6 9 6 6 6-6",
  chevronRight: "m9 6 6 6-6 6",
  chevronLeft: "m15 6-6 6 6 6",
  chevronUp: "m6 15 6-6 6 6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4.5l3 2",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  pin: "M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  bag: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  image: "M4 5h16v14H4V5Zm0 11 4.5-4.5 3.5 3.5 2.5-2.5L20 18M15.5 9.5h.01",
  upload: "M12 16V4m0 0L7 9m5-5 5 5M4 16v4h16v-4",
  download: "M12 4v12m0 0-5-5m5 5 5-5M4 20h16",
  printer: "M7 9V3h10v6M7 17H4v-8h16v8h-3M7 14h10v7H7v-7Z",
  arrowRight: "M5 12h14m-5-5 5 5-5 5",
  arrowLeft: "M19 12H5m5-5-5 5 5 5",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  star: "m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9h.01",
  alert: "M12 4 2.5 20h19L12 4Zm0 6v4m0 3h.01",
  menu: "M4 7h16M4 12h16M4 17h16",
  copy: "M8 8h12v12H8V8Zm-4 8V4h12",
  refresh: "M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4",
  store: "M4 9.5 5.5 4h13L20 9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5 11v9h14v-9M10 20v-5h4v5",
  truck: "M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  walk: "M13 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-3 17 2-7 3 3v4m-5-9 1-4 3 1 2 3h3M9 12l-2 1-1 3",
  seat: "M7 4v9h10M7 13l-1 7m11-7 1 7M10 13v-3h7",
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4",
  lock: "M6 11h12v10H6V11Zm3 0V7a3 3 0 0 1 6 0v4",
  mail: "M4 6h16v12H4V6Zm0 1 8 6 8-6",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  wallet: "M4 6h14v3h2v10H4V6Zm0 3h16M15 14h2",
  play: "M8 5v14l11-7L8 5Z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
