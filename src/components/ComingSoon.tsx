import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Foxy } from '@/components/Foxy';
import { Card, Screen, Text } from '@/components/ui';

/** Hələ hazır olmayan bölmələr üçün müvəqqəti ekran. */
export function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant="h1">{title}</Text>
      <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Foxy mood="sleepy" size={120} />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text variant="h2">{t('common.comingSoon')}</Text>
          <Text color="textSecondary" style={{ textAlign: 'center' }}>
            {t('common.comingSoonText')}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
