import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import app, { db } from './config';

const messaging = getMessaging(app);
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

export async function requestNotificationPermission(userId) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token && userId) {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token });
    }
    return token;
  } catch (err) {
    console.error('Notification permission error:', err);
    return null;
  }
}

export function onForegroundMessage(callback) {
  return onMessage(messaging, callback);
}
