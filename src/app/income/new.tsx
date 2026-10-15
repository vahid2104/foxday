import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import {
  AmountInput,
  ChipGroup,
  ConversionCard,
  DateField,
  Field,
  FormScreen,
  InfoCard,
  TextField,
  TimeField,
  useRate,
} from '@/components/form';
import { addWorkSession, PLATFORMS, type Platform } from '@/db/money';
import { today } from '@/lib/dates';
import { splitMinutes } from '@/lib/format-date';
import {
  durationMinutes,
  formatAmount,
  hourlyRate,
  parseAmount,
  sanitizeAmountInput,
  type Currency,
} from '@/lib/money';
import { spacing } from '@/theme';

/** Figma: "09 · Gəlir əlavə et" */
export default function NewIncomeScreen() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('PLN');
  const [platform, setPlatform] = useState<Platform>('uber');
  const [date, setDate] = useState(today());
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [orders, setOrders] = useState('');
  const [tip, setTip] = useState('');
  const [km, setKm] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rate = useRate(currency, date);

  const amountMinor = parseAmount(amount);
  const tipMinor = parseAmount(tip) ?? 0;
  const minutes = start && end ? durationMinutes(start, end) : 0;
  const ordersNum = orders ? parseInt(orders, 10) : null;
  const rateValue = rate.status === 'ok' ? rate.result.rate : currency === 'PLN' ? 1 : null;
  const totalPln = amountMinor != null && rateValue != null ? Math.round((amountMinor + tipMinor) * rateValue) : null;
  const perHour = totalPln != null ? hourlyRate(totalPln, minutes) : null;

  const save = () => {
    if (amountMinor == null || amountMinor <= 0) {
      setError(t('form.invalidAmount'));
      return;
    }
    if (rateValue == null) {
      Alert.alert('⚠️', t('form.rateError'));
      return;
    }
    addWorkSession({
      date,
      platform,
      amountMinor,
      tipMinor,
      currency,
      rateToPln: rateValue,
      startTime: start,
      endTime: end,
      durationMin: minutes,
      orders: ordersNum,
      km: km ? parseFloat(km.replace(',', '.')) : null,
      note: note.trim() || null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <FormScreen title={t('form.incomeTitle')} saveLabel={t('form.save')} onSave={save}>
      <AmountInput
        value={amount}
        onChange={(v) => {
          setAmount(sanitizeAmountInput(v));
          setError(null);
        }}
        currency={currency}
        onCurrencyChange={setCurrency}
        error={error}
      />
      <ConversionCard currency={currency} amountMinor={amountMinor != null ? amountMinor + tipMinor : null} rate={rate} />

      <Field label={t('form.platform')}>
        <ChipGroup
          options={PLATFORMS.map((p) => ({ value: p, label: t(`platforms.${p}`), icon: p === 'uber' ? ('bike' as const) : undefined }))}
          value={platform}
          onChange={setPlatform}
        />
      </Field>

      <Field label={t('form.date')}>
        <DateField value={date} onChange={setDate} />
      </Field>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Field label={t('form.start')} style={{ flex: 1 }}>
          <TimeField value={start} onChange={setStart} />
        </Field>
        <Field label={t('form.end')} style={{ flex: 1 }}>
          <TimeField value={end} onChange={setEnd} />
        </Field>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Field label={t('form.orders')} style={{ flex: 1 }}>
          <TextField value={orders} onChange={(v) => setOrders(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="0" />
        </Field>
        <Field label={t('form.tip')} style={{ flex: 1 }}>
          <TextField value={tip} onChange={(v) => setTip(sanitizeAmountInput(v))} keyboardType="decimal-pad" placeholder="0" suffix={currency} />
        </Field>
        <Field label={t('form.km')} style={{ flex: 1 }}>
          <TextField value={km} onChange={(v) => setKm(sanitizeAmountInput(v))} keyboardType="decimal-pad" placeholder="0" />
        </Field>
      </View>

      {perHour != null ? (
        <InfoCard
          icon="sparkle"
          title={t('form.liveCalc', {
            duration: t('common.hoursMinutes', splitMinutes(minutes)),
            rate: formatAmount(perHour, { decimals: 'auto' }),
          })}
          sub={
            ordersNum && totalPln != null
              ? t('form.perOrder', { amount: formatAmount(Math.round(totalPln / ordersNum)) })
              : undefined
          }
        />
      ) : (
        <InfoCard icon="clock" title={t('form.noTime')} />
      )}

      <Field label={t('form.note')}>
        <TextField value={note} onChange={setNote} icon="pencil" placeholder={t('form.notePlaceholder')} />
      </Field>
    </FormScreen>
  );
}
