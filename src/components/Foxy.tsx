import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

export type FoxyMood = 'happy' | 'normal' | 'sad' | 'sleepy';
export type FoxyAccessory = 'none' | 'scarf' | 'crown';

const ORANGE = '#FF8A3D';
const DARK_ORANGE = '#A8460C';
const CREAM = '#FFF4EC';
const INK = '#3B3530';
const BLUSH = '#FF9AA2';

/**
 * Foxy maskotu — Figma-dakı "Foxy" komponentinin 4 əhvalı.
 * accessory: səviyyə ilə açılan görünüşlər (4+ şərf, 8+ tac).
 */
export function Foxy({ mood = 'normal', size = 120, accessory = 'none' }: { mood?: FoxyMood; size?: number; accessory?: FoxyAccessory }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* qulaqlar */}
      <Path d="M24 54 L29 12 L56 33 Z" fill={ORANGE} stroke={ORANGE} strokeWidth={8} strokeLinejoin="round" />
      <Path d="M96 54 L91 12 L64 33 Z" fill={ORANGE} stroke={ORANGE} strokeWidth={8} strokeLinejoin="round" />
      <Path d="M32 42 L34 22 L47 33 Z" fill={DARK_ORANGE} stroke={DARK_ORANGE} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M88 42 L86 22 L73 33 Z" fill={DARK_ORANGE} stroke={DARK_ORANGE} strokeWidth={4} strokeLinejoin="round" />
      {/* baş */}
      <Path d="M60 28 C86 28 106 42 107 62 C108 79 91 98 60 109 C29 98 12 79 13 62 C14 42 34 28 60 28 Z" fill={ORANGE} />
      <Path d="M60 68 C72 68 92 71 101 64 C97 84 80 99 60 108 C40 99 23 84 19 64 C28 71 48 68 60 68 Z" fill={CREAM} />
      <Ellipse cx={60} cy={80} rx={6.5} ry={4.5} fill={INK} />
      {mood !== 'sad' && (
        <G opacity={0.6}>
          <Ellipse cx={33} cy={74} rx={6} ry={3.5} fill={BLUSH} />
          <Ellipse cx={87} cy={74} rx={6} ry={3.5} fill={BLUSH} />
        </G>
      )}
      <Face mood={mood} />
      {accessory === 'scarf' && (
        <G>
          <Path d="M28 94 Q60 114 92 94 L95 102 Q60 124 25 102 Z" fill="#3D8BE5" />
          <Path d="M80 101 L90 118 L82 120 L75 105 Z" fill="#2F6FBF" />
        </G>
      )}
      {accessory === 'crown' && (
        <Path
          d="M41 31 L44 13 L53 23 L60 8 L67 23 L76 13 L79 31 Z"
          fill="#FFC83D"
          stroke="#E0A400"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

function Face({ mood }: { mood: FoxyMood }) {
  const line = { stroke: INK, fill: 'none', strokeLinecap: 'round' as const };
  switch (mood) {
    case 'happy':
      return (
        <G>
          <Path d="M38 58 Q45 49 52 58" strokeWidth={4} {...line} />
          <Path d="M68 58 Q75 49 82 58" strokeWidth={4} {...line} />
          <Path d="M50 88 Q60 99 70 88" stroke={INK} strokeWidth={3.5} fill="#FF6B6B" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      );
    case 'sad':
      return (
        <G>
          <Ellipse cx={45} cy={58} rx={4.5} ry={5.5} fill={INK} />
          <Ellipse cx={75} cy={58} rx={4.5} ry={5.5} fill={INK} />
          <Path d="M37 51 L51 47" stroke={DARK_ORANGE} strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M83 51 L69 47" stroke={DARK_ORANGE} strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M52 94 Q60 87 68 94" strokeWidth={3} {...line} />
          <Path d="M40 66 Q38 72 41 74 Q44 72 42 66 Z" fill="#8DBDF2" />
        </G>
      );
    case 'sleepy':
      return (
        <G>
          <Path d="M38 57 Q45 62 52 57" strokeWidth={4} {...line} />
          <Path d="M68 57 Q75 62 82 57" strokeWidth={4} {...line} />
          <Ellipse cx={60} cy={92} rx={4} ry={3} fill={INK} />
          <Path d="M92 18 h10 l-10 12 h10" stroke="#7B5CE0" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M104 4 h7 l-7 8 h7" stroke="#7B5CE0" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      );
    default:
      return (
        <G>
          <Ellipse cx={45} cy={56} rx={5} ry={6.5} fill={INK} />
          <Ellipse cx={75} cy={56} rx={5} ry={6.5} fill={INK} />
          <Circle cx={46.5} cy={53.5} r={1.8} fill="#FFFFFF" />
          <Circle cx={76.5} cy={53.5} r={1.8} fill="#FFFFFF" />
          <Path d="M53 89 Q60 94 67 89" strokeWidth={3} {...line} />
        </G>
      );
  }
}
