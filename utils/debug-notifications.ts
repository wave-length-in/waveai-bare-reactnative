import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Debug utility to check notification data
export const debugNotificationData = async () => {
  try {
    console.log('🔍 === NOTIFICATION DEBUG INFO ===');
    
    // Check AsyncStorage data
    const navigationData = await AsyncStorage.getItem('notification_navigation');
    const androidData = await AsyncStorage.getItem('android_notification_click');
    
    console.log('🔍 Platform:', Platform.OS);
    console.log('🔍 Navigation data:', navigationData);
    console.log('🔍 Android notification data:', androidData);
    
    // Check if sound file exists (Android only)
    if (Platform.OS === 'android') {
      console.log('🔍 Android: Checking for sound file...');
      // This is just for logging - we can't actually check file existence in JS
      console.log('🔍 Expected sound path: android/app/src/main/res/raw/sound.wav');
    }
    
    console.log('🔍 === END DEBUG INFO ===');
    
    return {
      navigationData,
      androidData,
      platform: Platform.OS
    };
  } catch (error) {
    console.error('🔍 Error in debug notification data:', error);
    return null;
  }
};

// Test function to simulate notification click
export const testNotificationClick = async () => {
  try {
    console.log('🧪 === TESTING NOTIFICATION CLICK ===');
    
    // Store test data
    const testData = {
      route: '/(main)/chat/default',
      action: 'open_chat',
      type: 'welcome',
      timestamp: Date.now(),
      source: 'test_click'
    };
    
    await AsyncStorage.setItem('android_notification_click', JSON.stringify(testData));
    
    console.log('🧪 Test data stored:', testData);
    console.log('🧪 === TEST COMPLETE ===');
    
    return testData;
  } catch (error) {
    console.error('🧪 Error in test notification click:', error);
    return null;
  }
};

// Clear all notification data
export const clearAllNotificationData = async () => {
  try {
    console.log('🗑️ Clearing all notification data...');
    
    await AsyncStorage.removeItem('notification_navigation');
    await AsyncStorage.removeItem('android_notification_click');
    
    console.log('🗑️ All notification data cleared');
  } catch (error) {
    console.error('🗑️ Error clearing notification data:', error);
  }
};
