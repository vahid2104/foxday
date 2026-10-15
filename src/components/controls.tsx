import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { IconBox, Row, Text } from '@/components/ui';
import { radius, spacing, useTheme, type ColorTokens } from '@/theme';

/** İki-üç seçimli seqment (Figma: "Segment"). */
export function Segment<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: colors.bgSurfaceAlt }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segmentItem, active && { backgroundColor: colors.bgSurface }]}>
            <Text variant="caption" color={active ? 'textPrimary' : 'textSecondary'} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Açar (Figma: "Toggle"). */
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={[
        styles.toggle,
        { backgroundColor: value ? colors.bgBrand : colors.track, alignItems: value ? 'flex-end' : 'flex-start' },
      ]}>
      <View style={styles.knob} />
    </Pressable>
  );
}

/** 1–5 ulduz. */
export function Stars({ value, onChange, size = 32 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const { colors } = useTheme();
  return (
    <Row style={{ gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange?.(n)} disabled={!onChange} hitSlop={4}>
          <Text style={{ fontSize: size, lineHeight: size + 4, color: n <= value ? colors.accentSleep : colors.borderDefault }}>
            ★
          </Text>
        </Pressable>
      ))}
    </Row>
  );
}

/** Kiçik başlıq (Ayarlarda "ÜMUMİ" kimi). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text variant="label" color="textSecondary" style={{ marginTop: spacing.xs }}>
      {children}
    </Text>
  );
}

/** Siyahı sətri (ikon + başlıq + sağda dəyər/ox və ya istənilən element). */
export function ListRow({
  icon,
  iconColor = 'textBrand',
  iconBg = 'bgBrandSubtle',
  title,
  subtitle,
  value,
  right,
  onPress,
  first,
}: {
  icon: IconName;
  iconColor?: keyof ColorTokens;
  iconBg?: keyof ColorTokens;
  title: string;
  subtitle?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  first?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.listRow,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderDefault },
        pressed && onPress ? { opacity: 0.6 } : null,
      ]}>
      <IconBox icon={icon} color={iconColor} bg={iconBg} size={34} rounded={10} iconSize={18} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (
        <>
          {value ? (
            <Text variant="caption" color="textSecondary">
              {value}
            </Text>
          ) : null}
          {onPress ? <Icon name="chevron-right" color={colors.textSecondary} size={18} /> : null}
        </>
      )}
    </Pressable>
  );
}

/** Tab olmayan ekranlar üçün çərçivə: geri düyməsi, başlıq, sağda isteğe bağlı ikon. */
export function DetailScreen({
  title,
  children,
  rightIcon,
  onRightPress,
  footer,
}: {
  title: string;
  children: ReactNode;
  rightIcon?: IconName;
  onRightPress?: () => void;
  footer?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <Row style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
          <IconBox icon="chevron-left" color="textPrimary" bg="bgSurface" rounded={20} iconSize={22} />
        </Pressable>
        <Text variant="h3" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          {title}
        </Text>
        {rightIcon ? (
          <Pressable onPress={onRightPress} hitSlop={8} accessibilityRole="button">
            <IconBox icon={rightIcon} color="textPrimary" bg="bgSurface" rounded={20} iconSize={20} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </Row>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {children}
        {footer}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  topBar: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  content: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
});

/** − dəyər + (Figma onboarding: "Gündəlik su − 2 L +"). */
export function Stepper({
  value,
  onChange,
  step,
  min,
  max,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  format: (v: number) => string;
}) {
  const { colors } = useTheme();
  const btn = (label: string, next: number, disabled: boolean) => (
    <Pressable
      onPress={() => !disabled && onChange(next)}
      disabled={disabled}
      hitSlop={6}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bgSurfaceAlt,
        opacity: disabled ? 0.4 : 1,
      }}>
      <Text variant="h3">{label}</Text>
    </Pressable>
  );
  return (
    <Row style={{ gap: 10 }}>
      {btn('−', Math.max(min, value - step), value <= min)}
      <Text variant="bodyStrong" style={{ minWidth: 64, textAlign: 'center' }}>
        {format(value)}
      </Text>
      {btn('+', Math.min(max, value + step), value >= max)}
    </Row>
  );
}
