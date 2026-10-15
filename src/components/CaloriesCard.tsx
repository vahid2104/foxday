import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/form';
import { Card, IconBox, ProgressBar, Row, Text } from '@/components/ui';
import { deleteFood, getFoods } from '@/db/food';
import { useDbQuery } from '@/db/useDbQuery';
import { today } from '@/lib/dates';
import { useSettings } from '@/store/settings';

/** Sağlamlıq tabında kalori kartı. */
export function CaloriesCard() {
  const { t } = useTranslation();
  const goal = useSettings((s) => s.calorieGoal);
  const date = today();
  const foods = useDbQuery(() => getFoods(date));
  const kcal = foods.reduce((a, f) => a + f.kcal, 0);
  const over = kcal > goal;

  return (
    <Card style={{ gap: 12 }}>
      <Row>
        <IconBox icon="flame" color="textBrand" bg="bgBrandSubtle" size={44} rounded={14} iconSize={22} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textSecondary">
            {t('food.title')}
          </Text>
          <Row style={{ gap: 4, alignItems: 'baseline' }}>
            <Text variant="h2">{kcal}</Text>
            <Text variant="caption" color="textSecondary">
              / {t('food.goal', { goal })}
            </Text>
          </Row>
        </View>
        <Text variant="caption" color={over ? 'accentDanger' : 'textSecondary'}>
          {over ? t('food.over', { kcal: kcal - goal }) : t('food.left', { kcal: goal - kcal })}
        </Text>
      </Row>
      <ProgressBar value={kcal / goal} color={over ? 'accentDanger' : 'accentBrand'} />
      {foods.length === 0 ? (
        <Text variant="caption" color="textSecondary">
          {t('food.empty')}
        </Text>
      ) : (
        <View style={{ gap: 8 }}>
          {foods.map((f) => (
            <Pressable
              key={f.id}
              onLongPress={() =>
                Alert.alert(t('food.deleteTitle'), `${f.name} · ${f.kcal} kcal`, [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('common.delete'), style: 'destructive', onPress: () => deleteFood(f.id) },
                ])
              }>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text numberOfLines={1} style={{ flex: 1 }}>
                  <Text variant="caption" color="textSecondary">
                    {f.time}{'  '}
                  </Text>
                  {f.name}
                </Text>
                <Text variant="bodyStrong">{f.kcal} kcal</Text>
              </Row>
            </Pressable>
          ))}
          <Text variant="caption" color="textSecondary">
            {t('food.holdHint')}
          </Text>
        </View>
      )}
      <Button label={t('food.add')} icon="plus" variant="secondary" onPress={() => router.push('/food/new')} />
    </Card>
  );
}
