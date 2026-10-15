import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { DetailScreen } from '@/components/controls';
import { Button } from '@/components/form';
import { Foxy } from '@/components/Foxy';
import { HABIT_COLOR_TOKENS } from '@/components/habit-meta';
import { Icon } from '@/components/Icon';
import { Card, IconBox, Row, Text } from '@/components/ui';
import { archiveHabit, deleteHabit, getHabit, getHabitLogs, setHabitLog } from '@/db/habits';
import { useDbQuery } from '@/db/useDbQuery';
import { monthRange, toISODate, today } from '@/lib/dates';
import { formatMonthYear, WEEKDAYS_SHORT } from '@/lib/format-date';
import { completionRate, currentStreak, dayState, longestStreak, type DayState } from '@/lib/habits';
import { syncReminders } from '@/services/notifications';
import { useSettings } from '@/store/settings';
import { spacing, useTheme } from '@/theme';

/** Figma: "13 · Vərdiş detalı" */
export default function HabitDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);
  const habit = useDbQuery(() => getHabit(habitId));
  const logs = useDbQuery(() => getHabitLogs(habitId));
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });

  if (!habit) return <DetailScreen title="">{null}</DetailScreen>;

  const todayIso = today();
  const streak = currentStreak(habit, logs, todayIso);
  const best = longestStreak(habit, logs, todayIso);
  const { from, to } = monthRange(month.y, month.m);
  const rate = completionRate(habit, logs, from, to, todayIso);
  const totalDone = Object.values(logs).filter((s) => s === 'done').length;
  const tokens = HABIT_COLOR_TOKENS[habit.color];
  const isCurrentMonth = month.y === now.getFullYear() && month.m === now.getMonth();

  // Ay təqvimi: həftələr B.e-dən başlayır
  const first = new Date(month.y, month.m, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(month.y, month.m, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  const cycleDay = (iso: string) => {
    if (iso > todayIso || iso < habit.startDate) return;
    const cur = logs[iso];
    const next = cur === undefined ? 'done' : cur === 'done' ? 'skipped' : null;
    setHabitLog(habitId, iso, next);
    Haptics.selectionAsync();
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(month.y, month.m + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  const tip =
    streak === 0 ? t('habitDetail.foxyStart') : streak >= best ? t('habitDetail.foxyNewRecord') : t('habitDetail.foxyRecord', { count: best - streak + 1 });

  const stateStyle = (s: DayState) => {
    switch (s) {
      case 'done':
        return { bg: colors.accentSuccess, fg: colors.textOnBrand };
      case 'missed':
        return { bg: colors.bgDangerSubtle, fg: colors.accentDanger };
      case 'skipped':
        return { bg: colors.track, fg: colors.textSecondary };
      default:
        return { bg: 'transparent', fg: colors.textSecondary };
    }
  };

  return (
    <DetailScreen title={habit.name} rightIcon="pencil" onRightPress={() => router.push({ pathname: '/habit/form', params: { id } })}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <IconBox icon={habit.icon} color={tokens.fg} bg={tokens.bg} size={64} rounded={20} iconSize={32} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row style={{ gap: 6 }}>
            <Icon name="flame" color={colors.textBrand} size={22} />
            <Text variant="h1">{t('habitDetail.days', { count: streak })}</Text>
          </Row>
          <Text variant="caption" color="textSecondary">
            {t('habitDetail.currentStreak')}
            {habit.reminderTime ? ` · ${habit.reminderTime}` : ''}
          </Text>
        </View>
      </Card>

      <Row style={{ gap: 10, alignItems: 'stretch' }}>
        <Stat label={t('habitDetail.longest')} value={t('habitDetail.days', { count: best })} />
        <Stat
          label={isCurrentMonth ? t('habitDetail.thisMonth') : formatMonthYear(month.y, month.m, language)}
          value={rate == null ? '—' : `${Math.round(rate * 100)}%`}
          tone="success"
        />
        <Stat label={t('habitDetail.total')} value={t('habitDetail.times', { count: totalDone })} />
      </Row>

      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={10}>
            <Icon name="chevron-left" color={colors.textSecondary} size={20} />
          </Pressable>
          <Text variant="bodyStrong">{formatMonthYear(month.y, month.m, language)}</Text>
          <Pressable onPress={() => !isCurrentMonth && shiftMonth(1)} hitSlop={10} disabled={isCurrentMonth}>
            <Icon name="chevron-right" color={isCurrentMonth ? colors.borderDefault : colors.textSecondary} size={20} />
          </Pressable>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          {WEEKDAYS_SHORT[language].map((d) => (
            <Text key={d} variant="label" color="textSecondary" style={{ width: 38, textAlign: 'center' }}>
              {d}
            </Text>
          ))}
        </Row>
        {weeks.map((week, w) => (
          <Row key={w} style={{ justifyContent: 'space-between' }}>
            {week.map((iso, i) => {
              if (!iso) return <View key={i} style={{ width: 38, height: 38 }} />;
              const s = dayState(habit, iso, logs, todayIso);
              const st = stateStyle(s);
              return (
                <Pressable
                  key={iso}
                  onPress={() => cycleDay(iso)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: st.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: iso === todayIso ? 2.5 : 0,
                    borderColor: colors.accentBrand,
                  }}>
                  <Text variant="caption" style={{ color: st.fg }}>
                    {Number(iso.slice(8))}
                  </Text>
                </Pressable>
              );
            })}
          </Row>
        ))}
        <Row style={{ gap: 14, paddingTop: 4, flexWrap: 'wrap' }}>
          <Legend color={colors.accentSuccess} label={t('habitDetail.legendDone')} />
          <Legend color={colors.accentDanger} label={t('habitDetail.legendMissed')} />
          <Legend color={colors.track} label={t('habitDetail.legendSkipped')} />
        </Row>
        <Text variant="caption" color="textSecondary">
          {t('habitDetail.tapHint')}
        </Text>
      </Card>

      <Card bg="bgBrandSubtle" style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
        <Foxy mood={streak > 0 ? 'happy' : 'normal'} size={48} />
        <Text variant="caption" style={{ flex: 1 }}>
          {tip}
        </Text>
      </Card>

      <Row>
        <Button
          label={t('habitDetail.archive')}
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() =>
            Alert.alert(t('habitDetail.archiveTitle'), t('habitDetail.archiveText'), [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('habitDetail.archive'),
                onPress: () => {
                  archiveHabit(habitId);
                  syncReminders();
                  router.back();
                },
              },
            ])
          }
        />
        <Button
          label={t('habitDetail.delete')}
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() =>
            Alert.alert(t('habitDetail.deleteTitle'), t('habitDetail.deleteText'), [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => {
                  router.back();
                  deleteHabit(habitId);
                  syncReminders();
                },
              },
            ])
          }
        />
      </Row>
    </DetailScreen>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <Card bg={tone === 'success' ? 'bgSuccessSubtle' : 'bgSurfaceAlt'} style={{ flex: 1, gap: 2, padding: 12 }}>
      <Text variant="h3" color={tone === 'success' ? 'accentSuccess' : 'textPrimary'} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row style={{ gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </Row>
  );
}
