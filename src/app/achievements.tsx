import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DetailScreen } from '@/components/controls';
import { Foxy } from '@/components/Foxy';
import { Card, ProgressBar, Row, Text } from '@/components/ui';
import { useDbQuery } from '@/db/useDbQuery';
import { getXpStats } from '@/db/xp';
import { badges, foxyAccessory, levelFromXp, levelTitle, totalXp, xpBreakdown, XP_RULES } from '@/lib/xp';
import { radius, spacing, useTheme } from '@/theme';

/** XP, səviyyə və nişanlar. */
export default function AchievementsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stats = useDbQuery(() => getXpStats());
  const xp = totalXp(stats);
  const lv = levelFromXp(xp);
  const list = badges(stats);
  const unlocked = list.filter((b) => b.unlocked).length;

  return (
    <DetailScreen title={t('xp.title')}>
      <Card style={{ alignItems: 'center', gap: 8, paddingTop: 20 }}>
        <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: colors.bgBrandSubtle, alignItems: 'center', justifyContent: 'center' }}>
          <Foxy mood="happy" size={120} accessory={foxyAccessory(lv.level)} />
        </View>
        <Text variant="h1">{t('xp.level', { level: lv.level })}</Text>
        <Text variant="bodyStrong" color="textBrand">
          {t(`xp.titles.${levelTitle(lv.level)}`)}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 6, marginTop: 4 }}>
          <ProgressBar value={lv.current / lv.needed} height={12} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="caption" color="textSecondary">
              {t('xp.total', { xp })}
            </Text>
            <Text variant="caption" color="textSecondary">
              {t('xp.toNext', { xp: lv.needed - lv.current })}
            </Text>
          </Row>
        </View>
        {lv.level < 8 ? (
          <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
            {lv.level < 4 ? t('xp.accessoryScarf') : t('xp.accessoryCrown')}
          </Text>
        ) : null}
      </Card>

      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="h3">{t('xp.badgesTitle')}</Text>
        <Text variant="caption" color="textSecondary">
          {t('xp.unlockedCount', { count: unlocked, total: list.length })}
        </Text>
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {list.map((b) => (
          <View
            key={b.id}
            style={{
              flexBasis: '30%',
              flexGrow: 1,
              alignItems: 'center',
              gap: 6,
              padding: 12,
              borderRadius: radius.lg,
              backgroundColor: b.unlocked ? colors.bgSurface : colors.bgSurfaceAlt,
              opacity: b.unlocked ? 1 : 0.6,
              borderWidth: b.unlocked ? 2 : 0,
              borderColor: colors.accentBrand,
            }}>
            <Text style={{ fontSize: 30, lineHeight: 36, opacity: b.unlocked ? 1 : 0.4 }}>{b.unlocked ? b.icon : '🔒'}</Text>
            <Text variant="caption" style={{ textAlign: 'center' }} numberOfLines={2}>
              {t(`xp.badges.${b.id}`)}
            </Text>
            {!b.unlocked ? (
              <View style={{ alignSelf: 'stretch', gap: 2 }}>
                <ProgressBar value={b.value / b.target} height={4} />
                <Text variant="label" color="textSecondary" style={{ textAlign: 'center' }}>
                  {b.value} / {b.target}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <Text variant="h3">{t('xp.howTitle')}</Text>
      <Card style={{ gap: 12 }}>
        {xpBreakdown(stats).map((r) => (
          <Row key={r.source} style={{ justifyContent: 'space-between' }}>
            <Text style={{ flex: 1 }}>
              {t(`xp.sources.${r.source}`)} <Text variant="caption" color="textSecondary">+{XP_RULES[r.source]}</Text>
            </Text>
            <Text variant="caption" color="textSecondary">
              ×{r.count}
            </Text>
            <Text variant="bodyStrong" color="textBrand" style={{ minWidth: 64, textAlign: 'right' }}>
              {r.xp} XP
            </Text>
          </Row>
        ))}
      </Card>
    </DetailScreen>
  );
}
