import { Platform } from 'react-native';

// Initialize Mixpanel
let mixpanel: any = null;

// Initialize Mixpanel with token from environment
export const initializeMixpanel = async () => {
  try {
    // You'll need to replace this with your actual Mixpanel token
    // You can get this from your Mixpanel project settings
    const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || 'your_mixpanel_token_here';
    
    if (MIXPANEL_TOKEN === 'your_mixpanel_token_here') {
      console.warn('⚠️ Mixpanel token not configured. Please set EXPO_PUBLIC_MIXPANEL_TOKEN in your environment variables.');
      return;
    }

    // Dynamic import to handle the module correctly
    const Mixpanel = require('mixpanel-react-native');
    mixpanel = new Mixpanel.default(MIXPANEL_TOKEN, true);
    await mixpanel.init();
    
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

// Identify user
export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  try {
    if (!mixpanel) {
      console.warn('⚠️ Mixpanel not initialized. Call initializeMixpanel() first.');
      return;
    }

    mixpanel.identify(userId);
    
    if (userProperties) {
      mixpanel.people.set(userProperties);
    }
    
    console.log(`👤 User identified: ${userId}`, userProperties);
  } catch (error) {
    console.error('❌ Failed to identify user:', error);
  }
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  try {
    if (!mixpanel) {
      console.warn('⚠️ Mixpanel not initialized. Call initializeMixpanel() first.');
      return;
    }

    mixpanel.people.set(properties);
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

// Chat Events
export const trackChatInitiated = (characterId: string, characterName: string) => {
  trackEvent('Chat Initiated', {
    character_id: characterId,
    character_name: characterName,
  });
};

export const trackMessageSent = (messageType: 'text' | 'audio' | 'image', characterId: string, messageLength?: number) => {
  trackEvent('Message Sent', {
    message_type: messageType,
    character_id: characterId,
    message_length: messageLength,
  });
};

export const trackAIResponse = (characterId: string, responseTime?: number) => {
  trackEvent('AI Response Received', {
    character_id: characterId,
    response_time_ms: responseTime,
  });
};

export const trackVoiceRecording = (action: 'start' | 'stop' | 'cancel', characterId: string) => {
  trackEvent('Voice Recording', {
    action,
    character_id: characterId,
  });
};

export const trackImageUpload = (characterId: string, success: boolean) => {
  trackEvent('Image Upload', {
    character_id: characterId,
    success,
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
  trackPageView,
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
  trackFeatureUsage,
  trackError,
  trackPerformance,
};
