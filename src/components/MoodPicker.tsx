import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Card, Row, Text } from '@/components/ui';
import { getMood, MOOD_EMOJI, setMood, type Mood } from '@/db/food';
import { useDbQuery } from '@/db/useDbQuery';
import { today } from '@/lib/dates';
import { useTheme } from '@/theme';

/** "Bu gün özünü necə hiss edirsən?" — gündə bir emoji. Yenidən toxunsan, silinir. */
export function MoodPicker() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const date = today();
  const mood = useDbQuery(() => getMood(date));

  return (
    <Card style={{ gap: 10, paddingVertical: 14 }}>
      <Text variant="bodyStrong">{t('mood.question')}</Text>
      <Row style={{ justifyContent: 'space-between' }}>
        {([1, 2, 3, 4, 5] as Mood[]).map((m) => {
          const active = mood === m;
          return (
            <Pressable
              key={m}
              onPress={() => {
                setMood(date, active ? null : m);
                Haptics.selectionAsync();
              }}
              accessibilityLabel={t(`mood.labels.${m}`)}
              style={{ alignItems: 'center', gap: 2 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.bgBrandSubtle : 'transparent',
                  borderWidth: active ? 2 : 0,
                  borderColor: colors.accentBrand,
                  opacity: mood && !active ? 0.45 : 1,
                }}>
                <Text style={{ fontSize: 28, lineHeight: 34 }}>{MOOD_EMOJI[m]}</Text>
              </View>
              <Text variant="label" color={active ? 'textBrand' : 'textSecondary'}>
                {t(`mood.labels.${m}`)}
              </Text>
            </Pressable>
          );
        })}
      </Row>
    </Card>
  );
}
