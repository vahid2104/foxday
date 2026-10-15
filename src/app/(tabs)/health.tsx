import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { CaloriesCard } from '@/components/CaloriesCard';
import { Stars } from '@/components/controls';
import { Button } from '@/components/form';
import { Foxy, type FoxyMood } from '@/components/Foxy';
import { Icon } from '@/components/Icon';
import { Card, IconBox, Row, Screen, Text } from '@/components/ui';
import { addWater, getSleep, getSleepRange, getWaterMl, undoLastWater } from '@/db/health';
import { useDbQuery } from '@/db/useDbQuery';
import { addDays, startOfWeek, today } from '@/lib/dates';
import { formatShortDate, splitMinutes, WEEKDAYS_SHORT } from '@/lib/format-date';
import { formatAmount } from '@/lib/money';
import { useSettings } from '@/store/settings';
import { radius, spacing, useTheme } from '@/theme';

/** Figma: "04 · Sağlamlıq" */
export default function HealthScreen() {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="h1">{t('tabs.health')}</Text>
        <Text variant="caption" color="textSecondary">
          {formatShortDate(today(), language)}
        </Text>
      </Row>
      <WaterCard />
      <SleepCard />
      <CaloriesCard />
      <FoxyTip />
    </Screen>
  );
}

function WaterCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { waterGoalMl, glassMl } = useSettings();
  const date = today();
  const ml = useDbQuery(() => getWaterMl(date));
  const glasses = Math.min(10, Math.max(1, Math.ceil(waterGoalMl / glassMl)));
  const filled = Math.floor(ml / glassMl);
  const pct = Math.round((ml / waterGoalMl) * 100);

  const add = (amount: number) => {
    const before = ml;
    addWater(date, amount);
    if (before < waterGoalMl && before + amount >= waterGoalMl) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Card style={{ gap: 14 }}>
      <Row>
        <IconBox icon="droplet" color="accentWater" bg="bgWaterSubtle" size={44} rounded={14} iconSize={22} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textSecondary">
            {t('health.water')}
          </Text>
          <Row style={{ gap: 4, alignItems: 'baseline' }}>
            <Text variant="h2">{formatAmount(ml * 100)}</Text>
            <Text variant="caption" color="textSecondary">
              / {formatAmount(waterGoalMl * 100)} ml
            </Text>
          </Row>
        </View>
        <Text variant="h3" color="accentWater">
          {pct}%
        </Text>
      </Row>
      <Row style={{ justifyContent: 'space-between', gap: 4 }}>
        {Array.from({ length: glasses }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              maxWidth: 32,
              height: 40,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              backgroundColor: i < filled ? colors.accentWater : colors.bgWaterSubtle,
            }}
          />
        ))}
      </Row>
      <Row style={{ gap: 10 }}>
        <WaterButton label={`${glassMl} ml`} primary onPress={() => add(glassMl)} />
        <WaterButton label="500 ml" onPress={() => add(500)} />
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" color={ml >= waterGoalMl ? 'accentSuccess' : 'textSecondary'}>
          {ml >= waterGoalMl ? t('health.goalReached') : ''}
        </Text>
        {ml > 0 ? (
          <Pressable onPress={() => undoLastWater(date)} hitSlop={8}>
            <Text variant="caption" color="textBrand">
              {t('health.undo')}
            </Text>
          </Pressable>
        ) : null}
      </Row>
    </Card>
  );
}

function WaterButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  const { colors } = useTheme();
  const fg = primary ? colors.textOnBrand : colors.accentWater;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: primary ? colors.accentWater : colors.bgWaterSubtle,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Icon name="plus" color={fg} size={18} />
      <Text variant="bodyStrong" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SleepCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const sleepGoalMin = useSettings((s) => s.sleepGoalMin);
  const date = today();
  const sleep = useDbQuery(() => getSleep(date));
  const monday = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const week = useDbQuery(() => getSleepRange(days[0], days[6]));
  const byDate = Object.fromEntries(week.map((s) => [s.date, s.durationMin]));
  const avg = week.length ? Math.round(week.reduce((a, s) => a + s.durationMin, 0) / week.length) : null;

  return (
    <Card style={{ gap: 14 }}>
      <Row>
        <IconBox icon="moon" color="accentSleep" bg="bgSleepSubtle" size={44} rounded={14} iconSize={22} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textSecondary">
            {t('health.lastNight')}
          </Text>
          <Text variant="h2">{sleep ? t('common.hoursMinutes', splitMinutes(sleep.durationMin)) : '—'}</Text>
        </View>
        {sleep?.quality ? <Stars value={sleep.quality} size={16} /> : null}
      </Row>

      {sleep ? (
        <Row style={{ gap: 10 }}>
          {[
            [t('health.bed'), sleep.bedTime],
            [t('health.wake'), sleep.wakeTime],
          ].map(([l, v]) => (
            <View key={l} style={{ flex: 1, padding: 12, borderRadius: radius.md + 2, backgroundColor: colors.bgSleepSubtle }}>
              <Text variant="caption" color="textSecondary">
                {l}
              </Text>
              <Text variant="h3">{v}</Text>
            </View>
          ))}
        </Row>
      ) : (
        <Text color="textSecondary">{t('health.noSleep')}</Text>
      )}

      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {days.map((d, i) => {
          const m = byDate[d];
          const isToday = d === date;
          return (
            <View key={d} style={{ alignItems: 'center', gap: 6, width: 32 }}>
              <View
                style={{
                  width: 24,
                  height: m ? Math.max(10, Math.round((m / Math.max(sleepGoalMin, 1)) * 64)) : 6,
                  maxHeight: 80,
                  borderRadius: 7,
                  backgroundColor: m ? colors.accentSleep : colors.track,
                  opacity: m && !isToday ? 0.45 : 1,
                }}
              />
              <Text variant="label" color={isToday ? 'accentSleep' : 'textSecondary'}>
                {WEEKDAYS_SHORT[language][i]}
              </Text>
            </View>
          );
        })}
      </Row>
      {avg != null ? (
        <Text variant="caption" color="textSecondary">
          {t('health.average', { avg: t('common.hoursMinutes', splitMinutes(avg)), goal: Math.round(sleepGoalMin / 6) / 10 })}
        </Text>
      ) : null}

      <Button
        label={sleep ? t('health.editSleep') : t('health.addSleep')}
        icon={sleep ? 'pencil' : 'moon'}
        variant={sleep ? 'secondary' : 'primary'}
        onPress={() => router.push('/sleep/new')}
      />
    </Card>
  );
}

function FoxyTip() {
  const { t } = useTranslation();
  const { sleepGoalMin, waterGoalMl } = useSettings();
  const date = today();
  const week = useDbQuery(() => getSleepRange(addDays(date, -6), date));
  const water = useDbQuery(() => getWaterMl(date));
  const avg = week.length ? week.reduce((a, s) => a + s.durationMin, 0) / week.length : null;
  const hour = new Date().getHours();

  let mood: FoxyMood = 'happy';
  let text = t('health.tipGood');
  if (hour >= 15 && water < waterGoalMl / 2) {
    mood = 'normal';
    text = t('health.tipWater');
  } else if (avg == null) {
    mood = 'normal';
    text = t('health.tipNoData');
  } else if (avg < sleepGoalMin - 30) {
    mood = 'sleepy';
    text = t('health.tipLow');
  }

  return (
    <Card bg="bgBrandSubtle" style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
      <Foxy mood={mood} size={56} />
      <Text variant="caption" style={{ flex: 1 }}>
        {text}
      </Text>
    </Card>
  );
}
