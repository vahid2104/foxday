import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FoxyModal } from '@/components/FoxyModal';
import { HABIT_COLOR_TOKENS } from '@/components/habit-meta';
import { IconBox, Row, Text } from '@/components/ui';
import { getMissedOn } from '@/db/habits';
import { addDays, today } from '@/lib/dates';

/** Figma: "08 · Buraxılan vərdiş" — cəza yox, yumşaq motivasiya. */
export default function MissedScreen() {
  const { t } = useTranslation();
  const missed = getMissedOn(addDays(today(), -1));

  return (
    <FoxyModal mood="sad" title={t('missed.title')} cta={t('missed.cta')}>
      <Text color="textSecondary" style={{ textAlign: 'center' }}>
        {t('missed.text')}
      </Text>
      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        {missed.slice(0, 4).map((h) => (
          <Row key={h.id} style={{ gap: 10 }}>
            <IconBox icon={h.icon} color={HABIT_COLOR_TOKENS[h.color].fg} bg={HABIT_COLOR_TOKENS[h.color].bg} size={32} rounded={10} iconSize={16} />
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {h.name}
            </Text>
          </Row>
        ))}
      </View>
      <Text variant="bodyStrong" color="textBrand" style={{ textAlign: 'center' }}>
        {t('missed.encourage')}
      </Text>
    </FoxyModal>
  );
}
