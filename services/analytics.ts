import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Initialize Mixpanel
let mixpanel: any = null;

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const authData = await AsyncStorage.getItem('authData');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.userId || null;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get current user ID:', error);
    return null;
  }
};

// Initialize Mixpanel with token from environment following official documentation
export const initializeMixpanel = async () => {
  try {
    const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || 'your_mixpanel_token_here';
    
    if (MIXPANEL_TOKEN === 'your_mixpanel_token_here') {
      console.warn('⚠️ Mixpanel token not configured. Please set EXPO_PUBLIC_MIXPANEL_TOKEN in your environment variables.');
      return;
    }

    // Import Mixpanel class from the SDK following official documentation
    const { Mixpanel } = require('mixpanel-react-native');
    
    // Create an instance of Mixpanel using your project token
    // disable legacy autotrack mobile events
    const trackAutomaticEvents = false;
    mixpanel = new Mixpanel(MIXPANEL_TOKEN, trackAutomaticEvents);
    
    // Initialize Mixpanel
    mixpanel.init();
    
    // Enable debug logging in development
    if (__DEV__) {
      mixpanel.setLoggingEnabled(true);
    }
    
    console.log('✅ Mixpanel initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Mixpanel:', error);
  }
};

// Track events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (!mixpanel) {
      console.warn('⚠️ Mixpanel not initialized. Call initializeMixpanel() first.');
      return;
    }

    const eventProperties = {
      ...properties,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    };

    mixpanel.track(eventName, eventProperties);
    console.log(`📊 Tracked event: ${eventName}`, eventProperties);
  } catch (error) {
    console.error(`❌ Failed to track event ${eventName}:`, error);
  }
};

// Identify user - following official documentation
export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  try {
    if (!mixpanel) {
      console.warn('⚠️ Mixpanel not initialized. Call initializeMixpanel() first.');
      return;
    }

    // Call identify to associate future events with this user ID
    mixpanel.identify(userId);
    
    // Set user profile properties if provided
    if (userProperties) {
      mixpanel.getPeople().set(userProperties);
    }
    
    console.log(`👤 User identified: ${userId}`, userProperties);
  } catch (error) {
    console.error('❌ Failed to identify user:', error);
  }
};

// Set user properties - following official documentation
export const setUserProperties = (properties: Record<string, any>) => {
  try {
    if (!mixpanel) {
      console.warn('⚠️ Mixpanel not initialized. Call initializeMixpanel() first.');
      return;
    }

    // Set profile properties using getPeople().set() method
    mixpanel.getPeople().set(properties);
    console.log('👤 User properties set:', properties);
  } catch (error) {
    console.error('❌ Failed to set user properties:', error);
  }
};

// Track page views
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  trackEvent('Page View', {
    page_name: pageName,
    ...properties,
  });
};

// Authentication Events
export const trackLogin = (method: string, userId?: string) => {
  trackEvent('User Login', {
    login_method: method,
    user_id: userId,
  });
};

export const trackSignup = (method: string, userId?: string) => {
  trackEvent('User Signup', {
    signup_method: method,
    user_id: userId,
  });
};

export const trackLogout = () => {
  trackEvent('User Logout');
};

// Reset user data - following official documentation
export const resetUser = () => {
  try {
    if (!mixpanel) {
      console.warn('⚠️ Mixpanel not initialized. Call initializeMixpanel() first.');
      return;
    }

    // Clear local storage and generate new distinct_id
    mixpanel.reset();
    console.log('🔄 User data reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset user data:', error);
  }
};

// Set user properties only if they don't exist - following official documentation
export const setUserPropertiesOnce = (properties: Record<string, any>) => {
  try {
    if (!mixpanel) {
      console.warn('⚠️ Mixpanel not initialized. Call initializeMixpanel() first.');
      return;
    }

    // Set profile properties only if they don't exist yet
    mixpanel.getPeople().setOnce(properties);
    console.log('👤 User properties set once:', properties);
  } catch (error) {
    console.error('❌ Failed to set user properties once:', error);
  }
};

// Opt out of tracking - following official documentation
export const optOutTracking = () => {
  try {
    if (!mixpanel) {
      console.warn('⚠️ Mixpanel not initialized. Call initializeMixpanel() first.');
      return;
    }

    mixpanel.optOutTracking();
    console.log('🚫 User opted out of tracking');
  } catch (error) {
    console.error('❌ Failed to opt out of tracking:', error);
  }
};

// Opt in to tracking - following official documentation
export const optInTracking = () => {
  try {
    if (!mixpanel) {
      console.warn('⚠️ Mixpanel not initialized. Call initializeMixpanel() first.');
      return;
    }

    mixpanel.optInTracking();
    console.log('✅ User opted in to tracking');
  } catch (error) {
    console.error('❌ Failed to opt in to tracking:', error);
  }
};

// Chat Events - Focus on user behavior
export const trackChatInitiated = (userId: string, characterId: string, characterName: string) => {
  trackEvent('Chat Initiated', {
    user_id: userId,
    character_id: characterId,
    character_name: characterName,
  });
};

export const trackMessageSent = (userId: string, messageType: 'text' | 'audio' | 'image', messageLength?: number, characterId?: string) => {
  trackEvent('Message Sent', {
    user_id: userId,
    message_type: messageType,
    message_length: messageLength,
    character_id: characterId,
  });
};

export const trackAIResponse = (userId: string, responseTime?: number, characterId?: string) => {
  trackEvent('AI Response Received', {
    user_id: userId,
    response_time_ms: responseTime,
    character_id: characterId,
  });
};

export const trackVoiceRecording = (userId: string, action: 'start' | 'stop' | 'cancel', characterId?: string) => {
  trackEvent('Voice Recording', {
    user_id: userId,
    action,
    character_id: characterId,
  });
};

export const trackImageUpload = (userId: string, success: boolean, characterId?: string, source?: 'camera' | 'gallery') => {
  trackEvent('Image Upload', {
    user_id: userId,
    success,
    character_id: characterId,
    source,
  });
};

// Navigation Events
export const trackNavigation = (from: string, to: string) => {
  trackEvent('Navigation', {
    from_page: from,
    to_page: to,
  });
};

// User Interaction Events
export const trackButtonClick = (buttonName: string, page: string, properties?: Record<string, any>) => {
  trackEvent('Button Click', {
    button_name: buttonName,
    page,
    ...properties,
  });
};

// Convenience functions that automatically include user ID
export const trackUserEvent = async (eventName: string, properties?: Record<string, any>) => {
  const userId = await getCurrentUserId();
  trackEvent(eventName, {
    user_id: userId,
    ...properties,
  });
};

export const trackUserButtonClick = async (buttonName: string, page: string, properties?: Record<string, any>) => {
  const userId = await getCurrentUserId();
  trackEvent('Button Click', {
    user_id: userId,
    button_name: buttonName,
    page,
    ...properties,
  });
};

export const trackUserPageView = async (pageName: string, properties?: Record<string, any>) => {
  const userId = await getCurrentUserId();
  trackEvent('Page View', {
    user_id: userId,
    page_name: pageName,
    ...properties,
  });
};

export const trackFeatureUsage = (feature: string, properties?: Record<string, any>) => {
  trackEvent('Feature Used', {
    feature_name: feature,
    ...properties,
  });
};

// Error Tracking
export const trackError = (errorType: string, errorMessage: string, page?: string) => {
  trackEvent('Error Occurred', {
    error_type: errorType,
    error_message: errorMessage,
    page,
  });
};

// Performance Tracking
export const trackPerformance = (metric: string, value: number, unit: string) => {
  trackEvent('Performance Metric', {
    metric_name: metric,
    metric_value: value,
    metric_unit: unit,
  });
};

export default {
  initializeMixpanel,
  trackEvent,
  identifyUser,
  setUserProperties,
  setUserPropertiesOnce,
  resetUser,
  optOutTracking,
  optInTracking,
  trackPageView,
  trackUserPageView,
  trackLogin,
  trackSignup,
  trackLogout,
  trackChatInitiated,
  trackMessageSent,
  trackAIResponse,
  trackVoiceRecording,
  trackImageUpload,
  trackNavigation,
  trackButtonClick,
  trackUserButtonClick,
  trackUserEvent,
  trackFeatureUsage,
  trackError,
  trackPerformance,
};
