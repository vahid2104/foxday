import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Foxy, type FoxyMood } from '@/components/Foxy';
import { HabitRow } from '@/components/HabitRow';
import { SubscriptionRow } from '@/components/SubscriptionRow';
import { Card, IconBox, ProgressBar, Row, Screen, Text } from '@/components/ui';
import { getMissedOn, getTodayHabits } from '@/db/habits';
import { addWater, anythingLogged, getSleep, getWaterMl } from '@/db/health';
import { getDayEarnings } from '@/db/money';
import { getSubscriptions } from '@/db/subscriptions';
import { getXpStats } from '@/db/xp';
import { useDbQuery } from '@/db/useDbQuery';
import { addDays, today } from '@/lib/dates';
import { formatLongDate, splitMinutes } from '@/lib/format-date';
import { dayScore } from '@/lib/habits';
import { formatAmount, formatMoney, hourlyRate } from '@/lib/money';
import { foxyAccessory, levelFromXp, totalXp } from '@/lib/xp';
import { useSettings } from '@/store/settings';
import { palette, shadows, spacing } from '@/theme';

/** Figma: "01 · Bu gün" */
export default function TodayScreen() {
  const { t } = useTranslation();
  const { name, language, waterGoalMl, sleepGoalMin, glassMl, onboardingDone } = useSettings();
  const date = today();

  const earnings = useDbQuery(() => getDayEarnings(date));
  const habits = useDbQuery(() => getTodayHabits(date));
  const waterMl = useDbQuery(() => getWaterMl(date));
  const sleep = useDbQuery(() => getSleep(date));
  const logged = useDbQuery(() => anythingLogged(date));
  const level = useDbQuery(() => levelFromXp(totalXp(getXpStats())).level);
  const urgentSubs = useDbQuery(() => getSubscriptions(date).filter((s) => s.status.kind === 'soon' || s.status.kind === 'overdue'));

  const todays = habits.filter((h) => h.due || h.todayStatus);
  const counted = todays.filter((h) => h.todayStatus !== 'skipped');
  const doneCount = counted.filter((h) => h.todayStatus === 'done').length;
  const allDone = counted.length > 0 && doneCount === counted.length;
  const score = dayScore({
    habitsDone: doneCount,
    habitsDue: counted.length,
    waterMl,
    waterGoalMl,
    sleepMin: sleep?.durationMin ?? null,
    sleepGoalMin,
    anythingLogged: logged,
  });
  const perHour = hourlyRate(earnings.pln, earnings.minutes);

  // Dünən buraxılan vərdişlər varsa, gündə bir dəfə Foxy-nin kədərli ekranını göstər
  useEffect(() => {
    if (!onboardingDone) return;
    const { lastMissedShown, set } = useSettings.getState();
    if (lastMissedShown === date) return;
    const missed = getMissedOn(addDays(date, -1));
    set({ lastMissedShown: date });
    if (missed.length > 0) {
      const timer = setTimeout(() => router.push('/missed'), 600);
      return () => clearTimeout(timer);
    }
  }, [date, onboardingDone]);

  // Yeni səviyyə → təbrik (ilk açılışda səssizcə yadda saxla)
  useEffect(() => {
    if (!onboardingDone) return;
    const { lastLevel, set } = useSettings.getState();
    if (lastLevel === 0) {
      set({ lastLevel: level });
    } else if (level > lastLevel) {
      set({ lastLevel: level });
      const timer = setTimeout(() => router.push({ pathname: '/celebrate', params: { kind: 'level', level: String(level) } }), 900);
      return () => clearTimeout(timer);
    }
  }, [level, onboardingDone]);

  let mood: FoxyMood = 'normal';
  if (allDone) mood = 'happy';
  else if (sleep && sleep.durationMin < 360) mood = 'sleepy';
  else if (doneCount > 0 || score >= 60) mood = 'happy';

  const message =
    counted.length === 0
      ? t('today.scoreMessageNoHabits')
      : allDone
        ? t('today.scoreMessageDone')
        : doneCount === 0
          ? t('today.scoreMessageStart')
          : t('today.scoreMessage', { count: counted.length - doneCount });

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text variant="caption" color="textSecondary">
            {formatLongDate(new Date(), language)}
          </Text>
          <Row style={{ gap: 8 }}>
            <Text variant="h1" numberOfLines={1} style={{ flexShrink: 1 }}>
              {t('today.greeting', { name })}
            </Text>
            <Pressable onPress={() => router.push('/achievements')} hitSlop={6}>
              <View style={styles.levelChip}>
                <Text variant="label" color="textOnBrand">
                  {t('xp.levelShort', { level })}
                </Text>
              </View>
            </Pressable>
          </Row>
        </View>
        <Pressable onPress={() => router.push('/settings')} hitSlop={8} accessibilityLabel={t('settings.title')}>
          <IconBox icon="sliders" color="textPrimary" bg="bgSurface" size={44} rounded={22} iconSize={22} />
        </Pressable>
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
            {message}
          </Text>
          <ProgressBar value={score / 100} color="textOnBrand" track="textBrand" />
        </View>
        <Foxy mood={mood} size={96} accessory={foxyAccessory(level)} />
      </Card>

      {urgentSubs.length > 0 ? (
        <Card style={{ gap: 14 }}>
          {urgentSubs.map((s) => (
            <SubscriptionRow key={s.id} sub={s} onPress={() => router.push('/subscriptions')} />
          ))}
        </Card>
      ) : null}

      <Row style={{ alignItems: 'stretch' }}>
        <Pressable style={{ flex: 1 }} onPress={() => router.push('/income/new')}>
          <Card style={{ flex: 1, gap: 6 }}>
            <IconBox icon="bike" color="textBrand" bg="bgBrandSubtle" size={36} rounded={10} />
            <Text variant="caption" color="textSecondary">
              {t('today.earnings')}
            </Text>
            <Text variant="h2" numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(earnings.pln)}
            </Text>
            <Text variant="caption" color={perHour != null ? 'accentSuccess' : 'textSecondary'}>
              {perHour != null
                ? t('today.perHour', {
                    hours: t('common.hoursMinutes', splitMinutes(earnings.minutes)),
                    rate: formatAmount(perHour),
                  })
                : earnings.sessions > 0
                  ? t('today.ordersCount', { count: earnings.orders })
                  : t('today.noWorkTime')}
            </Text>
          </Card>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => router.push('/health')}>
          <Card style={{ flex: 1, gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <IconBox icon="droplet" color="accentWater" bg="bgWaterSubtle" size={36} rounded={10} />
              <Pressable
                hitSlop={8}
                onPress={() => {
                  addWater(date, glassMl);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}>
                <IconBox icon="plus" color="textOnBrand" bg="accentWater" size={32} rounded={16} iconSize={18} />
              </Pressable>
            </Row>
            <Text variant="caption" color="textSecondary">
              {t('today.water')}
            </Text>
            <Row style={{ gap: 2, alignItems: 'baseline' }}>
              <Text variant="h2">{(waterMl / 1000).toFixed(2).replace('.', ',')}</Text>
              <Text variant="caption" color="textSecondary">
                {' '}
                / {String(waterGoalMl / 1000).replace('.', ',')} L
              </Text>
            </Row>
            <ProgressBar value={waterMl / waterGoalMl} color="accentWater" height={6} />
          </Card>
        </Pressable>
      </Row>

      <Pressable onPress={() => router.push(sleep ? '/health' : '/sleep/new')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
          <IconBox icon="moon" color="accentSleep" bg="bgSleepSubtle" size={36} rounded={10} />
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="textSecondary">
              {t('today.sleepLastNight')}
            </Text>
            <Text variant="bodyStrong">{sleep ? t('common.hoursMinutes', splitMinutes(sleep.durationMin)) : t('today.noSleep')}</Text>
          </View>
          {sleep ? (
            <Text variant="caption" color="textSecondary">
              {sleep.bedTime} → {sleep.wakeTime}
            </Text>
          ) : null}
        </Card>
      </Pressable>

      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="h3">{t('today.habitsTitle')}</Text>
        <Pressable onPress={() => router.push('/goals')} hitSlop={8}>
          <Text variant="bodyStrong" color="textBrand">
            {counted.length > 0 ? `${doneCount} / ${counted.length}` : t('today.seeAll')}
          </Text>
        </Pressable>
      </Row>

      {todays.length === 0 ? (
        <Pressable onPress={() => router.push('/habit/form')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconBox icon="plus" color="textBrand" bg="bgBrandSubtle" />
            <Text color="textSecondary" style={{ flex: 1 }}>
              {t('today.noHabits')}
            </Text>
          </Card>
        </Pressable>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {todays.map((h) => (
            <HabitRow key={h.id} habit={h} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  levelChip: {
    backgroundColor: palette.orange500,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});
