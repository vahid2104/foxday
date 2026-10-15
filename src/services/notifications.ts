import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getHabits } from '@/db/habits';
import i18n from '@/i18n';
import { useSettings } from '@/store/settings';

/**
 * Yerli bildirişlər (internet və server lazım deyil).
 * Hər dəfə vərdişlər və ya ayarlar dəyişəndə syncReminders() bütün planı yenidən qurur.
 */
const CHANNEL = 'reminders';
const WATER_HOURS = [9, 11, 13, 15, 17, 19, 21];
export const EVENING = { hour: 21, minute: 30 };

export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: i18n.t('notifications.channel'),
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#FF8A3D',
  });
}

export async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/** İcazə istəyir. Android 13+ üçün əvvəlcə kanal yaradılmalıdır. */
export async function requestPermission(): Promise<boolean> {
  await ensureChannel();
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') await syncReminders();
  return status === 'granted';
}

/** Expo-nun həftə günü: 1 = bazar ... 7 = şənbə. Bizim: 0 = B.e ... 6 = bazar. */
const toExpoWeekday = (d: number) => (d === 6 ? 1 : d + 2);

let syncing: Promise<void> | null = null;

/** Bütün xatırlatmaları ayarlara və vərdişlərə görə yenidən planlaşdırır. */
export function syncReminders(): Promise<void> {
  // Ardıcıl çağırışlar bir-birinin üstünə düşməsin
  syncing = (syncing ?? Promise.resolve()).then(doSync).catch((e) => console.warn('syncReminders', e));
  return syncing;
}

async function doSync() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!(await hasPermission())) return;
  await ensureChannel();
  const s = useSettings.getState();
  const t = i18n.t.bind(i18n);
  const daily = (hour: number, minute: number) => ({
    type: Notifications.SchedulableTriggerInputTypes.DAILY as const,
    hour,
    minute,
    channelId: CHANNEL,
  });

  if (s.notifWater) {
    for (const hour of WATER_HOURS) {
      await Notifications.scheduleNotificationAsync({
        content: { title: t('notifications.waterTitle'), body: t('notifications.waterBody') },
        trigger: daily(hour, 0),
      });
    }
  }

  if (s.notifEvening) {
    await Notifications.scheduleNotificationAsync({
      content: { title: t('notifications.eveningTitle'), body: t('notifications.eveningBody') },
      trigger: daily(EVENING.hour, EVENING.minute),
    });
  }

  if (s.notifHabits) {
    for (const h of getHabits()) {
      if (!h.reminderTime) continue;
      const [hour, minute] = h.reminderTime.split(':').map(Number);
      const content = { title: h.name, body: t('notifications.habitBody') };
      if (h.frequency === 'daily') {
        await Notifications.scheduleNotificationAsync({ content, trigger: daily(hour, minute) });
      } else {
        for (const d of h.days) {
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: toExpoWeekday(d),
              hour,
              minute,
              channelId: CHANNEL,
            },
          });
        }
      }
    }
  }
}
