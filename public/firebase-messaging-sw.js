// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBc6aYb8SjxSU9vpUM0j0MN-jdzB83S7x0",
  authDomain: "babytrack-762a6.firebaseapp.com",
  projectId: "babytrack-762a6",
  storageBucket: "babytrack-762a6.firebasestorage.app",
  messagingSenderId: "1037931165351",
  appId: "1:1037931165351:web:ba272eb945bc2a584d8d82"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
