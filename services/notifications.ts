import { API_URL } from '@/config/apiUrl';
import messaging, { FirebaseMessagingTypes as FMT } from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// FCM v1 API helper for server-side sending
export interface FCMv1Message {
  token: string;
  notification?: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  android?: {
    notification?: {
      click_action?: string;
      sound?: string;
    };
  };
  apns?: {
    payload?: {
      aps?: {
        category?: string;
        sound?: string;
      };
    };
  };
}

// Example server-side FCM v1 send function
export async function sendFCMv1Notification(
  projectId: string,
  accessToken: string,
  message: FCMv1Message
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getFCMToken(): Promise<string | null> {
  try {
    // For Android 13+ (API 33+), we need to request POST_NOTIFICATIONS permission first
    if (Platform.OS === 'android') {
      const { status: currentStatus } = await Notifications.getPermissionsAsync();
      
      if (currentStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: true,
            provideAppNotificationSettings: true,
            allowProvisional: true,
          },
        });
        
        if (status !== 'granted') {
          console.log('Notification permission not granted');
          return null;
        }
      }
    }

    // Request permissions for FCM
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('FCM permission not granted');
      return null;
    }

    // Get native FCM token
    const token = await messaging().getToken();
    console.log('Native FCM Token:', token);
    
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    return null;
  }

  // Get native FCM token
  return await getFCMToken();
}

export function setForegroundNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      // iOS-specific properties required by NotificationBehavior
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function addNotificationListeners(
  onReceive?: (notification: Notifications.Notification) => void,
  onRespond?: (response: Notifications.NotificationResponse) => void,
) {
  const receiveSub = Notifications.addNotificationReceivedListener((n) => {
    onReceive?.(n);
  });
  const respondSub = Notifications.addNotificationResponseReceivedListener((r) => {
    onRespond?.(r);
  });

  return () => {
    receiveSub.remove();
    respondSub.remove();
  };
}

// Backend integration - sends native FCM token
export async function sendTokenToBackend(token: string, userId: string = 'your-user-id') {
  try {

    console.log('Sending token to backend:', token);
    console.log('User ID:', userId);
    console.log('API URL:', `${API_URL}/fcm/register-token`);
    // Enhanced diagnostics with timeout and verbose logs
    const controller = new AbortController();
    const timeoutMs = 10000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const requestBody = {
      fcm_token: token,
      device_info: {
        platform: Platform.OS,
        app_version: '1.0.0',
      },
    };

    console.log('[fcm] Request headers:', {
      'Content-Type': 'application/json',
      'User-ID': userId,
    });
    console.log('[fcm] Request body:', requestBody);

    let response: Response;
    try {
      response = await fetch(`${API_URL}/fcm/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    console.log('[fcm] Response status:', response.status, response.statusText);
    const rawText = await response.text();
    console.log('[fcm] Raw response text:', rawText);
    const contentType = response.headers.get('content-type') || '';

    let parsedBody: unknown = rawText;
    if (contentType.includes('application/json')) {
      try { parsedBody = JSON.parse(rawText); } catch {}
    }

    if (!response.ok) {
      const errorInfo = {
        status: response.status,
        statusText: response.statusText,
        url: `${API_URL}/fcm/register-token`,
        body: parsedBody,
      };
      console.error('[fcm] Registration failed', errorInfo);
      throw new Error(`FCM token registration failed: ${response.status} ${response.statusText}`);
    }

    console.log('Native FCM Token registered:', parsedBody);
    return parsedBody as any;
  } catch (error) {
    const enriched: any = {
      name: (error as any)?.name,
      message: (error as any)?.message,
      code: (error as any)?.code,
      stack: (error as any)?.stack,
    };
    console.error('Error registering native FCM token:', enriched);
    console.log('[fcm] Diagnostics:', {
      apiUrl: API_URL,
      reachableHint: 'Ensure device and server share the same LAN; avoid localhost',
      androidNetworkNote: 'Android cannot reach your PC\'s 127.0.0.1; use machine IP',
      timeoutMs: 10000,
    });
    throw error;
  }
}

export async function registerFcmTokenWithServer(userId: string, token: string, deviceInfo?: any) {
  const res = await fetch(`${API_URL}/fcm/register-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId,
    },
    body: JSON.stringify({
      fcm_token: token,
      device_info: deviceInfo ?? {
        platform: Platform.OS,
        app_version: '1.0.0',
      },
    }),
  });
  if (!res.ok) throw new Error('Failed to register FCM token');
  return res.json();
}

export async function triggerFcmTest(userId: string, testType: 'basic' | 'advanced' = 'basic') {
  const res = await fetch(`${API_URL}/fcm/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId,
    },
    body: JSON.stringify({ test_type: testType }),
  });
  if (!res.ok) throw new Error('Failed to trigger FCM test');
  return res.json();
}

// Utility function to reset notification permission prompt
export async function resetNotificationPermissionPrompt() {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.removeItem('notification_permission_asked');
  console.log('Notification permission prompt has been reset');
}

// Set up Firebase Cloud Messaging listeners
export function setupFCMListeners() {
  // Handle foreground messages
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage: FMT.RemoteMessage) => {
    console.log('🔔 FCM message received in foreground:', remoteMessage);
    
    if (remoteMessage.notification) {
      const { title, body } = remoteMessage.notification;
      
      // Create a local notification to display it
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'Wave AI',
          body: body || 'New message',
          data: remoteMessage.data,
          sound: 'sound.wav', // Use custom sound
        },
        trigger: null, // Show immediately
      });
    }
  });

  // Handle background/quit state messages (notification tap)
  messaging().onNotificationOpenedApp((remoteMessage: FMT.RemoteMessage) => {
    console.log('🔔 Notification opened app from background:', remoteMessage);
    handleNotificationClick(remoteMessage);
  });

  // Handle notification that opened app from quit state
  messaging()
    .getInitialNotification()
    .then((remoteMessage: FMT.RemoteMessage | null) => {
      if (remoteMessage) {
        console.log('🔔 Notification opened app from quit state:', remoteMessage);
        handleNotificationClick(remoteMessage);
      }
    });

  // Handle token refresh
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token: string) => {
    console.log('🔄 FCM token refreshed:', token);
    // You might want to send the new token to your backend
  });

  // Return cleanup function
  return () => {
    unsubscribeForeground();
    unsubscribeTokenRefresh();
  };
}

// Handle notification click to navigate to chat
export function handleNotificationClick(remoteMessage: FMT.RemoteMessage) {
  try {
    console.log('🔔 Handling notification click:', JSON.stringify(remoteMessage, null, 2));
    
    // Check if the notification has action data
    const action = remoteMessage.data?.action;
    const type = remoteMessage.data?.type;
    
    console.log('🔔 Notification data:', { action, type, data: remoteMessage.data });
    
    if (action === 'open_chat' || type === 'welcome') {
      console.log('🔔 Navigating to chat screen');
      
      // Store navigation intent for later use
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.setItem('notification_navigation', JSON.stringify({
        route: '/(main)/chat/default',
        timestamp: Date.now(),
        source: 'fcm_click'
      })).then(() => {
        console.log('🔔 Navigation intent stored successfully');
      }).catch((error: any) => {
        console.error('🔔 Error storing navigation intent:', error);
      });
      
      // Try to navigate immediately if app is active
      try {
        const { router } = require('expo-router');
        console.log('🔔 Attempting immediate navigation to chat');
        router.push('/(main)/chat/default');
        console.log('🔔 Navigation command sent');
      } catch (routerError) {
        console.log('🔔 Router not available, navigation will be handled in app:', routerError);
      }
    } else {
      console.log('🔔 No specific action, navigating to default chat');
      
      // Store navigation intent for later use
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.setItem('notification_navigation', JSON.stringify({
        route: '/(main)/chat/688210873496b5e441480d22',
        timestamp: Date.now(),
        source: 'fcm_click'
      })).then(() => {
        console.log('🔔 Navigation intent stored successfully');
      }).catch((error: any) => {
        console.error('🔔 Error storing navigation intent:', error);
      });
      
      // Try to navigate immediately if app is active
      try {
        const { router } = require('expo-router');
        console.log('🔔 Attempting immediate navigation to default chat');
        router.push('/(main)/chat/688210873496b5e441480d22');
        console.log('🔔 Navigation command sent');
      } catch (routerError) {
        console.log('🔔 Router not available, navigation will be handled in app:', routerError);
      }
    }
  } catch (error) {
    console.error('🔔 Error handling notification click:', error);
  }
}

// Set up background message handler (must be called at the top level)
export function setupBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage: FMT.RemoteMessage) => {
    console.log('🔔 FCM message received in background:', remoteMessage);
    // Background messages are handled by the native NotificationService
  });
}

// Debug function to test notification handling
export const debugNotificationHandling = () => {
  console.log('🔧 Debug: Setting up notification debug listeners');
  
  // Test FCM listeners
  const unsubscribe = messaging().onMessage((remoteMessage: FMT.RemoteMessage) => {
    console.log('🔧 Debug: FCM foreground message:', remoteMessage);
  });
  
  const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage: FMT.RemoteMessage) => {
    console.log('🔧 Debug: FCM notification opened app:', remoteMessage);
  });
  
  const unsubscribeInitial = messaging().getInitialNotification().then((remoteMessage: FMT.RemoteMessage | null) => {
    if (remoteMessage) {
      console.log('🔧 Debug: FCM initial notification:', remoteMessage);
    }
  });
  
  // Test Expo notification listeners with error handling
  let expoReceiveSub: any = null;
  let expoResponseSub: any = null;
  
  try {
    expoReceiveSub = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('🔧 Debug: Expo notification received:', notification);
    });
    
    expoResponseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('🔧 Debug: Expo notification response:', response);
    });
  } catch (error) {
    console.log('🔧 Debug: Expo notifications not available:', error);
  }
  
  return () => {
    unsubscribe();
    unsubscribeOpened();
    if (expoReceiveSub) expoReceiveSub.remove();
    if (expoResponseSub) expoResponseSub.remove();
  };
};


