import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { DetailScreen, SectionLabel } from '@/components/controls';
import { Button } from '@/components/form';
import { Foxy } from '@/components/Foxy';
import { Card, IconBox, ProgressBar, Row, Text } from '@/components/ui';
import { getAppLimits } from '@/db/tracker';
import { useLive } from '@/hooks/useForegroundTick';
import { useMinutesLabel } from '@/hooks/useMinutesLabel';
import { addDays, fromISODate, startOfWeek, today } from '@/lib/dates';
import { WEEKDAYS_SHORT } from '@/lib/format-date';
import {
  getTodayUsage,
  getUsageForDay,
  hasUsageAccess,
  openUsageAccessSettings,
  totalMs,
  trackerAvailable,
} from '@/services/tracker';
import { useSettings } from '@/store/settings';
import { radius, useTheme } from '@/theme';

/** "Çox" ekran vaxtı həddi (Foxy-nin əhvalı üçün) — 4 saat. */
const HEAVY_MIN = 240;

/** Ekran vaxtı: bu gün hansı app-də nə qədər, limitlər, həftə. */
export default function ScreenTimeScreen() {
  const { t } = useTranslation();
  const access = useLive(() => hasUsageAccess());

  return (
    <DetailScreen title={t('screenTime.title')}>
      {!trackerAvailable() ? (
        <Notice title={t('screenTime.apkOnly')} text={t('screenTime.apkOnlyText')} />
      ) : !access ? (
        <Notice
          title={t('screenTime.noAccessTitle')}
          text={t('screenTime.noAccessText')}
          action={<Button label={t('screenTime.grant')} icon="shield" onPress={openUsageAccessSettings} style={{ alignSelf: 'stretch' }} />}
        />
      ) : (
        <UsageContent />
      )}
    </DetailScreen>
  );
}

function Notice({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
      <Foxy mood="normal" size={96} />
      <Text variant="h3" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text color="textSecondary" style={{ textAlign: 'center' }}>
        {text}
      </Text>
      {action}
    </Card>
  );
}

function UsageContent() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const fmt = useMinutesLabel();
  const usage = useLive(() => getTodayUsage());
  const limits = useLive(() => getAppLimits());
  const date = today();
  const monday = startOfWeek(date);
  const week = useLive(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      if (d > date) return { date: d, min: 0 };
      if (d === date) return { date: d, min: Math.round(totalMs(usage) / 60_000) };
      return { date: d, min: Math.round(totalMs(getUsageForDay(fromISODate(d))) / 60_000) };
    }),
  );

  const totalMin = Math.round(totalMs(usage) / 60_000);
  const limitMap = new Map(limits.map((l) => [l.packageName, l.limitMin]));
  const apps = usage?.apps ?? [];
  const maxWeek = Math.max(60, ...week.map((w) => w.min));
  const heavy = totalMin >= HEAVY_MIN;

  const openLimit = (packageName: string, label: string) =>
    router.push({ pathname: '/app-limit', params: { pkg: packageName, label } });

  return (
    <>
      <Card style={{ gap: 12 }}>
        <Row>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="textSecondary">
              {t('screenTime.today')}
            </Text>
            <Text variant="display">{fmt(totalMin)}</Text>
            <Text variant="caption" color="textSecondary">
              {t('screenTime.unlocks', { count: usage?.unlocks ?? 0 })}
            </Text>
          </View>
          <Foxy mood={heavy ? 'sad' : 'happy'} size={72} />
        </Row>
        <Text variant="caption" color={heavy ? 'accentDanger' : 'accentSuccess'}>
          {heavy ? t('screenTime.foxyBad') : t('screenTime.foxyGood')}
        </Text>
      </Card>

      <SectionLabel>{t('screenTime.week')}</SectionLabel>
      <Card>
        <Row style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 110 }}>
          {week.map((w, i) => (
            <View key={w.date} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
              <View
                style={{
                  width: 18,
                  height: Math.max(4, (w.min / maxWeek) * 80),
                  borderRadius: radius.sm,
                  backgroundColor: w.date === date ? colors.accentBrand : colors.bgBrandSubtle,
                }}
              />
              <Text variant="label" color={w.date === date ? 'textBrand' : 'textSecondary'}>
                {WEEKDAYS_SHORT[language][i]}
              </Text>
            </View>
          ))}
        </Row>
      </Card>

      <SectionLabel>{t('screenTime.apps')}</SectionLabel>
      <Text variant="caption" color="textSecondary">
        {t('screenTime.limitsHint')}
      </Text>
      <Card style={{ gap: 16 }}>
        {apps.length === 0 ? (
          <Text color="textSecondary">{t('screenTime.empty')}</Text>
        ) : (
          apps.slice(0, 25).map((a) => {
            const min = Math.round(a.ms / 60_000);
            const limit = limitMap.get(a.packageName);
            const over = limit != null && min >= limit;
            return (
              <Pressable key={a.packageName} onPress={() => openLimit(a.packageName, a.label)} style={{ gap: 6 }}>
                <Row>
                  <IconBox icon="phone" color={over ? 'accentDanger' : 'textBrand'} bg={over ? 'bgDangerSubtle' : 'bgBrandSubtle'} size={36} rounded={12} iconSize={18} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {a.label}
                    </Text>
                    <Text variant="caption" color={over ? 'accentDanger' : 'textSecondary'}>
                      {limit != null
                        ? `${over ? t('screenTime.over') + ' · ' : ''}${t('screenTime.limitOf', { limit: fmt(limit) })}`
                        : t('screenTime.noLimit')}
                    </Text>
                  </View>
                  <Text variant="bodyStrong">{fmt(min)}</Text>
                </Row>
                <ProgressBar
                  value={limit != null ? min / limit : totalMin ? min / totalMin : 0}
                  color={over ? 'accentDanger' : limit != null ? 'accentBrand' : 'accentSleep'}
                  height={6}
                />
              </Pressable>
            );
          })
        )}
      </Card>

      {limits.some((l) => !apps.find((a) => a.packageName === l.packageName)) ? (
        <>
          <SectionLabel>{t('screenTime.limits')}</SectionLabel>
          <Card style={{ gap: 12 }}>
            {limits
              .filter((l) => !apps.find((a) => a.packageName === l.packageName))
              .map((l) => (
                <Pressable key={l.packageName} onPress={() => openLimit(l.packageName, l.label)}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text variant="bodyStrong">{l.label}</Text>
                    <Text variant="caption" color="textSecondary">
                      0 / {fmt(l.limitMin)}
                    </Text>
                  </Row>
                </Pressable>
              ))}
          </Card>
        </>
      ) : null}
    </>
  );
}
