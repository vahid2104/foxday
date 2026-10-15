import { useTranslation } from 'react-i18next';

/** Dəqiqəni "1s 20dəq" və ya "45 dəq" kimi göstərir. */
export function useMinutesLabel() {
  const { t } = useTranslation();
  return (min: number) =>
    min >= 60 ? t('common.hoursMinutes', { h: Math.floor(min / 60), m: min % 60 }) : t('common.minutesShort', { m: min });
}
