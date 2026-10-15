import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Foxy } from '@/components/Foxy';
import { Icon, type IconName } from '@/components/Icon';
import { Card, IconBox, ProgressBar, Row, Screen, Text } from '@/components/ui';
import { useSettings } from '@/store/settings';
import { shadows, spacing, useTheme, type ColorTokens } from '@/theme';
import { formatLongDate, splitMinutes } from '@/utils/date';

// ⚠️ Müvəqqəti nümunə məlumatlar. Növbəti addımda SQLite bazasından oxunacaq.
const DEMO = {
  earnings: 248,
  workMin: 380,
  waterMl: 1250,
  sleepMin: 435,
  bedTime: '23:40',
  wakeTime: '06:55',
};

type Habit = { id: string; name: string; sub: string; icon: IconName; color: keyof ColorTokens; bg: keyof ColorTokens; done: boolean };

const DEMO_HABITS: Habit[] = [
  { id: '1', name: 'Səhər idmanı', sub: '🔥 12 gün ardıcıl', icon: 'dumbbell', color: 'accentSuccess', bg: 'bgSuccessSubtle', done: true },
  { id: '2', name: 'Kitab oxu — 20 dəq', sub: '🔥 6 gün ardıcıl', icon: 'book', color: 'textBrand', bg: 'bgBrandSubtle', done: true },
  { id: '3', name: '2 L su iç', sub: '1.25 / 2 L', icon: 'droplet', color: 'accentWater', bg: 'bgWaterSubtle', done: false },
  { id: '4', name: 'Telefonsuz 1 saat', sub: 'Hər gün · 21:00', icon: 'sparkle', color: 'accentSleep', bg: 'bgSleepSubtle', done: false },
];

export default function TodayScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { name, language, waterGoalMl, sleepGoalMin } = useSettings();
  const [habits, setHabits] = useState(DEMO_HABITS);

  const doneCount = habits.filter((h) => h.done).length;
  const water = Math.min(DEMO.waterMl / waterGoalMl, 1);
  const sleep = Math.min(DEMO.sleepMin / sleepGoalMin, 1);
  // SPEC §7: günün balı
  const score = Math.round(40 * (doneCount / habits.length) + 25 * water + 25 * sleep + 10);
  const work = splitMinutes(DEMO.workMin);
  const slept = splitMinutes(DEMO.sleepMin);
  const allDone = doneCount === habits.length;

  const toggle = (id: string) => {
    setHabits((list) => list.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <Text variant="caption" color="textSecondary">
            {formatLongDate(new Date(), language)}
          </Text>
          <Text variant="h1">{t('today.greeting', { name })}</Text>
        </View>
        <IconBox icon="bell" color="textPrimary" bg="bgSurface" size={44} rounded={22} iconSize={22} />
      </Row>

      <Card bg="bgBrand" style={[styles.hero, shadows.floating]}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="label" color="textOnBrand">
            {t('today.scoreLabel')}
          </Text>
          <Row style={{ gap: 4, alignItems: 'baseline' }}>
            <Text variant="display" color="textOnBrand">
              {score}
            </Text>
            <Text variant="bodyStrong" color="textOnBrand">
              /100
            </Text>
          </Row>
          <Text variant="caption" color="textOnBrand">
            {t('today.scoreMessage', { count: habits.length - doneCount })}
          </Text>
          <ProgressBar value={score / 100} color="textOnBrand" track="textBrand" />
        </View>
        <Foxy mood={allDone ? 'happy' : doneCount === 0 ? 'sad' : 'happy'} size={96} />
      </Card>

      <Row style={{ alignItems: 'stretch' }}>
        <Card style={{ flex: 1, gap: 6 }}>
          <IconBox icon="bike" color="textBrand" bg="bgBrandSubtle" size={36} rounded={10} />
          <Text variant="caption" color="textSecondary">
            {t('today.earnings')}
          </Text>
          <Text variant="h2">{DEMO.earnings} PLN</Text>
          <Text variant="caption" color="accentSuccess">
            {t('today.perHour', {
              hours: t('common.hoursMinutes', work),
              rate: (DEMO.earnings / (DEMO.workMin / 60)).toFixed(0),
            })}
          </Text>
        </Card>
        <Card style={{ flex: 1, gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <IconBox icon="droplet" color="accentWater" bg="bgWaterSubtle" size={36} rounded={10} />
            <Pressable onPress={() => Haptics.selectionAsync()}>
              <IconBox icon="plus" color="textOnBrand" bg="accentWater" size={32} rounded={16} iconSize={18} />
            </Pressable>
          </Row>
          <Text variant="caption" color="textSecondary">
            {t('today.water')}
          </Text>
          <Row style={{ gap: 2, alignItems: 'baseline' }}>
            <Text variant="h2">{(DEMO.waterMl / 1000).toFixed(2)}</Text>
            <Text variant="caption" color="textSecondary">
              {' '}
              / {waterGoalMl / 1000} L
            </Text>
          </Row>
          <ProgressBar value={water} color="accentWater" height={6} />
        </Card>
      </Row>

      <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
        <IconBox icon="moon" color="accentSleep" bg="bgSleepSubtle" size={36} rounded={10} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textSecondary">
            {t('today.sleepLastNight')}
          </Text>
          <Text variant="bodyStrong">{t('common.hoursMinutes', slept)}</Text>
        </View>
        <Text variant="caption" color="textSecondary">
          {DEMO.bedTime} → {DEMO.wakeTime}
        </Text>
      </Card>

      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="h3">{t('today.habitsTitle')}</Text>
        <Text variant="bodyStrong" color="textBrand">
          {doneCount} / {habits.length}
        </Text>
      </Row>

      <View style={{ gap: spacing.sm }}>
        {habits.map((h) => (
          <Pressable key={h.id} onPress={() => toggle(h.id)}>
            <View style={[styles.habit, { backgroundColor: colors.bgSurface }]}>
              <IconBox icon={h.icon} color={h.color} bg={h.bg} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{h.name}</Text>
                <Text variant="caption" color="textSecondary">
                  {h.sub}
                </Text>
              </View>
              <View
                style={[
                  styles.check,
                  h.done
                    ? { backgroundColor: colors.accentSuccess }
                    : { borderWidth: 2, borderColor: colors.borderDefault },
                ]}>
                {h.done && <Icon name="check" color={colors.textOnBrand} size={18} />}
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  habit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
