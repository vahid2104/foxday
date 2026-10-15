import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Chip, Field, FormScreen, TextField } from '@/components/form';
import { Row } from '@/components/ui';
import { addFood, getFrequentFoods } from '@/db/food';
import { today } from '@/lib/dates';

/** Yemək qeydi: ad + kalori. Tez-tez yediklərinə toxunanda dərhal əlavə olunur. */
export default function NewFoodScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const frequent = getFrequentFoods();

  const done = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const save = () => {
    if (!name.trim()) return Alert.alert('⚠️', t('food.nameRequired'));
    const n = parseInt(kcal, 10);
    if (!(n > 0)) return Alert.alert('⚠️', t('food.kcalRequired'));
    addFood(today(), name.trim(), n);
    done();
  };

  return (
    <FormScreen title={t('food.newTitle')} saveLabel={t('form.save')} onSave={save}>
      {frequent.length > 0 ? (
        <Field label={t('food.frequent')}>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {frequent.map((f) => (
              <Chip
                key={f.name}
                label={`${f.name} · ${f.kcal}`}
                active={false}
                icon="plus"
                onPress={() => {
                  addFood(today(), f.name, f.kcal);
                  done();
                }}
              />
            ))}
          </Row>
        </Field>
      ) : null}
      <Field label={t('food.name')}>
        <TextField value={name} onChange={setName} placeholder={t('food.namePlaceholder')} />
      </Field>
      <Field label={t('food.kcal')}>
        <TextField value={kcal} onChange={(v) => setKcal(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="450" suffix="kcal" />
      </Field>
    </FormScreen>
  );
}
