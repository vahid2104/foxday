import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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
import { addExpense, EXPENSE_CATEGORIES, type ExpenseCategory } from '@/db/money';
import { today } from '@/lib/dates';
import { parseAmount, sanitizeAmountInput, type Currency } from '@/lib/money';

/** Figma: "10 · Xərc əlavə et" */
export default function NewExpenseScreen() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('PLN');
  const [category, setCategory] = useState<ExpenseCategory>('bike');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
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
    addExpense({ date, amountMinor, currency, rateToPln: rateValue, category, note: note.trim() || null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <FormScreen title={t('form.expenseTitle')} saveLabel={t('form.save')} onSave={save}>
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
