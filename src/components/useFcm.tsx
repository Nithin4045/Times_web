// components/useFcm.tsx (or call directly)
import { useEffect } from 'react';
import { requestFcmToken, onFcmMessage } from '@/lib/firebaseClient';

const VAPID_KEY = 'BLQCJsRQNm7KFrAZAmt6ADkdYZWBoqdsS1TZQQ4GyxWWBdW9i23muF6xMBzTwVfZlAfhqz-BNYLCy7xpem1RmGc'; // replace

export default function useFcm(userId?: string) {
  useEffect(() => {
    if (!('Notification' in window)) return;

    // optional: only ask when user explicitly clicks "Enable notifications"
    // here we'll auto-ask on mount (you can change)
    (async () => {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
      }

      const token = await requestFcmToken(VAPID_KEY);
      if (token) {
        // send token to your backend to save it for this user
        await fetch('/api/save_fcm_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, userId }),
        });
      }
    })();

    onFcmMessage((payload) => {
      console.log('Foreground message', payload);
      // show in-app toast or Notification
      // new Notification(payload.notification?.title, { body: payload.notification?.body });
    });
  }, [userId]);
}
