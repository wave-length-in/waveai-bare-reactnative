import { API_URL } from '@/config/apiUrl';
import messaging from '@react-native-firebase/messaging';
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


