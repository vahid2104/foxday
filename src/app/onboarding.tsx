import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Stepper } from '@/components/controls';
import { Button, Field, TextField } from '@/components/form';
import { formatHours, formatLiters, formatPln } from '@/components/goal-format';
import { Foxy } from '@/components/Foxy';
import { Icon, type IconName } from '@/components/Icon';
import { Card, IconBox, Row, Text } from '@/components/ui';
import { requestPermission } from '@/services/notifications';
import { useSettings, type Language } from '@/store/settings';
import { radius, spacing, useTheme, type ColorTokens } from '@/theme';

const LANGS: { value: Language; flag: string; label: string }[] = [
  { value: 'az', flag: '🇦🇿', label: 'Azərbaycan' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
  { value: 'ru', flag: '🇷🇺', label: 'Русский' },
];

/** Figma: "17–20 · Onboarding" — app ilk dəfə açılanda. */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const settings = useSettings();
  const [step, setStep] = useState(0);
  const [notifAllowed, setNotifAllowed] = useState(false);

  const finish = () => {
    settings.set({ onboardingDone: true });
    router.replace('/');
  };
  const next = () => (step < 3 ? setStep(step + 1) : finish());

  const openMiui = () =>
    Alert.alert(t('onboarding.miuiHelpTitle'), t('onboarding.miuiHelp'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('onboarding.open'), onPress: () => Linking.openSettings() },
    ]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <Row style={{ justifyContent: 'flex-end', paddingHorizontal: spacing['2xl'], height: 44 }}>
        {step < 3 ? (
          <Pressable onPress={finish} hitSlop={10}>
            <Text variant="bodyStrong" color="textSecondary">
              {t('onboarding.skip')}
            </Text>
          </Pressable>
        ) : null}
      </Row>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View key={step} entering={FadeInRight.duration(300)} style={{ gap: spacing.lg }}>
          {step === 0 && (
            <View style={{ alignItems: 'center', gap: 20, paddingTop: 40 }}>
              <View style={[styles.halo, { backgroundColor: colors.bgBrandSubtle }]}>
                <Foxy mood="happy" size={180} />
              </View>
              <Text variant="h1" style={{ textAlign: 'center' }}>
                {t('onboarding.welcomeTitle')}
              </Text>
              <Text color="textSecondary" style={{ textAlign: 'center' }}>
                {t('onboarding.welcomeText')}
              </Text>
            </View>
          )}

          {step === 1 && (
            <>
              <Foxy mood="normal" size={72} />
              <Text variant="h1">{t('onboarding.langTitle')}</Text>
              <Text color="textSecondary">{t('onboarding.langSub')}</Text>
              {LANGS.map((l) => {
                const active = settings.language === l.value;
                return (
                  <Pressable key={l.value} onPress={() => settings.set({ language: l.value })}>
                    <Card style={[{ flexDirection: 'row', alignItems: 'center' }, active && { borderWidth: 2, borderColor: colors.accentBrand }]}>
                      <Text variant="h2">{l.flag}</Text>
                      <Text variant="bodyStrong" style={{ flex: 1 }}>
                        {l.label}
                      </Text>
                      <View
                        style={[
                          styles.radio,
                          active ? { backgroundColor: colors.bgBrand } : { borderWidth: 2, borderColor: colors.borderDefault },
                        ]}>
                        {active && <Icon name="check" color={colors.textOnBrand} size={14} />}
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
              <Field label={t('onboarding.nameLabel')}>
                <TextField value={settings.name} onChange={(name) => settings.set({ name })} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Text variant="h1">{t('onboarding.goalsTitle')}</Text>
              <Text color="textSecondary">{t('onboarding.goalsSub')}</Text>
              <GoalRow icon="droplet" color="accentWater" bg="bgWaterSubtle" label={t('settings.waterGoal')}>
                <Stepper value={settings.waterGoalMl} onChange={(v) => settings.set({ waterGoalMl: v })} step={250} min={1000} max={4000} format={formatLiters} />
              </GoalRow>
              <GoalRow icon="moon" color="accentSleep" bg="bgSleepSubtle" label={t('settings.sleepGoal')}>
                <Stepper
                  value={settings.sleepGoalMin}
                  onChange={(v) => settings.set({ sleepGoalMin: v })}
                  step={30}
                  min={300}
                  max={600}
                  format={(v) => formatHours(v, t('settings.hours'))}
                />
              </GoalRow>
              <GoalRow icon="wallet" color="accentSuccess" bg="bgSuccessSubtle" label={t('settings.incomeGoal')}>
                <Stepper
                  value={settings.monthlyIncomeGoal}
                  onChange={(v) => settings.set({ monthlyIncomeGoal: v })}
                  step={500}
                  min={500}
                  max={20000}
                  format={formatPln}
                />
              </GoalRow>
            </>
          )}

          {step === 3 && (
            <>
              <Foxy mood="normal" size={72} />
              <Text variant="h1">{t('onboarding.permTitle')}</Text>
              <Text color="textSecondary">{t('onboarding.permSub')}</Text>
              <PermRow
                icon="bell"
                color="textBrand"
                bg="bgBrandSubtle"
                title={t('onboarding.permNotif')}
                sub={t('onboarding.permNotifSub')}
                done={notifAllowed}
                onPress={async () => setNotifAllowed(await requestPermission())}
              />
              <PermRow icon="refresh" color="accentSleep" bg="bgSleepSubtle" title={t('onboarding.permAutostart')} sub={t('onboarding.permAutostartSub')} onPress={openMiui} />
              <PermRow icon="shield" color="accentSuccess" bg="bgSuccessSubtle" title={t('onboarding.permBattery')} sub={t('onboarding.permBatterySub')} onPress={openMiui} />
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.bottom}>
        <Row style={{ gap: 6, justifyContent: 'center' }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? colors.bgBrand : colors.track }} />
          ))}
        </Row>
        <Button
          label={step === 0 ? t('onboarding.start') : step === 3 ? t('onboarding.done') : t('onboarding.next')}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

function GoalRow({ icon, color, bg, label, children }: { icon: IconName; color: keyof ColorTokens; bg: keyof ColorTokens; label: string; children: ReactNode }) {
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
      <IconBox icon={icon} color={color} bg={bg} />
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </Text>
      {children}
    </Card>
  );
}

function PermRow({
  icon,
  color,
  bg,
  title,
  sub,
  done,
  onPress,
}: {
  icon: IconName;
  color: keyof ColorTokens;
  bg: keyof ColorTokens;
  title: string;
  sub: string;
  done?: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
      <IconBox icon={icon} color={color} bg={bg} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textSecondary">
          {sub}
        </Text>
      </View>
      {done ? (
        <View style={[styles.radio, { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentSuccess }]}>
          <Icon name="check" color={colors.textOnBrand} size={16} />
        </View>
      ) : (
        <Pressable onPress={onPress} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bgBrandSubtle }}>
          <Text variant="caption" color="textBrand">
            {t('onboarding.open')}
          </Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  halo: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    gap: 20,
  },
});
