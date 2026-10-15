import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/ComingSoon';

export default function GoalsScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.goals')} />;
}
