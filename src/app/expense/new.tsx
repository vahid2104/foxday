import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import {
  AmountInput,
  ChipGroup,
  ConversionCard,
  DateField,
  Field,
  FormScreen,
  TextField,
  useRate,
} from '@/components/form';
import { CATEGORY_ICONS } from '@/components/money-meta';
import { addExpense, EXPENSE_CATEGORIES, getExpense, updateExpense, type ExpenseCategory } from '@/db/money';
import { today } from '@/lib/dates';
import { formatAmount, parseAmount, sanitizeAmountInput, type Currency } from '@/lib/money';

/** Figma: "10 · Xərc əlavə et" */
export default function NewExpenseScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const ex = id ? getExpense(Number(id)) : null;
  const [amount, setAmount] = useState(ex ? formatAmount(ex.amountMinor).replace(/\s/g, '') : '');
  const [currency, setCurrency] = useState<Currency>(ex?.currency ?? 'PLN');
  const [category, setCategory] = useState<ExpenseCategory>(ex?.category ?? 'bike');
  const [date, setDate] = useState(ex?.date ?? today());
  const [note, setNote] = useState(ex?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const rate = useRate(currency, date);

  const amountMinor = parseAmount(amount);
  const rateValue = rate.status === 'ok' ? rate.result.rate : currency === 'PLN' ? 1 : null;

  const save = () => {
    if (amountMinor == null || amountMinor <= 0) {
      setError(t('form.invalidAmount'));
      return;
    }
    if (rateValue == null) {
      Alert.alert('⚠️', t('form.rateError'));
      return;
    }
    const input = { date, amountMinor, currency, rateToPln: rateValue, category, note: note.trim() || null };
    if (ex) updateExpense(ex.id, input);
    else addExpense(input);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <FormScreen title={ex ? t('common.edit') : t('form.expenseTitle')} saveLabel={t('form.save')} onSave={save}>
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
      <ConversionCard currency={currency} amountMinor={amountMinor} rate={rate} />

      <Field label={t('form.category')}>
        <ChipGroup
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`), icon: CATEGORY_ICONS[c] }))}
          value={category}
          onChange={setCategory}
        />
      </Field>

      <Field label={t('form.date')}>
        <DateField value={date} onChange={setDate} />
      </Field>

      <Field label={t('form.note')}>
        <TextField value={note} onChange={setNote} icon="pencil" placeholder={t('form.notePlaceholder')} />
      </Field>
    </FormScreen>
  );
}
