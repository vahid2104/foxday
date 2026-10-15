import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/form';
import { Foxy } from '@/components/Foxy';
import { Icon } from '@/components/Icon';
import { CATEGORY_ICONS, PLATFORM_COLORS } from '@/components/money-meta';
import { SubscriptionRow } from '@/components/SubscriptionRow';
import { Card, IconBox, ProgressBar, Row, Screen, Text } from '@/components/ui';
import {
  deleteTransaction,
  getDailyIncome,
  getPlatformSplit,
  getRangeTotals,
  getTransactions,
  type ExpenseCategory,
  type Platform,
  type Transaction,
} from '@/db/money';
import { getSubscriptions } from '@/db/subscriptions';
import { useDbQuery } from '@/db/useDbQuery';
import { addDays, monthRange, startOfWeek, today } from '@/lib/dates';
import { formatMonthYear, formatRelativeDate, splitMinutes, WEEKDAYS_SHORT } from '@/lib/format-date';
import { formatAmount, formatMoney, hourlyRate } from '@/lib/money';
import { useSettings } from '@/store/settings';
import { radius, spacing, useTheme } from '@/theme';

/** Figma: "02 · Pul" */
export default function MoneyScreen() {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  const monthlyGoal = useSettings((s) => s.monthlyIncomeGoal);
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const isCurrentMonth = month.y === now.getFullYear() && month.m === now.getMonth();
  const { from, to } = monthRange(month.y, month.m);

  const totals = useDbQuery(() => getRangeTotals(from, to));
  const split = useDbQuery(() => getPlatformSplit(from, to));
  const txs = useDbQuery(() => getTransactions(from, to, 100));

  const shiftMonth = (delta: number) => {
    const d = new Date(month.y, month.m + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
    Haptics.selectionAsync();
  };

  const perHour = hourlyRate(totals.income, totals.minutes);
  const monthName = formatMonthYear(month.y, month.m, language).split(' ')[0].replace(/i/g, language === 'az' ? 'İ' : 'i').toUpperCase();

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="h1">{t('tabs.money')}</Text>
        <Row style={{ gap: spacing.xs }}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={10}>
            <MonthArrow dir="left" />
          </Pressable>
          <Text variant="bodyStrong" style={{ minWidth: 112, textAlign: 'center' }}>
            {formatMonthYear(month.y, month.m, language)}
          </Text>
          <Pressable onPress={() => !isCurrentMonth && shiftMonth(1)} hitSlop={10} disabled={isCurrentMonth}>
            <MonthArrow dir="right" disabled={isCurrentMonth} />
          </Pressable>
        </Row>
      </Row>

      <Row>
        <Button label={t('money.addIncome')} icon="plus" onPress={() => router.push('/income/new')} style={{ flex: 1 }} />
        <Button
          label={t('money.addExpense')}
          icon="arrow-down-left"
          variant="secondary"
          onPress={() => router.push('/expense/new')}
          style={{ flex: 1 }}
        />
      </Row>

      {isCurrentMonth ? <SubscriptionsCard /> : null}

      {txs.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Foxy mood="normal" size={96} />
          <Text variant="h3">{t('money.emptyTitle')}</Text>
          <Text color="textSecondary" style={{ textAlign: 'center' }}>
            {t('money.emptyText')}
          </Text>
        </Card>
      ) : (
        <>
          <Card style={{ gap: 4 }}>
            <Text variant="label" color="textSecondary">
              {t('money.netLabel', { month: monthName })}
            </Text>
            <Row style={{ gap: 6, alignItems: 'baseline' }}>
              <Text variant="display">{formatAmount(totals.net)}</Text>
              <Text variant="h3" color="textSecondary">
                PLN
              </Text>
            </Row>
            {isCurrentMonth && monthlyGoal > 0 ? (
              <View style={{ gap: 6, marginTop: 4 }}>
                <ProgressBar value={totals.income / (monthlyGoal * 100)} />
                <Text variant="caption" color="textSecondary">
                  {t('money.goal', { amount: formatMoney(monthlyGoal * 100) })} ·{' '}
                  {Math.round((totals.income / (monthlyGoal * 100)) * 100)}%
                </Text>
              </View>
            ) : null}
            <Row style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <MiniStat label={t('money.income')} value={`+${formatAmount(totals.income)}`} tone="success" />
              <MiniStat label={t('money.expense')} value={formatAmount(-totals.expense)} tone="danger" />
              <MiniStat label={t('money.perHour')} value={perHour != null ? formatAmount(perHour) : '—'} tone="brand" />
            </Row>
          </Card>

          {isCurrentMonth ? <WeekChart weeklyGoal={Math.round((monthlyGoal * 100 * 12) / 52)} /> : null}

          {split.length > 0 ? <PlatformSplit split={split} /> : null}

          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="h3">{t('money.transactions')}</Text>
            <Text variant="caption" color="textSecondary">
              {t('money.deleteHint')}
            </Text>
          </Row>
          <Card style={{ gap: 14 }}>
            {txs.map((tx) => (
              <TransactionRow key={`${tx.kind}-${tx.id}`} tx={tx} />
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

/** Abunəliklər: ən təcili 3-ü + "Hamısı". */
function SubscriptionsCard() {
  const { t } = useTranslation();
  const subs = useDbQuery(() => getSubscriptions());
  return (
    <Card style={{ gap: 14 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ gap: 8 }}>
          <IconBox icon="refresh" color="textBrand" bg="bgBrandSubtle" size={32} rounded={10} iconSize={16} />
          <Text variant="h3">{t('subs.title')}</Text>
        </Row>
        <Pressable onPress={() => router.push(subs.length ? '/subscriptions' : '/subscription/form')} hitSlop={8}>
          <Text variant="bodyStrong" color="textBrand">
            {subs.length ? t('subs.seeAll') : `+ ${t('subs.add')}`}
          </Text>
        </Pressable>
      </Row>
      {subs.length === 0 ? (
        <Text variant="caption" color="textSecondary">
          {t('subs.emptyText')}
        </Text>
      ) : (
        subs
          .slice(0, 3)
          .map((s) => (
            <SubscriptionRow key={s.id} sub={s} onPress={() => router.push({ pathname: '/subscription/form', params: { id: String(s.id) } })} />
          ))
      )}
    </Card>
  );
}

function MonthArrow({ dir, disabled }: { dir: 'left' | 'right'; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Icon
      name={dir === 'left' ? 'chevron-left' : 'chevron-right'}
      color={disabled ? colors.borderDefault : colors.textSecondary}
      size={20}
    />
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: 'success' | 'danger' | 'brand' }) {
  const { colors } = useTheme();
  const map = {
    success: [colors.bgSuccessSubtle, 'accentSuccess'],
    danger: [colors.bgDangerSubtle, 'accentDanger'],
    brand: [colors.bgBrandSubtle, 'textBrand'],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.mini, { backgroundColor: bg }]}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyStrong" color={fg} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function WeekChart({ weeklyGoal }: { weeklyGoal: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const todayIso = today();
  const monday = startOfWeek(todayIso);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const daily = useDbQuery(() => getDailyIncome(days[0], days[6]));
  const values = days.map((d) => daily[d] ?? 0);
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(...values, 1);

  return (
    <Card style={{ gap: spacing.lg }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Text variant="caption" color="textSecondary">
            {t('money.thisWeek')}
          </Text>
          <Text variant="h3">{formatMoney(total)}</Text>
        </View>
        {weeklyGoal > 0 ? (
          <Text variant="caption" color="textBrand">
            {t('money.goal', { amount: formatAmount(weeklyGoal) })}
          </Text>
        ) : null}
      </Row>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {days.map((d, i) => {
          const v = values[i];
          const isToday = d === todayIso;
          const future = d > todayIso;
          return (
            <View key={d} style={{ alignItems: 'center', gap: 6, width: 36 }}>
              {v > 0 ? (
                <Text variant="label" color={isToday ? 'textBrand' : 'textSecondary'} numberOfLines={1}>
                  {Math.round(v / 100)}
                </Text>
              ) : null}
              <View
                style={{
                  width: 28,
                  height: v > 0 ? Math.max(10, Math.round((v / max) * 100)) : 8,
                  borderRadius: 8,
                  backgroundColor: v > 0 ? colors.accentBrand : colors.track,
                  opacity: v > 0 && !isToday ? 0.35 : future ? 0.6 : 1,
                }}
              />
              <Text variant="label" color={isToday ? 'textBrand' : 'textSecondary'}>
                {WEEKDAYS_SHORT[language][i]}
              </Text>
            </View>
          );
        })}
      </Row>
    </Card>
  );
}

function PlatformSplit({ split }: { split: { platform: Platform; pln: number }[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const total = split.reduce((a, s) => a + s.pln, 0) || 1;
  return (
    <Card>
      <Text variant="caption" color="textSecondary">
        {t('money.platforms')}
      </Text>
      <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 3 }}>
        {split.map((s) => (
          <View key={s.platform} style={{ flex: s.pln / total, backgroundColor: colors[PLATFORM_COLORS[s.platform]] }} />
        ))}
      </View>
      <Row style={{ flexWrap: 'wrap', gap: spacing.lg }}>
        {split.map((s) => (
          <Row key={s.platform} style={{ gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors[PLATFORM_COLORS[s.platform]] }} />
            <Text variant="caption">
              {t(`platforms.${s.platform}`)} · {Math.round((s.pln / total) * 100)}%
            </Text>
          </Row>
        ))}
      </Row>
    </Card>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  const income = tx.kind === 'income';
  const title = income ? t(`platforms.${tx.label as Platform}`) : t(`categories.${tx.label as ExpenseCategory}`);
  const parts = [formatRelativeDate(tx.date, language, { today: t('form.today'), yesterday: t('form.yesterday') })];
  if (income && tx.durationMin) parts.push(t('common.hoursMinutes', splitMinutes(tx.durationMin)));
  if (income && tx.orders) parts.push(t('money.ordersShort', { count: tx.orders }));
  if (tx.note) parts.push(tx.note);

  const confirmDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t('money.deleteTitle'), `${title} · ${formatMoney(tx.amountMinor, tx.currency)}\n${t('money.deleteText')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteTransaction(tx.kind, tx.id) },
    ]);
  };

  return (
    <Pressable
      onPress={() => router.push({ pathname: income ? '/income/new' : '/expense/new', params: { id: String(tx.id) } })}
      onLongPress={confirmDelete}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      {income ? (
        <IconBox icon="bike" color="textBrand" bg="bgBrandSubtle" />
      ) : (
        <IconBox icon={CATEGORY_ICONS[tx.label as ExpenseCategory] ?? 'sparkle'} color="accentDanger" bg="bgDangerSubtle" />
      )}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {parts.join(' · ')}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text variant="bodyStrong" color={income ? 'accentSuccess' : 'accentDanger'}>
          {income ? '+' : '−'}
          {formatMoney(tx.amountMinor, tx.currency)}
        </Text>
        {tx.currency !== 'PLN' ? (
          <Text variant="caption" color="textSecondary">
            ≈ {formatMoney(tx.plnMinor)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mini: {
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md + 2,
  },
});
