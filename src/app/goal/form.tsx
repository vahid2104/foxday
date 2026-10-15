import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { Segment } from '@/components/controls';
import { DateField, Field, FormScreen, TextField } from '@/components/form';
import { Icon } from '@/components/Icon';
import { Row, Text } from '@/components/ui';
import { addGoal, getGoal, updateGoal, type GoalType } from '@/db/goals';
import { sanitizeAmountInput } from '@/lib/money';
import { spacing, useTheme } from '@/theme';

/** Yeni məqsəd və ya redaktə. */
export default function GoalFormScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getGoal(Number(id)) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<GoalType>(existing?.type ?? 'numeric');
  const [target, setTarget] = useState(existing ? String(existing.target).replace('.', ',') : '');
  const [unit, setUnit] = useState(existing?.unit ?? 'PLN');
  const [deadline, setDeadline] = useState<string | null>(existing?.deadline ?? null);
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');

  const addStep = () => {
    if (!newStep.trim()) return;
    setSteps((s) => [...s, newStep.trim()]);
    setNewStep('');
  };

  const save = () => {
    if (!name.trim()) return Alert.alert('⚠️', t('goalForm.nameRequired'));
    const targetNum = parseFloat(target.replace(',', '.'));
    if (type === 'numeric' && !(targetNum > 0)) return Alert.alert('⚠️', t('goalForm.targetRequired'));
    const allSteps = newStep.trim() ? [...steps, newStep.trim()] : steps;
    if (!existing && type === 'steps' && allSteps.length === 0) return Alert.alert('⚠️', t('goalForm.stepsRequired'));

    if (existing) {
      updateGoal(existing.id, {
        name: name.trim(),
        target: type === 'numeric' ? targetNum : 0,
        unit: type === 'numeric' ? unit.trim() || null : null,
        deadline,
      });
      router.back();
    } else {
      const newId = addGoal({
        name: name.trim(),
        type,
        target: type === 'numeric' ? targetNum : 0,
        unit: type === 'numeric' ? unit.trim() || null : null,
        deadline,
        steps: allSteps,
      });
      router.replace(`/goal/${newId}`);
    }
  };

  return (
    <FormScreen
      title={existing ? t('goalForm.editTitle') : t('goalForm.newTitle')}
      saveLabel={existing ? t('common.save') : t('goalForm.create')}
      onSave={save}>
      <Field label={t('goalForm.name')}>
        <TextField value={name} onChange={setName} placeholder={t('goalForm.namePlaceholder')} />
      </Field>

      {!existing ? (
        <Field label={t('goalForm.type')}>
          <Segment
            value={type}
            onChange={setType}
            options={[
              { value: 'numeric', label: t('goalForm.numeric') },
              { value: 'steps', label: t('goalForm.steps') },
            ]}
          />
        </Field>
      ) : null}

      {type === 'numeric' ? (
        <Row style={{ gap: spacing.md, alignItems: 'flex-start' }}>
          <Field label={t('goalForm.target')} style={{ flex: 2 }}>
            <TextField value={target} onChange={(v) => setTarget(sanitizeAmountInput(v))} keyboardType="decimal-pad" placeholder="1000" />
          </Field>
          <Field label={t('goalForm.unit')} style={{ flex: 1 }}>
            <TextField value={unit} onChange={setUnit} placeholder={t('goalForm.unitPlaceholder')} />
          </Field>
        </Row>
      ) : !existing ? (
        <Field label={t('goalForm.stepsLabel')}>
          <View style={{ gap: spacing.sm }}>
            {steps.map((s, i) => (
              <Row key={`${s}-${i}`} style={{ gap: 10 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderDefault }} />
                <Text style={{ flex: 1 }}>{s}</Text>
                <Pressable onPress={() => setSteps((list) => list.filter((_, j) => j !== i))} hitSlop={8}>
                  <Icon name="x" color={colors.textSecondary} size={18} />
                </Pressable>
              </Row>
            ))}
            <Row style={{ gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <TextField value={newStep} onChange={setNewStep} placeholder={t('goalForm.stepPlaceholder')} />
              </View>
              <Pressable
                onPress={addStep}
                style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.bgBrandSubtle, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" color={colors.textBrand} size={22} />
              </Pressable>
            </Row>
          </View>
        </Field>
      ) : null}

      <Field label={t('goalForm.deadline')}>
        <DateField value={deadline} onChange={setDeadline} future placeholder={t('goalForm.noDeadline')} onClear={() => setDeadline(null)} />
      </Field>
    </FormScreen>
  );
}
