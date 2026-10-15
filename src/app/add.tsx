import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/components/Icon';
import { IconBox, Text } from '@/components/ui';
import { spacing, useTheme, type ColorTokens } from '@/theme';

const OPTIONS: { label: string; icon: IconName; color: keyof ColorTokens; bg: keyof ColorTokens }[] = [
  { label: 'Gəlir', icon: 'bike', color: 'textBrand', bg: 'bgBrandSubtle' },
  { label: 'Xərc', icon: 'arrow-down-left', color: 'accentDanger', bg: 'bgDangerSubtle' },
  { label: 'Su', icon: 'droplet', color: 'accentWater', bg: 'bgWaterSubtle' },
  { label: 'Vərdiş', icon: 'check', color: 'accentSuccess', bg: 'bgSuccessSubtle' },
  { label: 'Yuxu', icon: 'moon', color: 'accentSleep', bg: 'bgSleepSubtle' },
  { label: 'Məqsəd', icon: 'target', color: 'textBrand', bg: 'bgBrandSubtle' },
];

/** Sürətli əlavə menyusu (Figma: "06 · Sürətli əlavə"). Formalar növbəti addımda qoşulacaq. */
export default function AddSheet() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Pressable style={styles.scrim} onPress={() => router.back()} accessibilityLabel="Bağla" />
      <View style={[styles.sheet, { backgroundColor: colors.bgSurface, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.handle, { backgroundColor: colors.borderDefault }]} />
        <Text variant="h2" style={{ alignSelf: 'stretch' }}>
          Nə əlavə edək?
        </Text>
        <View style={styles.grid}>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.label}
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
              }}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: colors.bgSurfaceAlt, opacity: pressed ? 0.7 : 1 },
              ]}>
              <IconBox icon={o.icon} color={o.color} bg={o.bg} size={48} rounded={16} iconSize={22} />
              <Text variant="bodyStrong">{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(23,20,18,0.55)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
    gap: spacing.lg,
    alignItems: 'center',
  },
  handle: { width: 40, height: 5, borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignSelf: 'stretch' },
  option: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: 18,
  },
});
