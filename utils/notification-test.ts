import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Test function to simulate notification click
export const testNotificationClick = async () => {
  try {
    console.log('🧪 Testing notification click simulation');
    
    // Store navigation intent
    await AsyncStorage.setItem('notification_navigation', JSON.stringify({
      route: '/(main)/chat/default',
      timestamp: Date.now()
    }));
    
    // Try to navigate
    router.push('/(main)/chat/default');
    
    console.log('🧪 Navigation test completed');
  } catch (error) {
    console.error('🧪 Test error:', error);
  }
};

// Function to check stored notification data
export const checkNotificationData = async () => {
  try {
    const data = await AsyncStorage.getItem('notification_navigation');
    console.log('🔍 Stored notification data:', data);
    return data;
  } catch (error) {
    console.error('🔍 Error checking notification data:', error);
    return null;
  }
};

// Function to clear notification data
export const clearNotificationData = async () => {
  try {
    await AsyncStorage.removeItem('notification_navigation');
    console.log('🗑️ Cleared notification data');
  } catch (error) {
    console.error('🗑️ Error clearing notification data:', error);
  }
};
