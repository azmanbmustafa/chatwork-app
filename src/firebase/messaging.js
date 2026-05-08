import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import app, { db } from './config';

let messaging = null;

try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn('FCM not supported in this environment:', err);
}

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

export async function requestNotificationPermission(userId) {
  if (!messaging || !('Notification' in window)) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token && userId) {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token });
    }
    return token;
  } catch (err) {
    console.warn('Notification setup failed:', err);
    return null;
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  try {
    return onMessage(messaging, callback);
  } catch (err) {
    return () => {};
  }
}
