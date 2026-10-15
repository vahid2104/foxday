import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DetailScreen, Stepper } from '@/components/controls';
import { Button } from '@/components/form';
import { Card, IconBox, Row, Text } from '@/components/ui';
import { getAppLimit, removeAppLimit, setAppLimit } from '@/db/tracker';
import { useMinutesLabel } from '@/hooks/useMinutesLabel';

/** Bir app üçün gündəlik limit. */
export default function AppLimitScreen() {
  const { t } = useTranslation();
  const fmt = useMinutesLabel();
  const { pkg, label } = useLocalSearchParams<{ pkg: string; label: string }>();
  const existing = getAppLimit(pkg);
  const [minutes, setMinutes] = useState(existing?.limitMin ?? 60);

  const save = () => {
    setAppLimit(pkg, label ?? pkg, minutes);
    router.back();
  };
  const remove = () => {
    removeAppLimit(pkg);
    router.back();
  };

  return (
    <DetailScreen
      title={label ?? pkg}
      footer={<Button label={t('screenTime.save')} icon="check" onPress={save} />}>
      <Card style={{ gap: 16 }}>
        <Row>
          <IconBox icon="clock" color="textBrand" bg="bgBrandSubtle" size={44} rounded={14} iconSize={22} />
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {t('screenTime.setLimit')}
          </Text>
          <Stepper value={minutes} onChange={setMinutes} step={15} min={15} max={720} format={fmt} />
        </Row>
        <Text variant="caption" color="textSecondary">
          {t('screenTime.limitsHint')}
        </Text>
      </Card>
      {existing ? <Button label={t('screenTime.remove')} icon="trash" variant="secondary" onPress={remove} /> : null}
    </DetailScreen>
  );
}
