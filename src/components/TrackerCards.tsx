import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/form';
import { Icon } from '@/components/Icon';
import { Card, IconBox, ProgressBar, Row, Text } from '@/components/ui';
import { getSteps, getWorkMinutes } from '@/db/tracker';
import { useDbQuery } from '@/db/useDbQuery';
import { useForegroundTick, useLive } from '@/hooks/useForegroundTick';
import { useMinutesLabel } from '@/hooks/useMinutesLabel';
import { today } from '@/lib/dates';
import { formatAmount } from '@/lib/money';
import { activeKcal, stepsToKm } from '@/lib/tracker';
import {
  getTodayUsage,
  hasActivityPermission,
  hasStepSensor,
  hasUsageAccess,
  requestActivityPermission,
  syncSteps,
  totalMs,
  trackerAvailable,
} from '@/services/tracker';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

/** Sağlamlıq tabında ekran vaxtının qısa xülasəsi → /screen-time */
export function ScreenTimeCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const fmt = useMinutesLabel();
  const available = trackerAvailable();
  const access = useLive(() => hasUsageAccess());
  const usage = useLive(() => getTodayUsage());
  const totalMin = Math.round(totalMs(usage) / 60_000);
  const top = usage?.apps.slice(0, 3) ?? [];

  return (
    <Pressable onPress={() => router.push('/screen-time')}>
      <Card style={{ gap: 12 }}>
        <Row>
          <IconBox icon="phone" color="textBrand" bg="bgBrandSubtle" size={44} rounded={14} iconSize={22} />
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="textSecondary">
              {t('screenTime.title')}
            </Text>
            <Text variant="h2">
              {!available ? '—' : access ? fmt(totalMin) : t('screenTime.noAccessTitle')}
            </Text>
          </View>
          <Icon name="chevron-right" color={colors.textSecondary} size={20} />
        </Row>
        {!available ? (
          <Text variant="caption" color="textSecondary">
            {t('screenTime.apkOnly')}
          </Text>
        ) : access ? (
          top.map((a) => (
            <Row key={a.packageName} style={{ justifyContent: 'space-between' }}>
              <Text numberOfLines={1} style={{ flex: 1 }}>
                {a.label}
              </Text>
              <Text variant="bodyStrong">{fmt(Math.round(a.ms / 60_000))}</Text>
            </Row>
          ))
        ) : (
          <Text variant="caption" color="textSecondary">
            {t('screenTime.noAccessText')}
          </Text>
        )}
      </Card>
    </Pressable>
  );
}

/** Addımlar, km və təxmini yandırılan kalori (velosiped iş vaxtı daxil). */
export function StepsCard() {
  const { t } = useTranslation();
  const stepGoal = useSettings((s) => s.stepGoal);
  const date = today();
  const steps = useDbQuery(() => getSteps(date));
  const workMin = useDbQuery(() => getWorkMinutes(date));
  const available = trackerAvailable();
  const sensor = useLive(() => hasStepSensor());
  const [permission, setPermission] = useState<boolean | null>(null);
  const tick = useForegroundTick();
  useEffect(() => {
    if (!available || !sensor) return;
    let alive = true;
    hasActivityPermission().then((ok) => alive && setPermission(ok));
    return () => {
      alive = false;
    };
  }, [tick, available, sensor]);

  const grant = async () => {
    const ok = await requestActivityPermission();
    setPermission(ok);
    if (ok) await syncSteps();
  };

  const kcal = activeKcal(steps, workMin);

  let status: string | null = null;
  if (!available) status = t('steps.apkOnly');
  else if (!sensor) status = t('steps.noSensor');
  else if (permission === false) status = t('steps.noPermission');

  return (
    <Card style={{ gap: 12 }}>
      <Row>
        <IconBox icon="bike" color="accentSuccess" bg="bgSuccessSubtle" size={44} rounded={14} iconSize={22} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textSecondary">
            {t('steps.title')}
          </Text>
          <Row style={{ gap: 4, alignItems: 'baseline' }}>
            <Text variant="h2">{formatAmount(steps * 100)}</Text>
            <Text variant="caption" color="textSecondary">
              {t('steps.steps')} · {t('steps.km', { km: stepsToKm(steps) })}
            </Text>
          </Row>
        </View>
      </Row>
      <ProgressBar value={steps / stepGoal} color="accentSuccess" />
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" color="textSecondary">
          {t('steps.goal', { goal: stepGoal })}
        </Text>
        <Text variant="caption" color="textBrand">
          {t('steps.kcal', { kcal })}
        </Text>
      </Row>
      <Text variant="caption" color="textSecondary">
        {t('steps.kcalHint', { min: workMin })}
      </Text>
      {status ? (
        <Text variant="caption" color="textSecondary">
          {status}
        </Text>
      ) : null}
      {available && sensor && permission === false ? (
        <Button label={t('steps.grant')} icon="shield" variant="secondary" onPress={grant} />
      ) : null}
    </Card>
  );
}
