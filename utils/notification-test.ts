import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Test notification data flow
export const testNotificationFlow = async () => {
  try {
    console.log('🧪 Testing notification flow...');
    
    // Simulate Android notification click data
    const testData = {
      route: '/(main)/chat/default',
      action: 'open_chat',
      type: 'welcome',
      timestamp: Date.now(),
      source: 'test_android_notification'
    };
    
    console.log('🧪 Storing test notification data:', testData);
    await AsyncStorage.setItem('android_notification_click', JSON.stringify(testData));
    
    console.log('🧪 Test data stored. Check logs for navigation...');
    
    // Force navigation check
    setTimeout(() => {
      console.log('🧪 Testing direct navigation...');
      router.push('/(main)/chat/default');
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('🧪 Test error:', error);
    return false;
  }
};

// Check stored notification data
export const checkNotificationData = async () => {
  try {
    console.log('🔍 Checking notification data...');
    
    const navigationData = await AsyncStorage.getItem('notification_navigation');
    const androidData = await AsyncStorage.getItem('android_notification_click');
    
    console.log('🔍 Navigation data:', navigationData);
    console.log('🔍 Android notification data:', androidData);
    
    return {
      navigationData: navigationData ? JSON.parse(navigationData) : null,
      androidData: androidData ? JSON.parse(androidData) : null
    };
  } catch (error) {
    console.error('🔍 Check error:', error);
    return null;
  }
};

// Clear all notification data
export const clearNotificationData = async () => {
  try {
    console.log('🧹 Clearing notification data...');
    await AsyncStorage.removeItem('notification_navigation');
    await AsyncStorage.removeItem('android_notification_click');
    console.log('🧹 Notification data cleared');
    return true;
  } catch (error) {
    console.error('🧹 Clear error:', error);
    return false;
  }
};

// Make functions available globally for console testing
if (typeof global !== 'undefined') {
  global.testNotificationFlow = testNotificationFlow;
  global.checkNotificationData = checkNotificationData;
  global.clearNotificationData = clearNotificationData;
}

console.log('🔧 Notification test utilities loaded. Available functions:');
console.log('  - testNotificationFlow()');
console.log('  - checkNotificationData()');
console.log('  - clearNotificationData()');