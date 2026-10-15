import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/components/Icon';
import { IconBox, Text } from '@/components/ui';
import { addWater } from '@/db/health';
import { today } from '@/lib/dates';
import { useSettings } from '@/store/settings';
import { spacing, useTheme, type ColorTokens } from '@/theme';

type Option = {
  key: 'income' | 'expense' | 'water' | 'habit' | 'sleep' | 'goal';
  icon: IconName;
  color: keyof ColorTokens;
  bg: keyof ColorTokens;
  href?: Href;
};

const OPTIONS: Option[] = [
  { key: 'income', icon: 'bike', color: 'textBrand', bg: 'bgBrandSubtle', href: '/income/new' },
  { key: 'expense', icon: 'arrow-down-left', color: 'accentDanger', bg: 'bgDangerSubtle', href: '/expense/new' },
  { key: 'water', icon: 'droplet', color: 'accentWater', bg: 'bgWaterSubtle' },
  { key: 'habit', icon: 'check', color: 'accentSuccess', bg: 'bgSuccessSubtle', href: '/habit/form' },
  { key: 'sleep', icon: 'moon', color: 'accentSleep', bg: 'bgSleepSubtle', href: '/sleep/new' },
  { key: 'goal', icon: 'target', color: 'textBrand', bg: 'bgBrandSubtle', href: '/goal/form' },
];

/** Sürətli əlavə menyusu (Figma: "06 · Sürətli əlavə"). */
export default function AddSheet() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const choose = (o: Option) => {
    Haptics.selectionAsync();
    if (o.href) {
      router.replace(o.href);
    } else if (o.key === 'water') {
      // Su: bir stəkan əlavə et və bağla
      addWater(today(), useSettings.getState().glassMl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  return (
    <View style={styles.root}>
      <Pressable style={styles.scrim} onPress={() => router.back()} accessibilityLabel={t('common.cancel')} />
      <View style={[styles.sheet, { backgroundColor: colors.bgSurface, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.handle, { backgroundColor: colors.borderDefault }]} />
        <Text variant="h2" style={{ alignSelf: 'stretch' }}>
          {t('add.title')}
        </Text>
        <View style={styles.grid}>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => choose(o)}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: colors.bgSurfaceAlt, opacity: pressed ? 0.7 : 1 },
              ]}>
              <IconBox icon={o.icon} color={o.color} bg={o.bg} size={48} rounded={16} iconSize={22} />
              <Text variant="bodyStrong">{o.key === 'water' ? `+${useSettings.getState().glassMl} ml` : t(`add.${o.key}`)}</Text>
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
