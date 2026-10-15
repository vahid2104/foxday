/**
 * Foxday dizayn tokenləri.
 * Figma faylındakı "Primitives", "Color" və "Dimensions" dəyişənləri ilə eynidir:
 * https://www.figma.com/design/sU7tqQTSQo1QuOAgedgBVD
 */

export const palette = {
  orange50: '#FFF4EC',
  orange100: '#FFE4D1',
  orange200: '#FFC8A3',
  orange300: '#FFA86E',
  orange400: '#FF8A3D',
  orange500: '#F2711C',
  orange600: '#D35A0E',
  orange700: '#A8460C',
  orange900: '#3A2213',

  neutral0: '#FFFFFF',
  neutral50: '#FAF7F4',
  neutral100: '#F3EEE9',
  neutral200: '#E6DED6',
  neutral300: '#CFC4BA',
  neutral400: '#A89C91',
  neutral500: '#7D736A',
  neutral600: '#5A524B',
  neutral700: '#3B3530',
  neutral800: '#26221F',
  neutral850: '#1E1B18',
  neutral900: '#161412',

  green100: '#E3F6E8',
  green300: '#7FD6A1',
  green500: '#34B26A',
  green900: '#173324',

  red100: '#FDE6E3',
  red300: '#F28B7B',
  red500: '#E5533D',
  red900: '#3A1C17',

  blue100: '#E3EEFD',
  blue300: '#8DBDF2',
  blue500: '#3D8BE5',
  blue900: '#172A40',

  purple100: '#EEE8FD',
  purple300: '#B3A0F2',
  purple500: '#7B5CE0',
  purple900: '#241D3D',
} as const;

const p = palette;

export type ColorTokens = Record<
  | 'bgApp' | 'bgSurface' | 'bgSurfaceAlt' | 'bgBrand' | 'bgBrandSubtle'
  | 'bgSuccessSubtle' | 'bgDangerSubtle' | 'bgWaterSubtle' | 'bgSleepSubtle'
  | 'textPrimary' | 'textSecondary' | 'textOnBrand' | 'textBrand' | 'borderDefault'
  | 'accentBrand' | 'accentSuccess' | 'accentDanger' | 'accentWater' | 'accentSleep' | 'track',
  string
>;

export const lightColors: ColorTokens = {
  bgApp: p.neutral50,
  bgSurface: p.neutral0,
  bgSurfaceAlt: p.neutral100,
  bgBrand: p.orange400,
  bgBrandSubtle: p.orange50,
  bgSuccessSubtle: p.green100,
  bgDangerSubtle: p.red100,
  bgWaterSubtle: p.blue100,
  bgSleepSubtle: p.purple100,
  textPrimary: p.neutral800,
  textSecondary: p.neutral500,
  textOnBrand: p.neutral0,
  textBrand: p.orange600,
  borderDefault: p.neutral200,
  accentBrand: p.orange400,
  accentSuccess: p.green500,
  accentDanger: p.red500,
  accentWater: p.blue500,
  accentSleep: p.purple500,
  track: p.neutral100,
};


export const darkColors: ColorTokens = {
  bgApp: p.neutral900,
  bgSurface: p.neutral850,
  bgSurfaceAlt: p.neutral800,
  bgBrand: p.orange500,
  bgBrandSubtle: p.orange900,
  bgSuccessSubtle: p.green900,
  bgDangerSubtle: p.red900,
  bgWaterSubtle: p.blue900,
  bgSleepSubtle: p.purple900,
  textPrimary: p.neutral50,
  textSecondary: p.neutral400,
  textOnBrand: p.neutral0,
  textBrand: p.orange300,
  borderDefault: p.neutral700,
  accentBrand: p.orange400,
  accentSuccess: p.green300,
  accentDanger: p.red300,
  accentWater: p.blue300,
  accentSleep: p.purple300,
  track: p.neutral800,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  card: 20,
  full: 999,
} as const;

export const fonts = {
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;

/** Figma-dakı mətn stilləri ilə eyni ölçülər. */
export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38 },
  h1: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.44 },
} as const;

export type TypographyVariant = keyof typeof typography;

export const shadows = {
  card: {
    shadowColor: '#3D2914',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#F2711C',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
