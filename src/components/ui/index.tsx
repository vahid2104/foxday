import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { radius, shadows, spacing, typography, useTheme, type ColorTokens, type TypographyVariant } from '@/theme';

type ColorKey = keyof ColorTokens;

/** Dizayn sistemindəki mətn stilləri ilə mətn. */
export function Text({
  variant = 'body',
  color = 'textPrimary',
  style,
  ...rest
}: TextProps & { variant?: TypographyVariant; color?: ColorKey; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return <RNText {...rest} style={[typography[variant], { color: colors[color] }, style]} />;
}

/** Kölgəli ağ kart. */
export function Card({
  children,
  style,
  bg = 'bgSurface',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: ColorKey;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors[bg] },
        bg === 'bgSurface' && !isDark ? shadows.card : null,
        style,
      ]}>
      {children}
    </View>
  );
}

/** Rəngli fonda ikon (Figma-dakı "IconBox"). */
export function IconBox({
  icon,
  color,
  bg,
  size = 40,
  iconSize = 20,
  rounded = 12,
}: {
  icon: IconName;
  color: ColorKey;
  bg: ColorKey;
  size?: number;
  iconSize?: number;
  rounded?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: colors[bg],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={icon} color={colors[color]} size={iconSize} />
    </View>
  );
}

/** İrəliləyiş zolağı. value: 0–1. */
export function ProgressBar({
  value,
  color = 'accentBrand',
  track = 'track',
  height = 8,
}: {
  value: number;
  color?: ColorKey;
  track?: ColorKey;
  height?: number;
}) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colors[track], overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height / 2, backgroundColor: colors[color] }} />
    </View>
  );
}

/** Tab ekranları üçün çərçivə: təhlükəsiz zona + sürüşdürmə + alt menyu üçün boşluq. */
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export const Row = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  screenContent: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.sm,
    paddingBottom: 120,
    gap: spacing.lg,
  },
});
