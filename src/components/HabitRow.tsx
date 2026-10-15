import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { HABIT_COLOR_TOKENS } from '@/components/habit-meta';
import { Icon } from '@/components/Icon';
import { IconBox, Text } from '@/components/ui';
import type { HabitWithToday } from '@/db/habits';
import { setTodayHabit } from '@/services/habit-actions';
import { spacing, useTheme } from '@/theme';

/**
 * Vərdiş sətri (Figma: "Habit Row").
 * Toxun → etdim / geri al. Basıb saxla → keç, detallar.
 */
export function HabitRow({ habit }: { habit: HabitWithToday }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const done = habit.todayStatus === 'done';
  const skipped = habit.todayStatus === 'skipped';
  const tokens = HABIT_COLOR_TOKENS[habit.color];
  const scale = useSharedValue(1);
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const toggle = () => {
    if (!done) scale.set(withSequence(withSpring(1.35, { damping: 6 }), withSpring(1)));
    setTodayHabit(habit.id, done ? null : 'done');
  };

  const actions = () => {
    Alert.alert(habit.name, undefined, [
      done || skipped
        ? { text: t('habits.undo'), onPress: () => setTodayHabit(habit.id, null) }
        : { text: t('habits.skip'), onPress: () => setTodayHabit(habit.id, 'skipped') },
      { text: t('habits.details'), onPress: () => router.push(`/habit/${habit.id}`) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const weekly = habit.frequency === 'weekly';
  const streakText = habit.streak > 0 ? t(weekly ? 'habits.streakWeeks' : 'habits.streakDays', { count: habit.streak }) : null;
  const subtitle = skipped
    ? t('habits.skipped')
    : weekly
      ? [t('habits.weekCount', { done: habit.weekDone, target: habit.timesPerWeek }), streakText].filter(Boolean).join(' · ')
      : (streakText ?? t('habits.startToday'));

  return (
    <Pressable onPress={toggle} onLongPress={actions} delayLongPress={350}>
      <View style={[styles.row, { backgroundColor: colors.bgSurface, opacity: skipped ? 0.6 : 1 }]}>
        <IconBox icon={habit.icon} color={tokens.fg} bg={tokens.bg} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {habit.name}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Animated.View
          style={[
            styles.check,
            checkStyle,
            done
              ? { backgroundColor: colors.accentSuccess }
              : skipped
                ? { backgroundColor: colors.track }
                : { borderWidth: 2, borderColor: colors.borderDefault },
          ]}>
          {done && <Icon name="check" color={colors.textOnBrand} size={18} />}
          {skipped && <Text variant="label" color="textSecondary">—</Text>}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
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
