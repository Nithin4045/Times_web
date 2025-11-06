// lib/firebaseClient.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAsTq6ckkONL7gAJixAXaCarCLIi8JcYSc",
  authDomain: "times-eda10.firebaseapp.com",
  projectId: "times-eda10",
  storageBucket: "times-eda10.firebasestorage.app",
  messagingSenderId: "176709989258",
  appId: "1:176709989258:web:f34629c6765a0380fa8e73",
  measurementId: "G-MWWED358F7"
};

let app: ReturnType<typeof initializeApp> | null = null;

export function initFirebase() {
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

export function getFcmMessaging() {
  initFirebase();
  return getMessaging();
}

// Request permission + get token
export async function requestFcmToken(vapidKey: string): Promise<string | null> {
  try {
    const messaging = getFcmMessaging();
    // register service worker automatically or ensure it's registered in your app
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    return token;
  } catch (err) {
    console.error('FCM token error', err);
    return null;
  }
}

// Handle foreground messages
export function onFcmMessage(cb: (payload: any) => void) {
  const messaging = getFcmMessaging();
  onMessage(messaging, (payload) => cb(payload));
}
