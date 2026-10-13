/** Notifications: local (expo-notifications on device / Notification API on web) while the app is running,
 *  plus Expo push tokens when an EAS project id is configured (EXPO_PUBLIC_EAS_PROJECT_ID). */
import { Platform } from 'react-native';
let N: any = null; try { N = require('expo-notifications'); } catch {}
const EAS_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
export async function setupNotifications(): Promise<{ granted: boolean; pushToken?: string }> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return { granted: false };
    if (Notification.permission === 'default') { try { await Notification.requestPermission(); } catch {} }
    return { granted: Notification.permission === 'granted' };
  }
  if (!N) return { granted: false };
  N.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowAlert: true }) });
  if (Platform.OS === 'android') await N.setNotificationChannelAsync('orders', { name: 'Orders', importance: N.AndroidImportance.HIGH });
  let { status } = await N.getPermissionsAsync(); if (status !== 'granted') status = (await N.requestPermissionsAsync()).status;
  if (status !== 'granted') return { granted: false };
  let pushToken: string | undefined;
  if (EAS_ID) { try { pushToken = (await N.getExpoPushTokenAsync({ projectId: EAS_ID })).data; } catch (e) { console.warn('push token', e); } }
  return { granted: true, pushToken };
}
export async function localNotify(title: string, body: string) {
  if (Platform.OS === 'web') { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body }); return; }
  if (N) await N.scheduleNotificationAsync({ content: { title, body, sound: true }, trigger: null });
}
/** Remote push via Expo's push service (works from the app; no server of our own). */
import { sendPushMany } from '../push';
export async function sendPush(token: string | undefined, title: string, body: string) { await sendPushMany([token], title, body); }
export const STATUS_TEXT: Record<string, string> = { placed: 'Order placed', accepted: 'Store accepted your order', ready: 'Packed and ready for pickup', picked_up: 'Rider picked up your order', on_the_way: 'Rider is on the way', delivered: 'Delivered — enjoy!', rejected: 'Store could not take the order' };
