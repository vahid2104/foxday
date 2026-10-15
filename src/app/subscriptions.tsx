import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { DetailScreen } from '@/components/controls';
import { Button } from '@/components/form';
import { Foxy } from '@/components/Foxy';
import { SubscriptionRow } from '@/components/SubscriptionRow';
import { Card, Text } from '@/components/ui';
import { deleteSubscription, getMonthlySubscriptionTotal, getSubscriptions } from '@/db/subscriptions';
import { useDbQuery } from '@/db/useDbQuery';
import { formatMoney } from '@/lib/money';
import { syncReminders } from '@/services/notifications';

/** Bütün aylıq abunəliklər. */
export default function SubscriptionsScreen() {
  const { t } = useTranslation();
  const subs = useDbQuery(() => getSubscriptions());
  const total = useDbQuery(() => getMonthlySubscriptionTotal());

  const confirmDelete = (id: number, name: string) =>
    Alert.alert(t('subs.deleteTitle'), `${name}\n${t('subs.deleteText')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteSubscription(id);
          syncReminders();
        },
      },
    ]);

  return (
    <DetailScreen title={t('subs.title')} rightIcon="plus" onRightPress={() => router.push('/subscription/form')}>
      {subs.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Foxy mood="normal" size={96} />
          <Text variant="h3">{t('subs.emptyTitle')}</Text>
          <Text color="textSecondary" style={{ textAlign: 'center' }}>
            {t('subs.emptyText')}
          </Text>
          <Button label={t('subs.add')} icon="plus" onPress={() => router.push('/subscription/form')} style={{ alignSelf: 'stretch' }} />
        </Card>
      ) : (
        <>
          <Text variant="bodyStrong" color="textBrand">
            {t('subs.monthlyTotal', { amount: formatMoney(total) })}
          </Text>
          <Card style={{ gap: 16 }}>
            {subs.map((s) => (
              <SubscriptionRow
                key={s.id}
                sub={s}
                onPress={() => router.push({ pathname: '/subscription/form', params: { id: String(s.id) } })}
                onLongPress={() => confirmDelete(s.id, s.name)}
              />
            ))}
          </Card>
          <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
            {t('subs.holdHint')}
          </Text>
          <Button label={t('subs.add')} icon="plus" variant="secondary" onPress={() => router.push('/subscription/form')} />
        </>
      )}
    </DetailScreen>
  );
}
