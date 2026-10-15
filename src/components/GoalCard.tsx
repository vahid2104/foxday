import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Card, IconBox, ProgressBar, Row, Text } from '@/components/ui';
import type { Goal } from '@/db/goals';
import { daysBetween, today } from '@/lib/dates';
import { formatShortDate } from '@/lib/format-date';
import { useSettings } from '@/store/settings';

export function formatGoalNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const [whole, frac] = String(rounded).split('.');
  const w = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return frac ? `${w},${frac}` : w;
}

/** Son tarix mətni: "48 gün qalıb" / "Vaxtı keçib" / "Tamamlandı". */
export function useGoalStatusText(goal: Goal): { text: string; tone: 'textSecondary' | 'accentDanger' | 'accentSuccess' } {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  if (goal.completedAt) return { text: t('goals.completed'), tone: 'accentSuccess' };
  if (!goal.deadline) return { text: t('goals.noDeadline'), tone: 'textSecondary' };
  const left = daysBetween(today(), goal.deadline);
  if (left < 0) return { text: t('goals.overdue'), tone: 'accentDanger' };
  if (left === 0) return { text: t('goals.dueToday'), tone: 'accentDanger' };
  return { text: `${t('goals.daysLeft', { count: left })} · ${formatShortDate(goal.deadline, language)}`, tone: 'textSecondary' };
}

/** Figma: "Goal Card" */
export function GoalCard({ goal }: { goal: Goal }) {
  const { t } = useTranslation();
  const status = useGoalStatusText(goal);
  const pct = Math.round(goal.progress * 100);
  const done = !!goal.completedAt;

  return (
    <Pressable onPress={() => router.push(`/goal/${goal.id}`)}>
      <Card style={{ gap: 10 }}>
        <Row>
          <IconBox
            icon={done ? 'check' : goal.type === 'steps' ? 'check' : 'target'}
            color={done ? 'accentSuccess' : 'textBrand'}
            bg={done ? 'bgSuccessSubtle' : 'bgBrandSubtle'}
          />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={2}>
              {goal.name}
            </Text>
            <Text variant="caption" color={status.tone}>
              {status.text}
            </Text>
          </View>
          <Text variant="h3" color={done ? 'accentSuccess' : 'textBrand'}>
            {pct}%
          </Text>
        </Row>
        <ProgressBar value={goal.progress} color={done ? 'accentSuccess' : 'accentBrand'} height={10} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="caption" color="textSecondary">
            {goal.type === 'steps'
              ? t('goals.stepsProgress', { done: goal.current, total: goal.total })
              : `${formatGoalNumber(goal.current)} ${goal.unit ?? ''}`.trim()}
          </Text>
          {goal.type === 'numeric' ? (
            <Text variant="caption" color="textSecondary">
              {`${formatGoalNumber(goal.target)} ${goal.unit ?? ''}`.trim()}
            </Text>
          ) : null}
        </Row>
      </Card>
    </Pressable>
  );
}
