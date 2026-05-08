importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAlk0l3UT_vl1Pl4ZWIc7BrkqPid_mpKNc",
  authDomain: "chatwork-app.firebaseapp.com",
  projectId: "chatwork-app",
  storageBucket: "chatwork-app.firebasestorage.app",
  messagingSenderId: "388681908953",
  appId: "1:388681908953:web:d4ae54c6813a9541e6f4c8",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: payload.data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://chatwork-app.vercel.app')
  );
});
