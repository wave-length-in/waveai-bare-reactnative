import messaging from '@react-native-firebase/messaging';
import 'expo-router/entry';

// Register background handler - must be at the top level
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('🔔 FCM message received in background (index.js):', remoteMessage);
  // Background notifications are automatically displayed by NotificationService.kt
});

