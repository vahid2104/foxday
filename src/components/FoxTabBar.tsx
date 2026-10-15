import * as Haptics from 'expo-haptics';
import { router, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/ui';
import { shadows, useTheme } from '@/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: { route: string; icon: IconName; label: 'today' | 'money' | 'goals' | 'health' }[] = [
  { route: 'index', icon: 'home', label: 'today' },
  { route: 'money', icon: 'wallet', label: 'money' },
  { route: 'goals', icon: 'target', label: 'goals' },
  { route: 'health', icon: 'heart', label: 'health' },
];

/** Alt naviqasiya: 4 tab + ortada narıncı "+" düyməsi (Figma: "Tab Bar"). */
export function FoxTabBar({ state, navigation, insets }: TabBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const activeRoute = state.routes[state.index]?.name;

  const renderTab = (tab: (typeof TABS)[number]) => {
    const active = activeRoute === tab.route;
    const color = active ? colors.textBrand : colors.textSecondary;
    return (
      <Pressable
        key={tab.route}
        style={styles.tab}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => {
          if (!active) {
            Haptics.selectionAsync();
            navigation.navigate(tab.route);
          }
        }}>
        <Icon name={tab.icon} color={color} size={24} />
        <Text variant="label" style={{ color }}>
          {t(`tabs.${tab.label}`)}
        </Text>
        <View style={[styles.dot, { backgroundColor: active ? colors.accentBrand : 'transparent' }]} />
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderDefault,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      {TABS.slice(0, 2).map(renderTab)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="+"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/add');
        }}
        style={({ pressed }) => [
          styles.fab,
          shadows.floating,
          { backgroundColor: colors.bgBrand, transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}>
        <Icon name="plus" color={colors.textOnBrand} size={28} />
      </Pressable>
      {TABS.slice(2).map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    width: 68,
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
});
