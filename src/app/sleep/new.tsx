import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Stars } from '@/components/controls';
import { DateField, Field, FormScreen, TextField, TimeField } from '@/components/form';
import { Foxy } from '@/components/Foxy';
import { Card, IconBox, Row, Text } from '@/components/ui';
import { getSleep, saveSleep } from '@/db/health';
import { today } from '@/lib/dates';
import { splitMinutes } from '@/lib/format-date';
import { durationMinutes } from '@/lib/money';
import { useSettings } from '@/store/settings';
import { spacing } from '@/theme';

/** Figma: "12 · Yuxu qeydi" */
export default function SleepFormScreen() {
  const { t } = useTranslation();
  const { name, sleepGoalMin } = useSettings();
  const [date, setDate] = useState(today());
  const existing = getSleep(date);
  const [bed, setBed] = useState<string | null>(existing?.bedTime ?? '23:00');
  const [wake, setWake] = useState<string | null>(existing?.wakeTime ?? '07:00');
  const [quality, setQuality] = useState(existing?.quality ?? 4);
  const [note, setNote] = useState(existing?.note ?? '');

  const changeDate = (d: string) => {
    setDate(d);
    const e = getSleep(d);
    if (e) {
      setBed(e.bedTime);
      setWake(e.wakeTime);
      setQuality(e.quality ?? 4);
      setNote(e.note ?? '');
    }
  };

  const minutes = bed && wake ? durationMinutes(bed, wake) : 0;
  const diff = minutes - sleepGoalMin;
  const diffText =
    Math.abs(diff) < 15
      ? t('sleepForm.onGoal')
      : diff < 0
        ? t('sleepForm.lessThanGoal', { diff: t('common.hoursMinutes', splitMinutes(-diff)) })
        : t('sleepForm.moreThanGoal', { diff: t('common.hoursMinutes', splitMinutes(diff)) });

  const save = () => {
    if (!bed || !wake) return;
    saveSleep({ date, bedTime: bed, wakeTime: wake, durationMin: minutes, quality, note: note.trim() || null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <FormScreen title={t('sleepForm.title')} saveLabel={t('common.save')} onSave={save}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Foxy mood="sleepy" size={96} />
        <Text variant="h2">{t('sleepForm.question', { name })}</Text>
      </View>

      <Field label={t('form.date')}>
        <DateField value={date} onChange={changeDate} />
      </Field>

      <Row style={{ gap: spacing.md, alignItems: 'stretch' }}>
        <Card style={{ flex: 1, gap: 6 }}>
          <IconBox icon="moon" color="accentSleep" bg="bgSleepSubtle" size={36} rounded={10} />
          <Text variant="caption" color="textSecondary">
            {t('health.bed')}
          </Text>
          <TimeField value={bed} onChange={setBed} />
        </Card>
        <Card style={{ flex: 1, gap: 6 }}>
          <IconBox icon="sun" color="textBrand" bg="bgBrandSubtle" size={36} rounded={10} />
          <Text variant="caption" color="textSecondary">
            {t('health.wake')}
          </Text>
          <TimeField value={wake} onChange={setWake} />
        </Card>
      </Row>

      <Card bg="bgSleepSubtle" style={{ alignItems: 'center', gap: 2 }}>
        <Text variant="h2" color="accentSleep">
          {t('common.hoursMinutes', splitMinutes(minutes))}
        </Text>
        <Text variant="caption" color="textSecondary">
          {diffText}
        </Text>
      </Card>

      <Field label={t('sleepForm.quality')}>
        <Stars value={quality} onChange={setQuality} />
      </Field>

      <Field label={t('form.note')}>
        <TextField value={note} onChange={setNote} icon="pencil" placeholder="…" />
      </Field>
    </FormScreen>
  );
}
