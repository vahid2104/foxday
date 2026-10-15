import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Confetti } from '@/components/Confetti';
import { FoxyModal } from '@/components/FoxyModal';
import { Text } from '@/components/ui';
import { foxyAccessory, levelTitle } from '@/lib/xp';
import { useSettings } from '@/store/settings';

/** Figma: "07 · Təbrik" — vərdişlər bitəndə, məqsədə çatanda və yeni səviyyədə. */
export default function CelebrateScreen() {
  const { t } = useTranslation();
  const name = useSettings((s) => s.name);
  const { kind, streak, goal, level } = useLocalSearchParams<{ kind?: string; streak?: string; goal?: string; level?: string }>();
  const lv = Number(level);

  let title = t('celebrate.title', { name });
  let text = t('celebrate.allHabits');
  if (kind === 'goal') {
    title = t('celebrate.goalTitle');
    text = t('celebrate.goalText', { goal });
  } else if (kind === 'level') {
    title = t('xp.levelUpTitle', { level: lv });
    text = t('xp.levelUpText', { title: t(`xp.titles.${levelTitle(lv)}`) });
  }

  return (
    <FoxyModal
      mood="happy"
      accessory={kind === 'level' ? foxyAccessory(lv) : undefined}
      title={title}
      cta={t('celebrate.continue')}
      background={<Confetti />}>
      <Text color="textSecondary" style={{ textAlign: 'center' }}>
        {text}
      </Text>
      {kind === 'habits' && Number(streak) > 1 ? (
        <Text variant="bodyStrong" color="textBrand" style={{ textAlign: 'center' }}>
          {t('celebrate.streak', { count: Number(streak) })}
        </Text>
      ) : null}
    </FoxyModal>
  );
}
