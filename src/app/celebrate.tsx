import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Confetti } from '@/components/Confetti';
import { FoxyModal } from '@/components/FoxyModal';
import { Text } from '@/components/ui';
import { useSettings } from '@/store/settings';

/** Figma: "07 · Təbrik" — bütün vərdişlər bitəndə və ya məqsədə çatanda. */
export default function CelebrateScreen() {
  const { t } = useTranslation();
  const name = useSettings((s) => s.name);
  const { kind, streak, goal } = useLocalSearchParams<{ kind?: string; streak?: string; goal?: string }>();
  const isGoal = kind === 'goal';

  return (
    <FoxyModal
      mood="happy"
      title={isGoal ? t('celebrate.goalTitle') : t('celebrate.title', { name })}
      cta={t('celebrate.continue')}
      background={<Confetti />}>
      <Text color="textSecondary" style={{ textAlign: 'center' }}>
        {isGoal ? t('celebrate.goalText', { goal }) : t('celebrate.allHabits')}
      </Text>
      {!isGoal && Number(streak) > 1 ? (
        <Text variant="bodyStrong" color="textBrand" style={{ textAlign: 'center' }}>
          {t('celebrate.streak', { count: Number(streak) })}
        </Text>
      ) : null}
    </FoxyModal>
  );
}
