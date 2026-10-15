import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/ComingSoon';

export default function MoneyScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.money')} />;
}
