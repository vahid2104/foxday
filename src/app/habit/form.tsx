import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { Segment, Stepper, Toggle } from '@/components/controls';
import { Field, FormScreen, TextField, TimeField } from '@/components/form';
import { HABIT_COLOR_SOLID, HABIT_COLOR_TOKENS } from '@/components/habit-meta';
import { Icon } from '@/components/Icon';
import { Card, IconBox, Row, Text } from '@/components/ui';
import { addHabit, getHabit, HABIT_COLORS, HABIT_ICONS, updateHabit, type HabitColor } from '@/db/habits';
import { WEEKDAYS_SHORT } from '@/lib/format-date';
import type { HabitFrequency } from '@/lib/habits';
import { syncReminders } from '@/services/notifications';
import { useSettings } from '@/store/settings';
import { spacing, useTheme } from '@/theme';

/** Figma: "11 · Vərdiş yarat" (həm də redaktə). */
export default function HabitFormScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getHabit(Number(id)) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? HABIT_ICONS[0]);
  const [color, setColor] = useState<HabitColor>(existing?.color ?? 'brand');
  const [frequency, setFrequency] = useState<HabitFrequency>(existing?.frequency ?? 'daily');
  const [days, setDays] = useState<number[]>(existing?.days.length ? existing.days : [0, 1, 2, 3, 4, 5, 6]);
  const [timesPerWeek, setTimesPerWeek] = useState(existing?.timesPerWeek ?? 3);
  const [reminderOn, setReminderOn] = useState(!!existing?.reminderTime);
  const [reminder, setReminder] = useState<string | null>(existing?.reminderTime ?? '08:00');

  const toggleDay = (d: number) => setDays((list) => (list.includes(d) ? list.filter((x) => x !== d) : [...list, d].sort()));

  const save = () => {
    if (!name.trim()) return Alert.alert('⚠️', t('habitForm.nameRequired'));
    if (frequency === 'days' && days.length === 0) return Alert.alert('⚠️', t('habitForm.daysRequired'));
    const input = {
      name: name.trim(),
      icon,
      color,
      frequency,
      days: frequency === 'days' ? days : [0, 1, 2, 3, 4, 5, 6],
      timesPerWeek,
      reminderTime: reminderOn ? reminder : null,
    };
    if (existing) updateHabit(existing.id, input);
    else addHabit(input);
    syncReminders();
    router.back();
  };

  const tokens = HABIT_COLOR_TOKENS[color];

  return (
    <FormScreen
      title={existing ? t('habitForm.editTitle') : t('habitForm.newTitle')}
      saveLabel={existing ? t('common.save') : t('habitForm.create')}
      onSave={save}>
      <Row style={{ justifyContent: 'center', paddingTop: spacing.sm }}>
        <IconBox icon={icon} color={tokens.fg} bg={tokens.bg} size={72} rounded={22} iconSize={34} />
      </Row>

      <Field label={t('habitForm.name')}>
        <TextField value={name} onChange={setName} placeholder={t('habitForm.namePlaceholder')} />
      </Field>

      <Field label={t('habitForm.icon')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {HABIT_ICONS.map((i) => {
            const active = i === icon;
            return (
              <Pressable
                key={i}
                onPress={() => setIcon(i)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors[tokens.bg] : colors.bgSurface,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? colors[HABIT_COLOR_SOLID[color]] : colors.borderDefault,
                }}>
                <Icon name={i} color={active ? colors[tokens.fg] : colors.textSecondary} size={22} />
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label={t('habitForm.color')}>
        <Row style={{ gap: 14 }}>
          {HABIT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors[HABIT_COLOR_SOLID[c]],
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {c === color && <Icon name="check" color="#FFFFFF" size={18} />}
            </Pressable>
          ))}
        </Row>
      </Field>

      <Field label={t('habitForm.frequency')}>
        <Segment
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: 'daily', label: t('habitForm.daily') },
            { value: 'days', label: t('habitForm.selectedDays') },
            { value: 'weekly', label: t('habitForm.weekly') },
          ]}
        />
      </Field>

      {frequency === 'weekly' ? (
        <Card style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="bodyStrong">{t('habitForm.timesPerWeek')}</Text>
            <Stepper
              value={timesPerWeek}
              onChange={setTimesPerWeek}
              step={1}
              min={1}
              max={6}
              format={(v) => t('habitForm.times', { count: v })}
            />
          </Row>
          <Text variant="caption" color="textSecondary">
            {t('habitForm.weeklyHint')}
          </Text>
        </Card>
      ) : null}

      {frequency === 'days' ? (
        <Row style={{ justifyContent: 'space-between' }}>
          {WEEKDAYS_SHORT[language].map((d, i) => {
            const active = days.includes(i);
            return (
              <Pressable
                key={d}
                onPress={() => toggleDay(i)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.bgBrand : colors.bgSurface,
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.borderDefault,
                }}>
                <Text variant="label" style={{ color: active ? colors.textOnBrand : colors.textSecondary }}>
                  {d}
                </Text>
              </Pressable>
            );
          })}
        </Row>
      ) : null}

      <Card style={{ gap: spacing.md }}>
        <Row>
          <Icon name="bell" color={colors.textPrimary} size={20} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{t('habitForm.reminder')}</Text>
            <Text variant="caption" color="textSecondary">
              {reminderOn && reminder ? t('habitForm.reminderAt', { time: reminder }) : t('habitForm.reminderOff')}
            </Text>
          </View>
          <Toggle value={reminderOn} onChange={setReminderOn} />
        </Row>
        {reminderOn ? <TimeField value={reminder} onChange={setReminder} /> : null}
      </Card>
    </FormScreen>
  );
}
