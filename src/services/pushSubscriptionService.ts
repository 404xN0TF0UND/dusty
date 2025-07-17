// src/services/pushSubscriptionService.ts

const VAPID_PUBLIC_KEY = 'BERiVTcG_nZRiWzbltzdr7KFTQl7fX-YtAH9ZCStC0ZMg_C8hhlC6odTjTro9W1C2QgVGGIl5tziRCEVgrPKcqs';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(userId: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported in this browser.');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  // Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('Notification permission denied.');
    return null;
  }

  // Subscribe to push
  const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  // Send subscription and userId to backend
  await fetch('https://<YOUR_REGION>-<YOUR_PROJECT>.cloudfunctions.net/subscribeToPush', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, subscription }),
  });

  return subscription;
} 