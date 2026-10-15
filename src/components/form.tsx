import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { IconBox, Row, Text } from '@/components/ui';
import { fromISODate, hhmmToDate, toHHMM, toISODate } from '@/lib/dates';
import { formatRelativeDate, formatShortDate } from '@/lib/format-date';
import { formatMoney, type Currency } from '@/lib/money';
import { getRateToPln, type RateResult } from '@/services/rates';
import { useSettings } from '@/store/settings';
import { radius, spacing, typography, useTheme } from '@/theme';

/** Formalar üçün ekran: üst panel (geri + başlıq), sürüşən məzmun, aşağıda "Yadda saxla". */
export function FormScreen({
  title,
  children,
  onSave,
  saveLabel,
  saving,
}: {
  title: string;
  children: ReactNode;
  onSave: () => void;
  saveLabel: string;
  saving?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <Row style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
          <IconBox icon="chevron-left" color="textPrimary" bg="bgSurface" rounded={20} iconSize={22} />
        </Pressable>
        <Text variant="h3">{title}</Text>
        <View style={{ width: 40 }} />
      </Row>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}>
        {children}
        <Button label={saveLabel} onPress={onSave} loading={saving} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  loading?: boolean;
  style?: object;
}) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  const fg = primary ? colors.textOnBrand : colors.textBrand;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? colors.bgBrand : colors.bgBrandSubtle, opacity: pressed || loading ? 0.8 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} color={fg} size={18} />}
          <Text variant="bodyStrong" style={{ color: fg }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Böyük məbləğ sahəsi + valyuta seçimi (Figma: "MƏBLƏĞ"). */
export function AmountInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  error?: string | null;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm }}>
      <Text variant="label" color="textSecondary">
        {t('form.amount')}
      </Text>
      <Row style={{ gap: spacing.sm, alignItems: 'baseline' }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          autoFocus
          style={[typography.display, { color: colors.textPrimary, minWidth: 60, textAlign: 'center', padding: 0 }]}
        />
        <Text variant="h2" color="textBrand">
          {currency}
        </Text>
      </Row>
      {error ? (
        <Text variant="caption" color="accentDanger">
          {error}
        </Text>
      ) : null}
      <ChipGroup
        options={(['PLN', 'AZN', 'USD'] as Currency[]).map((c) => ({ value: c, label: c }))}
        value={currency}
        onChange={onCurrencyChange}
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon?: IconName;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const fg = active ? colors.textOnBrand : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.bgBrand, borderColor: colors.bgBrand }
          : { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
      ]}>
      {icon && <Icon name={icon} color={active ? fg : colors.textSecondary} size={16} />}
      <Text variant="caption" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} icon={o.icon} active={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

/** Başlıqlı sahə bloku. */
export function Field({ label, children, style }: { label: string; children: ReactNode; style?: object }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

function FieldBox({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const { colors } = useTheme();
  const style = [styles.fieldBox, { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault }];
  return onPress ? (
    <Pressable onPress={onPress} style={style} accessibilityRole="button">
      {children}
    </Pressable>
  ) : (
    <View style={style}>{children}</View>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  icon,
  suffix,
  keyboardType,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
  suffix?: string;
  keyboardType?: KeyboardTypeOptions;
}) {
  const { colors } = useTheme();
  return (
    <FieldBox>
      {icon && <Icon name={icon} color={colors.textSecondary} size={18} />}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        style={[typography.bodyStrong, { flex: 1, color: colors.textPrimary, padding: 0 }]}
      />
      {suffix ? (
        <Text variant="caption" color="textSecondary">
          {suffix}
        </Text>
      ) : null}
    </FieldBox>
  );
}

/** Tarix seçimi — Android-in öz təqvim pəncərəsi. */
export function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const open = () => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: fromISODate(value),
      mode: 'date',
      maximumDate: new Date(),
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(toISODate(date));
      },
    });
  };
  const label = formatRelativeDate(value, language, { today: t('form.today'), yesterday: t('form.yesterday') });
  return (
    <FieldBox onPress={open}>
      <Icon name="calendar" color={colors.textSecondary} size={18} />
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {label === formatShortDate(value, language) ? label : `${label}, ${formatShortDate(value, language)}`}
      </Text>
    </FieldBox>
  );
}

/** Saat seçimi (24 saat). */
export function TimeField({ value, onChange }: { value: string | null; onChange: (hhmm: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const open = () => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: value ? hhmmToDate(value) : new Date(),
      mode: 'time',
      is24Hour: true,
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(toHHMM(date));
      },
    });
  };
  return (
    <FieldBox onPress={open}>
      <Icon name="clock" color={colors.textSecondary} size={18} />
      <Text variant="bodyStrong" color={value ? 'textPrimary' : 'textSecondary'}>
        {value ?? t('form.pick')}
      </Text>
    </FieldBox>
  );
}

/** Seçilmiş valyuta üçün NBP məzənnəsini yükləyir. */
type RateState = { status: 'loading' } | { status: 'ok'; result: RateResult } | { status: 'error' };

export function useRate(currency: Currency, date: string): RateState {
  const key = `${currency}|${date}`;
  const [loaded, setLoaded] = useState<{ key: string; state: RateState } | null>(null);

  useEffect(() => {
    let alive = true;
    getRateToPln(currency, date)
      .then((result) => alive && setLoaded({ key, state: { status: 'ok', result } }))
      .catch(() => alive && setLoaded({ key, state: { status: 'error' } }));
    return () => {
      alive = false;
    };
  }, [key, currency, date]);

  return loaded && loaded.key === key ? loaded.state : { status: 'loading' };
}

/** "≈ 114,79 PLN" kartı (yalnız AZN/USD seçiləndə). */
export function ConversionCard({
  currency,
  amountMinor,
  rate,
}: {
  currency: Currency;
  amountMinor: number | null;
  rate: ReturnType<typeof useRate>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  if (currency === 'PLN') return null;

  let title = '…';
  let sub = t('form.rateLoading');
  let bg = colors.bgWaterSubtle;
  if (rate.status === 'ok') {
    const pln = amountMinor != null ? Math.round(amountMinor * rate.result.rate) : null;
    title = pln != null ? `≈ ${formatMoney(pln, 'PLN', { decimals: 2 })}` : '≈ — PLN';
    sub = rate.result.stale
      ? t('form.rateStale', { date: formatShortDate(rate.result.effectiveDate, language) })
      : t('form.rateInfo', {
          currency,
          rate: rate.result.rate.toFixed(4).replace('.', ','),
          date: formatShortDate(rate.result.effectiveDate, language),
        });
  } else if (rate.status === 'error') {
    title = '⚠️';
    sub = t('form.rateError');
    bg = colors.bgDangerSubtle;
  }

  return (
    <View style={[styles.infoCard, { backgroundColor: bg }]}>
      {rate.status === 'loading' ? (
        <ActivityIndicator color={colors.accentWater} />
      ) : (
        <Icon name="refresh" color={colors.accentWater} size={20} />
      )}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textSecondary">
          {sub}
        </Text>
      </View>
    </View>
  );
}

export function InfoCard({ icon, title, sub }: { icon: IconName; title: string; sub?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.bgBrandSubtle }]}>
      <Icon name={icon} color={colors.textBrand} size={20} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color="textBrand">
          {title}
        </Text>
        {sub ? (
          <Text variant="caption" color="textSecondary">
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  formContent: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    gap: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
});
