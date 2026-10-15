import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { DetailScreen } from '@/components/controls';
import { Button, TextField } from '@/components/form';
import { Foxy } from '@/components/Foxy';
import { formatGoalNumber, useGoalStatusText } from '@/components/GoalCard';
import { Icon } from '@/components/Icon';
import { Card, IconBox, ProgressBar, Row, Text } from '@/components/ui';
import {
  addGoalEntry,
  addGoalStep,
  deleteGoal,
  deleteGoalEntry,
  deleteGoalStep,
  getGoal,
  getGoalEntries,
  getGoalSteps,
  toggleGoalStep,
  type Goal,
} from '@/db/goals';
import { useDbQuery } from '@/db/useDbQuery';
import { daysBetween, today } from '@/lib/dates';
import { formatRelativeDate } from '@/lib/format-date';
import { sanitizeAmountInput } from '@/lib/money';
import { celebrateGoal } from '@/services/habit-actions';
import { useSettings } from '@/store/settings';
import { spacing, useTheme } from '@/theme';

/** Figma: "14 · Məqsəd detalı" */
export default function GoalDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = Number(id);
  const goal = useDbQuery(() => getGoal(goalId));

  if (!goal) return <DetailScreen title="">{null}</DetailScreen>;

  const confirmDelete = () =>
    Alert.alert(t('goalDetail.deleteTitle'), t('goalDetail.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteGoal(goalId);
        },
      },
    ]);

  return (
    <DetailScreen
      title={t('goalDetail.title')}
      rightIcon="pencil"
      onRightPress={() => router.push({ pathname: '/goal/form', params: { id } })}
      footer={<Button label={t('common.delete')} variant="secondary" onPress={confirmDelete} />}>
      <Hero goal={goal} />
      {goal.type === 'numeric' ? <NumericSection goal={goal} /> : <StepsSection goal={goal} />}
    </DetailScreen>
  );
}

function Hero({ goal }: { goal: Goal }) {
  const { t } = useTranslation();
  const status = useGoalStatusText(goal);
  const done = !!goal.completedAt;
  const remaining = goal.target - goal.current;
  const daysLeft = goal.deadline ? daysBetween(today(), goal.deadline) : null;
  const perDay = goal.type === 'numeric' && !done && daysLeft != null && daysLeft > 0 && remaining > 0 ? remaining / daysLeft : null;

  return (
    <>
      <Card style={{ alignItems: 'center', gap: 10, paddingTop: 20 }}>
        <Foxy mood={done ? 'happy' : goal.progress >= 0.5 ? 'happy' : 'normal'} size={88} />
        <Text variant="h2" style={{ textAlign: 'center' }}>
          {goal.name}
        </Text>
        <Text variant="caption" color={status.tone}>
          {status.text}
        </Text>
        <Text variant="display" color={done ? 'accentSuccess' : 'textBrand'}>
          {Math.round(goal.progress * 100)}%
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          <ProgressBar value={goal.progress} color={done ? 'accentSuccess' : 'accentBrand'} height={12} />
        </View>
        <Row style={{ justifyContent: 'space-between', alignSelf: 'stretch' }}>
          <Text variant="bodyStrong">
            {goal.type === 'steps'
              ? t('goals.stepsProgress', { done: goal.current, total: goal.total })
              : `${formatGoalNumber(goal.current)} ${goal.unit ?? ''}`}
          </Text>
          {goal.type === 'numeric' ? (
            <Text variant="bodyStrong" color="textSecondary">
              {`${formatGoalNumber(goal.target)} ${goal.unit ?? ''}`}
            </Text>
          ) : null}
        </Row>
      </Card>
      {perDay != null ? (
        <Card bg="bgSuccessSubtle" style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
          <IconBox icon="sparkle" color="accentSuccess" bg="bgSuccessSubtle" size={28} iconSize={20} />
          <Text variant="caption" style={{ flex: 1 }}>
            {t('goalDetail.perDay', { amount: formatGoalNumber(Math.ceil(perDay * 10) / 10), unit: goal.unit ?? '' })}
          </Text>
        </Card>
      ) : null}
    </>
  );
}

function NumericSection({ goal }: { goal: Goal }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const entries = useDbQuery(() => getGoalEntries(goal.id));
  const [amount, setAmount] = useState('');

  const add = () => {
    const n = parseFloat(amount.replace(',', '.'));
    if (!(n > 0)) return;
    const completed = addGoalEntry(goal.id, n);
    setAmount('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (completed) celebrateGoal(goal.name);
  };

  return (
    <>
      <Text variant="h3">{t('goalDetail.addAmount')}</Text>
      <Row style={{ gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TextField
            value={amount}
            onChange={(v) => setAmount(sanitizeAmountInput(v))}
            keyboardType="decimal-pad"
            placeholder={t('goalDetail.amountPlaceholder')}
            suffix={goal.unit ?? undefined}
          />
        </View>
        <Button label={t('goalDetail.add')} icon="plus" onPress={add} />
      </Row>

      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="h3">{t('goalDetail.entries')}</Text>
        {entries.length > 0 ? (
          <Text variant="caption" color="textSecondary">
            {t('goalDetail.holdHint')}
          </Text>
        ) : null}
      </Row>
      <Card style={{ gap: 14 }}>
        {entries.length === 0 ? (
          <Text color="textSecondary">{t('goalDetail.noEntries')}</Text>
        ) : (
          entries.map((e) => (
            <Pressable
              key={e.id}
              onLongPress={() =>
                Alert.alert(t('goalDetail.deleteEntryTitle'), `${formatGoalNumber(e.amount)} ${goal.unit ?? ''}`, [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('common.delete'), style: 'destructive', onPress: () => deleteGoalEntry(goal.id, e.id) },
                ])
              }>
              <Row>
                <IconBox icon="coins" color="textBrand" bg="bgBrandSubtle" size={36} rounded={10} iconSize={18} />
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {formatRelativeDate(e.date, language, { today: t('form.today'), yesterday: t('form.yesterday') })}
                </Text>
                <Text variant="bodyStrong" style={{ color: colors.accentSuccess }}>
                  +{formatGoalNumber(e.amount)} {goal.unit ?? ''}
                </Text>
              </Row>
            </Pressable>
          ))
        )}
      </Card>
    </>
  );
}

function StepsSection({ goal }: { goal: Goal }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const steps = useDbQuery(() => getGoalSteps(goal.id));
  const [newStep, setNewStep] = useState('');

  const toggle = (stepId: number, done: boolean) => {
    const completed = toggleGoalStep(goal.id, stepId, done);
    Haptics.selectionAsync();
    if (completed) celebrateGoal(goal.name);
  };

  return (
    <>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="h3">{t('goalDetail.steps')}</Text>
        <Text variant="caption" color="textSecondary">
          {t('goalDetail.holdHint')}
        </Text>
      </Row>
      <Card style={{ gap: 14 }}>
        {steps.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => toggle(s.id, !s.done)}
            onLongPress={() =>
              Alert.alert(s.title, undefined, [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: () => deleteGoalStep(goal.id, s.id) },
              ])
            }>
            <Row>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: s.done ? colors.accentSuccess : 'transparent',
                  borderWidth: s.done ? 0 : 2,
                  borderColor: colors.borderDefault,
                }}>
                {s.done && <Icon name="check" color={colors.textOnBrand} size={16} />}
              </View>
              <Text
                style={{ flex: 1, textDecorationLine: s.done ? 'line-through' : 'none' }}
                color={s.done ? 'textSecondary' : 'textPrimary'}>
                {s.title}
              </Text>
            </Row>
          </Pressable>
        ))}
        <Row style={{ gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <TextField value={newStep} onChange={setNewStep} placeholder={t('goalForm.stepPlaceholder')} />
          </View>
          <Pressable
            onPress={() => {
              if (!newStep.trim()) return;
              addGoalStep(goal.id, newStep.trim());
              setNewStep('');
            }}
            style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.bgBrandSubtle, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" color={colors.textBrand} size={22} />
          </Pressable>
        </Row>
      </Card>
    </>
  );
}
