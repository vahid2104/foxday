import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Segment } from '@/components/controls';
import { Button } from '@/components/form';
import { Foxy } from '@/components/Foxy';
import { GoalCard } from '@/components/GoalCard';
import { HabitRow } from '@/components/HabitRow';
import { Icon } from '@/components/Icon';
import { Card, Row, Screen, Text } from '@/components/ui';
import { getGoals } from '@/db/goals';
import { getAllLogs, getTodayHabits, type Habit } from '@/db/habits';
import { useDbQuery } from '@/db/useDbQuery';
import { addDays, startOfWeek, today } from '@/lib/dates';
import { WEEKDAYS_SHORT } from '@/lib/format-date';
import { dayState, type HabitLogStatus } from '@/lib/habits';
import { useSettings } from '@/store/settings';
import { spacing, useTheme } from '@/theme';

/** Figma: "03 · Hədəflər" */
export default function GoalsScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'habits' | 'goals'>('habits');

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="h1">{t('tabs.goals')}</Text>
        <Segment
          style={{ width: 210 }}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'habits', label: t('habits.segHabits') },
            { value: 'goals', label: t('habits.segGoals') },
          ]}
        />
      </Row>
      {tab === 'habits' ? <HabitsTab /> : <GoalsTab />}
    </Screen>
  );
}

function HabitsTab() {
  const { t } = useTranslation();
  const habits = useDbQuery(() => getTodayHabits());
  const due = habits.filter((h) => h.due || h.todayStatus);
  const notDue = habits.filter((h) => !h.due && !h.todayStatus);

  if (habits.length === 0) {
    return (
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        <Foxy mood="normal" size={96} />
        <Text variant="h3">{t('habits.emptyTitle')}</Text>
        <Text color="textSecondary" style={{ textAlign: 'center' }}>
          {t('habits.emptyText')}
        </Text>
        <Button label={t('habits.newHabit')} icon="plus" onPress={() => router.push('/habit/form')} style={{ alignSelf: 'stretch' }} />
      </Card>
    );
  }

  return (
    <>
      <WeekStrip habits={habits} bestStreak={Math.max(0, ...habits.map((h) => h.streak))} />
      <View style={{ gap: spacing.sm }}>
        {due.map((h) => (
          <HabitRow key={h.id} habit={h} />
        ))}
      </View>
      {notDue.length > 0 ? (
        <>
          <Text variant="caption" color="textSecondary">
            {t('habits.notToday')}
          </Text>
          <View style={{ gap: spacing.sm, opacity: 0.7 }}>
            {notDue.map((h) => (
              <HabitRow key={h.id} habit={h} />
            ))}
          </View>
        </>
      ) : null}
      <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
        {t('habits.holdHint')}
      </Text>
      <Button label={t('habits.newHabit')} icon="plus" variant="secondary" onPress={() => router.push('/habit/form')} />
    </>
  );
}

/** Həftə zolağı: hər gün üçün neçə vərdiş edilib. */
function WeekStrip({ habits, bestStreak }: { habits: Habit[]; bestStreak: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const todayIso = today();
  const monday = startOfWeek(todayIso);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const logs = useDbQuery(() => getAllLogs(days[0], days[6]));

  let totalDue = 0;
  let totalDone = 0;
  const perDay = days.map((d) => {
    let due = 0;
    let done = 0;
    for (const h of habits) {
      const s = dayState(h, d, (logs[h.id] ?? {}) as Record<string, HabitLogStatus>, todayIso);
      if (s === 'done') {
        due++;
        done++;
      } else if (s === 'missed' || s === 'pending') {
        due++;
      }
    }
    if (d < todayIso || (d === todayIso && done > 0)) {
      totalDue += d === todayIso ? done : due;
      totalDone += done;
    }
    return { d, due, done };
  });
  const pct = totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : 0;

  return (
    <Card style={{ gap: 14 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="bodyStrong">{t('habits.weekProgress', { pct })}</Text>
        <Row style={{ gap: 4 }}>
          <Icon name="flame" color={colors.textBrand} size={16} />
          <Text variant="caption" color="textBrand">
            {t('habits.bestStreak', { count: bestStreak })}
          </Text>
        </Row>
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        {perDay.map(({ d, due, done }, i) => {
          const isToday = d === todayIso;
          const future = d > todayIso;
          const all = due > 0 && done >= due;
          const dayNum = Number(d.slice(8));
          let bg = colors.track;
          let fg = colors.textSecondary;
          let border: string | undefined;
          if (all && !future) {
            bg = colors.accentSuccess;
            fg = colors.textOnBrand;
          } else if (isToday) {
            bg = colors.bgBrand;
            fg = colors.textOnBrand;
          } else if (!future && done > 0) {
            bg = colors.bgBrandSubtle;
            fg = colors.textBrand;
            border = colors.accentBrand;
          }
          return (
            <View key={d} style={{ alignItems: 'center', gap: 6 }}>
              <Text variant="label" color={isToday ? 'textBrand' : 'textSecondary'}>
                {WEEKDAYS_SHORT[language][i]}
              </Text>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: bg,
                  borderWidth: border ? 2 : 0,
                  borderColor: border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {all && !future ? (
                  <Icon name="check" color={fg} size={18} />
                ) : (
                  <Text variant={isToday ? 'bodyStrong' : 'caption'} style={{ color: fg }}>
                    {dayNum}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </Row>
    </Card>
  );
}

function GoalsTab() {
  const { t } = useTranslation();
  const goals = useDbQuery(() => getGoals());

  if (goals.length === 0) {
    return (
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        <Foxy mood="normal" size={96} />
        <Text variant="h3">{t('goals.emptyTitle')}</Text>
        <Text color="textSecondary" style={{ textAlign: 'center' }}>
          {t('goals.emptyText')}
        </Text>
        <Button label={t('goals.newGoal')} icon="plus" onPress={() => router.push('/goal/form')} style={{ alignSelf: 'stretch' }} />
      </Card>
    );
  }

  return (
    <>
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} />
      ))}
      <Button label={t('goals.newGoal')} icon="plus" variant="secondary" onPress={() => router.push('/goal/form')} />
    </>
  );
}
