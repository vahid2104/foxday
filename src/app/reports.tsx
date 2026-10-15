import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { DetailScreen, Segment } from '@/components/controls';
import { Icon } from '@/components/Icon';
import { PLATFORM_COLORS } from '@/components/money-meta';
import { Card, IconBox, ProgressBar, Row, Text } from '@/components/ui';
import { getAllLogs, getHabits } from '@/db/habits';
import { getKcalByDay, getMoodAverage, MOOD_EMOJI, type Mood } from '@/db/food';
import { getSleepRange, getWaterByDay } from '@/db/health';
import { getExpenseByCategory, getPlatformSplit, getRangeTotals } from '@/db/money';
import { useDbQuery } from '@/db/useDbQuery';
import { addDays, daysBetween, monthRange, startOfWeek, today } from '@/lib/dates';
import { formatMonthYear, formatShortDate, splitMinutes } from '@/lib/format-date';
import { completionRate, dayState } from '@/lib/habits';
import { formatAmount, formatMoney } from '@/lib/money';
import { useSettings } from '@/store/settings';
import { radius, spacing, useTheme } from '@/theme';

/** Figma: "15 · Hesabat" */
export default function ReportsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const [mode, setMode] = useState<'week' | 'month'>('month');
  const [offset, setOffset] = useState(0);

  const todayIso = today();
  let from: string;
  let to: string;
  let title: string;
  if (mode === 'week') {
    from = addDays(startOfWeek(todayIso), offset * 7);
    to = addDays(from, 6);
    title = `${formatShortDate(from, language)} – ${formatShortDate(to, language)}`;
  } else {
    const d = new Date();
    const m = new Date(d.getFullYear(), d.getMonth() + offset, 1);
    ({ from, to } = monthRange(m.getFullYear(), m.getMonth()));
    title = formatMonthYear(m.getFullYear(), m.getMonth(), language);
  }

  return (
    <DetailScreen title={t('reports.title')}>
      <Segment
        value={mode}
        onChange={(v) => {
          setMode(v);
          setOffset(0);
        }}
        options={[
          { value: 'week', label: t('reports.week') },
          { value: 'month', label: t('reports.month') },
        ]}
      />
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => setOffset(offset - 1)} hitSlop={10}>
          <Icon name="chevron-left" color={colors.textSecondary} size={22} />
        </Pressable>
        <Text variant="h3">{title}</Text>
        <Pressable onPress={() => offset < 0 && setOffset(offset + 1)} hitSlop={10} disabled={offset >= 0}>
          <Icon name="chevron-right" color={offset >= 0 ? colors.borderDefault : colors.textSecondary} size={22} />
        </Pressable>
      </Row>
      <MoneyReport from={from} to={to} />
      <HabitReport from={from} to={to} />
      <HealthReport from={from} to={to} />
    </DetailScreen>
  );
}

function SectionHead({ icon, color, bg, title, right }: { icon: 'wallet' | 'target' | 'heart'; color: 'textBrand' | 'accentSuccess' | 'accentSleep'; bg: 'bgBrandSubtle' | 'bgSuccessSubtle' | 'bgSleepSubtle'; title: string; right?: string }) {
  return (
    <Row>
      <IconBox icon={icon} color={color} bg={bg} size={36} rounded={10} />
      <Text variant="h3" style={{ flex: 1 }}>
        {title}
      </Text>
      {right ? (
        <Text variant="h2" color={color}>
          {right}
        </Text>
      ) : null}
    </Row>
  );
}

function Mini({ label, value, color, bg }: { label: string; value: string; color: 'accentSuccess' | 'accentDanger' | 'textBrand' | 'accentSleep' | 'accentWater'; bg: string }) {
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: radius.md + 2, backgroundColor: bg, gap: 2 }}>
      <Text variant="h3" color={color} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

function MoneyReport({ from, to }: { from: string; to: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const totals = useDbQuery(() => getRangeTotals(from, to));
  const split = useDbQuery(() => getPlatformSplit(from, to));
  const cats = useDbQuery(() => getExpenseByCategory(from, to));
  const totalSplit = split.reduce((a, s) => a + s.pln, 0) || 1;
  const maxCat = Math.max(1, ...cats.map((c) => c.pln));

  return (
    <Card>
      <SectionHead icon="wallet" color="textBrand" bg="bgBrandSubtle" title={t('reports.money')} />
      {totals.income === 0 && totals.expense === 0 ? (
        <Text color="textSecondary">{t('reports.noData')}</Text>
      ) : (
        <>
          <Row style={{ gap: spacing.sm }}>
            <Mini label={t('money.income')} value={formatAmount(totals.income)} color="accentSuccess" bg={colors.bgSuccessSubtle} />
            <Mini label={t('money.expense')} value={formatAmount(totals.expense)} color="accentDanger" bg={colors.bgDangerSubtle} />
            <Mini label="PLN" value={formatAmount(totals.net)} color="textBrand" bg={colors.bgBrandSubtle} />
          </Row>
          {totals.minutes > 0 ? (
            <Text variant="caption" color="textSecondary">
              {t('reports.workTime')}: {t('common.hoursMinutes', splitMinutes(totals.minutes))}
            </Text>
          ) : null}
          {split.length > 0 ? (
            <>
              <Text variant="caption" color="textSecondary">
                {t('money.platforms')}
              </Text>
              <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 3 }}>
                {split.map((s) => (
                  <View key={s.platform} style={{ flex: s.pln / totalSplit, backgroundColor: colors[PLATFORM_COLORS[s.platform]] }} />
                ))}
              </View>
              <Row style={{ flexWrap: 'wrap', gap: spacing.lg }}>
                {split.map((s) => (
                  <Text key={s.platform} variant="caption">
                    {t(`platforms.${s.platform}`)} · {Math.round((s.pln / totalSplit) * 100)}%
                  </Text>
                ))}
              </Row>
            </>
          ) : null}
          {cats.length > 0 ? (
            <>
              <Text variant="caption" color="textSecondary">
                {t('reports.categories')}
              </Text>
              {cats.map((c) => (
                <View key={c.category} style={{ gap: 4 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text variant="bodyStrong">{t(`categories.${c.category}`)}</Text>
                    <Text variant="caption" color="textSecondary">
                      {formatMoney(c.pln)}
                    </Text>
                  </Row>
                  <ProgressBar value={c.pln / maxCat} color="accentDanger" height={6} />
                </View>
              ))}
            </>
          ) : null}
        </>
      )}
    </Card>
  );
}

function HabitReport({ from, to }: { from: string; to: string }) {
  const { t } = useTranslation();
  const todayIso = today();
  const habits = useDbQuery(() => getHabits(true));
  const logs = useDbQuery(() => getAllLogs(from, to));

  let due = 0;
  let done = 0;
  const end = to < todayIso ? to : todayIso;
  for (const h of habits) {
    for (let d = from; d <= end; d = addDays(d, 1)) {
      const s = dayState(h, d, logs[h.id] ?? {}, todayIso);
      if (s === 'done') {
        due++;
        done++;
      } else if (s === 'missed') due++;
    }
  }
  const rates = habits
    .map((h) => ({ h, r: completionRate(h, logs[h.id] ?? {}, from, to, todayIso) }))
    .filter((x): x is { h: (typeof habits)[number]; r: number } => x.r != null)
    .sort((a, b) => b.r - a.r);

  return (
    <Card>
      <SectionHead
        icon="target"
        color="accentSuccess"
        bg="bgSuccessSubtle"
        title={t('reports.habits')}
        right={due > 0 ? `${Math.round((done / due) * 100)}%` : undefined}
      />
      {rates.length === 0 ? (
        <Text color="textSecondary">{t('reports.noData')}</Text>
      ) : (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ flex: 1 }}>{t('reports.best', { name: rates[0].h.name })}</Text>
            <Text variant="bodyStrong" color="accentSuccess">
              {Math.round(rates[0].r * 100)}%
            </Text>
          </Row>
          {rates.length > 1 ? (
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ flex: 1 }}>{t('reports.worst', { name: rates[rates.length - 1].h.name })}</Text>
              <Text variant="bodyStrong" color="accentDanger">
                {Math.round(rates[rates.length - 1].r * 100)}%
              </Text>
            </Row>
          ) : null}
        </>
      )}
    </Card>
  );
}

function HealthReport({ from, to }: { from: string; to: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const todayIso = today();
  const sleep = useDbQuery(() => getSleepRange(from, to));
  const water = useDbQuery(() => getWaterByDay(from, to));
  const avgSleep = sleep.length ? Math.round(sleep.reduce((a, s) => a + s.durationMin, 0) / sleep.length) : null;
  const end = to < todayIso ? to : todayIso;
  const days = Math.max(1, daysBetween(from, end) + 1);
  const totalWater = Object.values(water).reduce((a, b) => a + b, 0);
  const avgWater = totalWater > 0 ? totalWater / days : null;
  const mood = useDbQuery(() => getMoodAverage(from, to));
  const kcalDays = Object.values(useDbQuery(() => getKcalByDay(from, to)));
  const avgKcal = kcalDays.length ? Math.round(kcalDays.reduce((a, b) => a + b, 0) / kcalDays.length) : null;

  return (
    <Card>
      <SectionHead icon="heart" color="accentSleep" bg="bgSleepSubtle" title={t('reports.health')} />
      {avgSleep == null && avgWater == null && mood == null && avgKcal == null ? (
        <Text color="textSecondary">{t('reports.noData')}</Text>
      ) : (
        <>
        <Row style={{ gap: spacing.sm }}>
          <Mini
            label={t('reports.avgSleep')}
            value={avgSleep != null ? t('common.hoursMinutes', splitMinutes(avgSleep)) : '—'}
            color="accentSleep"
            bg={colors.bgSleepSubtle}
          />
          <Mini
            label={t('reports.avgWater')}
            value={avgWater != null ? `${(avgWater / 1000).toFixed(1).replace('.', ',')} L` : '—'}
            color="accentWater"
            bg={colors.bgWaterSubtle}
          />
        </Row>
        <Row style={{ gap: spacing.sm }}>
          <Mini
            label={t('reports.avgMood')}
            value={mood != null ? `${MOOD_EMOJI[Math.round(mood) as Mood]} ${mood.toFixed(1).replace('.', ',')}` : '—'}
            color="textBrand"
            bg={colors.bgBrandSubtle}
          />
          <Mini label={t('reports.avgKcal')} value={avgKcal != null ? `${avgKcal} kcal` : '—'} color="textBrand" bg={colors.bgBrandSubtle} />
        </Row>
        </>
      )}
    </Card>
  );
}
