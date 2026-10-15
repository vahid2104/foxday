import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

/** Figma-dakı "icon/*" komponentləri ilə eyni ikonlar (24×24, xətt qalınlığı 2). */
type Shape =
  | { t: 'path'; d: string }
  | { t: 'circle'; cx: number; cy: number; r: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx: number }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number };

const P = (d: string): Shape => ({ t: 'path', d });
const C = (cx: number, cy: number, r: number): Shape => ({ t: 'circle', cx, cy, r });

const ICONS = {
  home: [P('M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z')],
  wallet: [{ t: 'rect', x: 3, y: 6, w: 18, h: 14, rx: 3 }, P('M16 13h2'), P('M6 6l9-3v3')],
  target: [C(12, 12, 9), C(12, 12, 5), C(12, 12, 1)],
  heart: [P('M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z')],
  plus: [P('M12 5v14M5 12h14')],
  check: [P('M5 12.5l4.5 4.5L19 7')],
  x: [P('M6 6l12 12M18 6 6 18')],
  droplet: [P('M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z')],
  moon: [P('M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z')],
  flame: [P('M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-3 5-3 8a6 6 0 0 0 6 6z')],
  bike: [C(6, 17, 3.5), C(18, 17, 3.5), P('M6 17l4-8h5l3 8M10 9 8.5 6H6M15 9l-1-3h2')],
  'chevron-right': [P('m9 6 6 6-6 6')],
  'chevron-left': [P('m15 6-6 6 6 6')],
  bell: [P('M6 9a6 6 0 0 1 12 0c0 6 2 8 2 8H4s2-2 2-8M10 21h4')],
  'arrow-up-right': [P('M7 17 17 7M8 7h9v9')],
  'arrow-down-left': [P('M17 7 7 17M16 17H7V8')],
  clock: [C(12, 12, 9), P('M12 7v5l3 2')],
  book: [P('M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z')],
  dumbbell: [P('M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12')],
  sparkle: [P('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z')],
  calendar: [{ t: 'rect', x: 3, y: 5, w: 18, h: 16, rx: 3 }, P('M8 3v4M16 3v4M3 10h18')],
  globe: [C(12, 12, 9), P('M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18')],
  sun: [C(12, 12, 4), P('M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4')],
  chart: [P('M4 20V10M10 20V4M16 20v-7M22 20H2')],
  pencil: [P('M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4')],
  shield: [P('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'), P('m9 12 2 2 4-4')],
  phone: [{ t: 'rect', x: 6, y: 2, w: 12, h: 20, rx: 3 }, P('M11 18h2')],
  coins: [
    { t: 'ellipse', cx: 9, cy: 7, rx: 6, ry: 3 },
    P('M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7'),
    P('M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3'),
  ],
  refresh: [P('M20 11a8 8 0 0 0-14.5-4.5L3 9M3 4v5h5M4 13a8 8 0 0 0 14.5 4.5L21 15M21 20v-5h-5')],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

type Props = { name: IconName; color: string; size?: number; strokeWidth?: number };

export function Icon({ name, color, size = 24, strokeWidth = 2 }: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {(ICONS[name] as Shape[]).map((s, i) => {
        switch (s.t) {
          case 'path':
            return <Path key={i} d={s.d} {...common} />;
          case 'circle':
            return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...common} />;
          case 'rect':
            return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} {...common} />;
          case 'ellipse':
            return <Ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...common} />;
        }
      })}
    </Svg>
  );
}
