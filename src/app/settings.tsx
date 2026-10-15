import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { DetailScreen, ListRow, SectionLabel, Segment, Stepper, Toggle } from '@/components/controls';
import { TextField } from '@/components/form';
import { formatHours, formatLiters, formatPln } from '@/components/goal-format';
import { Foxy } from '@/components/Foxy';
import { Card, Row, Text } from '@/components/ui';
import { hasPermission, requestPermission, sendTestNotification } from '@/services/notifications';
import { useSettings, type Language, type ThemePreference } from '@/store/settings';
import { spacing } from '@/theme';

/** Figma: "16 · Ayarlar" */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const s = useSettings();
  const [permission, setPermission] = useState<boolean | null>(null);

  useEffect(() => {
    hasPermission().then(setPermission);
  }, []);

  const askPermission = async () => {
    const ok = await requestPermission();
    setPermission(ok);
    if (!ok) Linking.openSettings();
  };

  const openMiui = () =>
    Alert.alert(t('onboarding.miuiHelpTitle'), t('onboarding.miuiHelp'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('onboarding.open'), onPress: () => Linking.openSettings() },
    ]);

  return (
    <DetailScreen title={t('settings.title')}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Foxy mood="normal" size={56} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="caption" color="textSecondary">
            {t('settings.name')}
          </Text>
          <TextField value={s.name} onChange={(name) => s.set({ name })} />
        </View>
      </Card>

      <SectionLabel>{t('settings.general')}</SectionLabel>
      <Card style={{ gap: spacing.md }}>
        <Text variant="bodyStrong">{t('settings.language')}</Text>
        <Segment<Language>
          value={s.language}
          onChange={(language) => s.set({ language })}
          options={[
            { value: 'az', label: 'Azərbaycan' },
            { value: 'en', label: 'English' },
            { value: 'ru', label: 'Русский' },
          ]}
        />
        <Text variant="bodyStrong">{t('settings.theme')}</Text>
        <Segment<ThemePreference>
          value={s.theme}
          onChange={(theme) => s.set({ theme })}
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
        />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="bodyStrong">{t('settings.currency')}</Text>
          <Text variant="bodyStrong" color="textBrand">
            PLN
          </Text>
        </Row>
      </Card>

      <SectionLabel>{t('settings.goals')}</SectionLabel>
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <ListRow
          first
          icon="droplet"
          iconColor="accentWater"
          iconBg="bgWaterSubtle"
          title={t('settings.waterGoal')}
          right={<Stepper value={s.waterGoalMl} onChange={(v) => s.set({ waterGoalMl: v })} step={250} min={1000} max={4000} format={formatLiters} />}
        />
        <ListRow
          icon="droplet"
          iconColor="accentWater"
          iconBg="bgWaterSubtle"
          title={t('settings.glass')}
          right={<Stepper value={s.glassMl} onChange={(v) => s.set({ glassMl: v })} step={50} min={150} max={500} format={(v) => `${v} ml`} />}
        />
        <ListRow
          icon="moon"
          iconColor="accentSleep"
          iconBg="bgSleepSubtle"
          title={t('settings.sleepGoal')}
          right={
            <Stepper
              value={s.sleepGoalMin}
              onChange={(v) => s.set({ sleepGoalMin: v })}
              step={30}
              min={300}
              max={600}
              format={(v) => formatHours(v, t('settings.hours'))}
            />
          }
        />
        <ListRow
          icon="wallet"
          iconColor="accentSuccess"
          iconBg="bgSuccessSubtle"
          title={t('settings.incomeGoal')}
          right={<Stepper value={s.monthlyIncomeGoal} onChange={(v) => s.set({ monthlyIncomeGoal: v })} step={500} min={500} max={20000} format={formatPln} />}
        />
      </Card>

      <SectionLabel>{t('settings.notifications')}</SectionLabel>
      {permission === false ? (
        <Pressable onPress={askPermission}>
          <Card bg="bgDangerSubtle" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="caption" style={{ flex: 1 }}>
              {t('settings.permissionDenied')}
            </Text>
            <Text variant="bodyStrong" color="accentDanger">
              {t('settings.openSettings')}
            </Text>
          </Card>
        </Pressable>
      ) : null}
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <ListRow
          first
          icon="droplet"
          iconColor="accentWater"
          iconBg="bgWaterSubtle"
          title={t('settings.notifWater')}
          subtitle={t('settings.notifWaterSub')}
          right={<Toggle value={s.notifWater} onChange={(notifWater) => s.set({ notifWater })} />}
        />
        <ListRow
          icon="bell"
          title={t('settings.notifHabits')}
          subtitle={t('settings.notifHabitsSub')}
          right={<Toggle value={s.notifHabits} onChange={(notifHabits) => s.set({ notifHabits })} />}
        />
        <ListRow
          icon="moon"
          iconColor="accentSleep"
          iconBg="bgSleepSubtle"
          title={t('settings.notifEvening')}
          subtitle={t('settings.notifEveningSub')}
          right={<Toggle value={s.notifEvening} onChange={(notifEvening) => s.set({ notifEvening })} />}
        />
        <ListRow
          icon="bell"
          iconColor="accentSuccess"
          iconBg="bgSuccessSubtle"
          title={t('settings.testNotif')}
          subtitle={t('settings.testNotifSub')}
          onPress={async () => {
            const result = await sendTestNotification();
            if (result === 'sent') setPermission(true);
            Alert.alert(
              t('settings.testNotif'),
              result === 'sent' ? t('settings.testSent') : result === 'denied' ? t('settings.testDenied') : t('settings.testUnavailable'),
            );
          }}
        />
      </Card>

      <SectionLabel>{t('settings.other')}</SectionLabel>
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <ListRow first icon="sparkle" title={t('xp.title')} onPress={() => router.push('/achievements')} />
        <ListRow icon="chart" iconColor="accentSleep" iconBg="bgSleepSubtle" title={t('settings.reports')} onPress={() => router.push('/reports')} />
        <ListRow icon="refresh" title={t('subs.title')} onPress={() => router.push('/subscriptions')} />
        <ListRow icon="phone" title={t('settings.miui')} subtitle={t('settings.miuiSub')} onPress={openMiui} />
        <ListRow icon="shield" iconColor="accentSuccess" iconBg="bgSuccessSubtle" title={t('settings.backup')} value={t('settings.soon')} />
      </Card>

      <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
        {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </DetailScreen>
  );
}
