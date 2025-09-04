// // analytics.ts - Simple Expo Analytics
// import * as Analytics from 'expo-firebase-analytics';
// import * as Device from 'expo-device';
// import { Platform } from 'react-native';
// import Constants from 'expo-constants';

// // Type definitions
// interface EventData {
//   [key: string]: string | number | boolean;
// }

// interface ButtonClickData {
//   screen?: string;
//   step?: number;
//   action?: string;
//   link_type?: string;
//   source?: string;
//   [key: string]: string | number | boolean | undefined;
// }

// // Initialize analytics - call this in App.tsx
// export const initAnalytics = async (): Promise<void> => {
//   try {
//     await Analytics.setAnalyticsCollectionEnabled(true);
//     console.log('Expo Analytics initialized');
//   } catch (error) {
//     console.log('Analytics init error:', error);
//   }
// };

// // Simple event tracking
// export const logEvent = async (eventName: string, parameters: EventData = {}): Promise<void> => {
//   try {
//     const eventData: EventData = {
//       ...parameters,
//       platform: Platform.OS,
//       device_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
//       device_name: Device.deviceName || 'Unknown',
//       app_version: Constants.expoConfig?.version || '1.0.0',
//       timestamp: Date.now()
//     };

//     await Analytics.logEvent(eventName, eventData);
//     console.log(`Event: ${eventName}`, eventData);
//   } catch (error) {
//     console.error('Analytics error:', error);
//   }
// };

// // Track button clicks - main function you'll use
// export const trackButtonClick = async (buttonName: string, additionalData: ButtonClickData = {}): Promise<void> => {
//   await logEvent('button_click', {
//     button_name: buttonName,
//     event_category: 'user_interaction',
//     ...additionalData
//   });
// };

// // Track screen views
// export const trackScreen = async (screenName: string): Promise<void> => {
//   try {
//     await logEvent('screen_view', { 
//       screen_name: screenName,
//       screen_class: screenName 
//     });
//     console.log('Screen tracked:', screenName);
//   } catch (error) {
//     console.error('Screen tracking error:', error);
//   }
// };

// // Set user properties
// export const setUserProperty = async (name: string, value: string): Promise<void> => {
//   try {
//     await Analytics.setUserProperty(name, value);
//   } catch (error) {
//     console.error('User property error:', error);
//   }
// };