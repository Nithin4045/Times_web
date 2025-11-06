// public/firebase-messaging-sw.js

// import firebase scripts (compat version)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Your firebase config (repeat here)
const firebaseConfig = {
  apiKey: "AIzaSyAsTq6ckkONL7gAJixAXaCarCLIi8JcYSc",
  authDomain: "times-eda10.firebaseapp.com",
  projectId: "times-eda10",
  storageBucket: "times-eda10.firebasestorage.app",
  messagingSenderId: "176709989258",
  appId: "1:176709989258:web:f34629c6765a0380fa8e73",
};

// Initialize
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage(function(payload) {
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icons/icon-192.png' // optional
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: handle notificationclick
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // change to URL you want to open
  );
});
