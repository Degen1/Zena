import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  setBackgroundMessageHandler,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

let cachedMessaging: FirebaseMessagingTypes.Module | null = null;

function getMessagingModule() {
  if (!cachedMessaging) {
    cachedMessaging = getMessaging();
  }

  return cachedMessaging;
}

async function requestNotificationPermission(messaging: FirebaseMessagingTypes.Module) {
  if (Platform.OS === 'android') {
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version);

    if (apiLevel >= 33) {
      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      const currentStatus = await PermissionsAndroid.check(permission);

      if (!currentStatus) {
        await PermissionsAndroid.request(permission);
      }
    }

    return true;
  }

  const authorizationStatus = await requestPermission(messaging);

  return (
    authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

async function registerForFirebaseMessaging(messaging: FirebaseMessagingTypes.Module) {
  const permissionGranted = await requestNotificationPermission(messaging);

  if (!permissionGranted) {
    return null;
  }

  await registerDeviceForRemoteMessages(messaging);
  return getToken(messaging);
}

export function useFirebaseMessaging() {
  useEffect(() => {
    let mounted = true;
    let unsubscribeFromMessage: (() => void) | undefined;
    let unsubscribeFromOpenedApp: (() => void) | undefined;
    let unsubscribeFromTokenRefresh: (() => void) | undefined;

    async function startMessaging() {
      try {
        const messaging = getMessagingModule();

        setBackgroundMessageHandler(messaging, async remoteMessage => {
          console.log('FCM background message:', remoteMessage.messageId, remoteMessage.data);
        });

        unsubscribeFromMessage = onMessage(messaging, async remoteMessage => {
          console.log('FCM foreground message:', remoteMessage.messageId, remoteMessage.data);
        });

        unsubscribeFromOpenedApp = onNotificationOpenedApp(messaging, remoteMessage => {
          console.log('FCM notification opened app:', remoteMessage.messageId, remoteMessage.data);
        });

        unsubscribeFromTokenRefresh = onTokenRefresh(messaging, token => {
          console.log('FCM token refreshed:', token);
        });

        const token = await registerForFirebaseMessaging(messaging);

        if (mounted && token) {
          console.log('FCM token:', token);
        }
      } catch (error) {
        console.warn('Failed to initialize Firebase Messaging:', error);
      }
    }

    startMessaging();

    return () => {
      mounted = false;
      unsubscribeFromMessage?.();
      unsubscribeFromOpenedApp?.();
      unsubscribeFromTokenRefresh?.();
    };
  }, []);
}
