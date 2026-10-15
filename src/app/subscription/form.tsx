import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Stepper } from '@/components/controls';
import { AmountInput, Button, ChipGroup, Field, FormScreen, TextField } from '@/components/form';
import { CATEGORY_ICONS } from '@/components/money-meta';
import { Card, Row, Text } from '@/components/ui';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/db/money';
import { addSubscription, deleteSubscription, getSubscription, updateSubscription } from '@/db/subscriptions';
import { formatAmount, parseAmount, sanitizeAmountInput, type Currency } from '@/lib/money';
import { syncReminders } from '@/services/notifications';

/** Yeni abunəlik və ya redaktə. */
export default function SubscriptionFormScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const ex = id ? getSubscription(Number(id)) : null;

  const [name, setName] = useState(ex?.name ?? '');
  const [amount, setAmount] = useState(ex ? formatAmount(ex.amountMinor).replace(/\s/g, '') : '');
  const [currency, setCurrency] = useState<Currency>(ex?.currency ?? 'PLN');
  const [day, setDay] = useState(ex?.dayOfMonth ?? new Date().getDate());
  const [category, setCategory] = useState<ExpenseCategory>(ex?.category ?? 'subscription');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!name.trim()) return Alert.alert('⚠️', t('subs.nameRequired'));
    const amountMinor = parseAmount(amount);
    if (amountMinor == null || amountMinor <= 0) return setError(t('form.invalidAmount'));
    const input = { name: name.trim(), amountMinor, currency, dayOfMonth: day, category };
    if (ex) updateSubscription(ex.id, input);
    else addSubscription(input);
    syncReminders();
    router.back();
  };

  return (
    <FormScreen title={ex ? t('subs.editTitle') : t('subs.newTitle')} saveLabel={t('form.save')} onSave={save}>
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
      <Field label={t('subs.name')}>
        <TextField value={name} onChange={setName} placeholder={t('subs.namePlaceholder')} />
      </Field>
      <Card style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {t('subs.dayLabel')}
          </Text>
          <Stepper value={day} onChange={setDay} step={1} min={1} max={31} format={(v) => String(v)} />
        </Row>
        <Text variant="caption" color="textSecondary">
          {t('subs.dayHint')}
        </Text>
      </Card>
      <Field label={t('subs.category')}>
        <ChipGroup
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`), icon: CATEGORY_ICONS[c] }))}
          value={category}
          onChange={setCategory}
        />
      </Field>
      {ex ? (
        <Button
          label={t('common.delete')}
          variant="secondary"
          onPress={() =>
            Alert.alert(t('subs.deleteTitle'), t('subs.deleteText'), [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => {
                  deleteSubscription(ex.id);
                  syncReminders();
                  router.back();
                },
              },
            ])
          }
        />
      ) : null}
    </FormScreen>
  );
}
