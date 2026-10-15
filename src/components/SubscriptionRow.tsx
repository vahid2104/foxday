import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

import { IconBox, Row, Text } from '@/components/ui';
import { paySubscription, unpaySubscription, type SubscriptionWithStatus } from '@/db/subscriptions';
import { formatShortDate } from '@/lib/format-date';
import { formatMoney } from '@/lib/money';
import { syncReminders } from '@/services/notifications';
import { useSettings } from '@/store/settings';
import { radius, spacing, useTheme } from '@/theme';

/** Abunəlik sətri: vəziyyət + "Ödədim" düyməsi. */
export function SubscriptionRow({
  sub,
  onPress,
  onLongPress,
}: {
  sub: SubscriptionWithStatus;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const [busy, setBusy] = useState(false);
  const st = sub.status;
  const paid = st.kind === 'paid';

  let line: string;
  let tone: 'textSecondary' | 'accentDanger' | 'textBrand' | 'accentSuccess' = 'textSecondary';
  switch (st.kind) {
    case 'paid':
      line = `${t('subs.paid')} · ${t('subs.next', { date: formatShortDate(st.next, language) })}`;
      tone = 'accentSuccess';
      break;
    case 'overdue':
      line = t('subs.overdue', { count: st.daysLate });
      tone = 'accentDanger';
      break;
    case 'soon':
      line = st.daysLeft === 0 ? t('subs.dueToday') : t('subs.daysLeft', { count: st.daysLeft, date: formatShortDate(st.due, language) });
      tone = 'textBrand';
      break;
    default:
      line = t('subs.daysLeft', { count: st.daysLeft, date: formatShortDate(st.due, language) });
  }

  const pay = async () => {
    setBusy(true);
    try {
      await paySubscription(sub);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      syncReminders();
    } catch {
      Alert.alert('⚠️', t('form.rateError'));
    } finally {
      setBusy(false);
    }
  };

  const unpay = () =>
    Alert.alert(t('subs.unpayTitle'), t('subs.unpayText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('subs.unpay'),
        style: 'destructive',
        onPress: () => {
          unpaySubscription(sub.id);
          syncReminders();
        },
      },
    ]);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} disabled={!onPress && !onLongPress}>
      <Row style={{ gap: spacing.md }}>
        <IconBox
          icon={paid ? 'check' : 'refresh'}
          color={paid ? 'accentSuccess' : st.kind === 'overdue' ? 'accentDanger' : 'textBrand'}
          bg={paid ? 'bgSuccessSubtle' : st.kind === 'overdue' ? 'bgDangerSubtle' : 'bgBrandSubtle'}
        />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {sub.name}
          </Text>
          <Text variant="caption" color={tone} numberOfLines={1}>
            {line}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text variant="bodyStrong">{formatMoney(sub.amountMinor, sub.currency)}</Text>
          {paid ? (
            <Pressable onPress={unpay} hitSlop={6}>
              <Text variant="caption" color="textSecondary">
                {t('subs.unpay')}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={pay}
              disabled={busy}
              style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, backgroundColor: colors.bgBrand }}>
              {busy ? (
                <ActivityIndicator size="small" color={colors.textOnBrand} />
              ) : (
                <Text variant="caption" color="textOnBrand">
                  {t('subs.pay')}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </Row>
    </Pressable>
  );
}
