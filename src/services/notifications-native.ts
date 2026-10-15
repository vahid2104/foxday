import type * as NotificationsTypes from 'expo-notifications';

/**
 * expo-notifications-ın yalnız YERLİ bildirişlər üçün lazım olan hissələri.
 *
 * Niyə birbaşa `import * from 'expo-notifications'` yox?
 * Paketin əsas faylı push (uzaq) bildiriş modullarını da yükləyir. Expo Go (Android, SDK 53+)
 * bu modulları daşımır və app açılan kimi "Cannot find native module
 * 'ExpoTopicSubscriptionModule'" xətası ilə çökür. Ona görə yalnız lazım olan faylları
 * ayrıca və təhlükəsiz (try/catch) yükləyirik. Modul yoxdursa, bildirişlər sakitcə söndürülür.
 */
export type NotificationsApi = Pick<
  typeof NotificationsTypes,
  | 'setNotificationHandler'
  | 'getPermissionsAsync'
  | 'requestPermissionsAsync'
  | 'setNotificationChannelAsync'
  | 'scheduleNotificationAsync'
  | 'cancelAllScheduledNotificationsAsync'
  | 'SchedulableTriggerInputTypes'
  | 'AndroidImportance'
>;

let cached: NotificationsApi | null | undefined;

export function getNotificationsApi(): NotificationsApi | null {
  if (cached !== undefined) return cached;
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const handler = require('expo-notifications/build/NotificationsHandler');
    const permissions = require('expo-notifications/build/NotificationPermissions');
    const channel = require('expo-notifications/build/setNotificationChannelAsync');
    const schedule = require('expo-notifications/build/scheduleNotificationAsync');
    const cancelAll = require('expo-notifications/build/cancelAllScheduledNotificationsAsync');
    const types = require('expo-notifications/build/Notifications.types');
    const channelTypes = require('expo-notifications/build/NotificationChannelManager.types');
    /* eslint-enable @typescript-eslint/no-require-imports */
    cached = {
      setNotificationHandler: handler.setNotificationHandler,
      getPermissionsAsync: permissions.getPermissionsAsync,
      requestPermissionsAsync: permissions.requestPermissionsAsync,
      setNotificationChannelAsync: channel.setNotificationChannelAsync,
      scheduleNotificationAsync: schedule.scheduleNotificationAsync,
      cancelAllScheduledNotificationsAsync: cancelAll.cancelAllScheduledNotificationsAsync,
      SchedulableTriggerInputTypes: types.SchedulableTriggerInputTypes,
      AndroidImportance: channelTypes.AndroidImportance,
    };
  } catch (e) {
    console.warn('Bildirişlər bu mühitdə əlçatan deyil:', e);
    cached = null;
  }
  return cached;
}
