// _layout.tsx
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getStoredAuthData } from '@/services/auth';
import { addNotificationListeners, debugNotificationHandling, getFCMToken, sendTokenToBackend, setForegroundNotificationHandler, setupBackgroundMessageHandler, setupFCMListeners } from '@/services/notifications';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import "../styles/global.css";

function InitialAuthCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Notifications setup once on app start
    setForegroundNotificationHandler();
    const unsubscribe = addNotificationListeners(
      undefined,
      (response) => {
        console.log('🔔 Notification response received:', response);
        handleNotificationResponse(response);
      }
    );
    
    // Set up Firebase Cloud Messaging listeners
    const unsubscribeFCM = setupFCMListeners();
    
    // Set up background message handler
    setupBackgroundMessageHandler();
    
    // Set up debug listeners for notification handling
    const debugCleanup = debugNotificationHandling();
    
    // Get native FCM token and send to backend (only with valid userId)
    getFCMToken().then(async (token) => {
      if (!token) return;
      console.log('[notifications] Native FCM Token obtained:', token);
      try {
        const auth = await getStoredAuthData();
        const userId = auth?.userId?.trim();
        const isValidObjectId = !!userId && /^[a-f0-9]{24}$/i.test(userId);
        if (!isValidObjectId) {
          console.log('[notifications] Skipping FCM registration: invalid or missing userId', { userId });
          return;
        }
        await sendTokenToBackend(token, userId as string);
      } catch (e) {
        console.warn('Failed to register native FCM token with server', e);
      }
    });

    return () => {
      unsubscribe?.();
      unsubscribeFCM?.();
      debugCleanup?.();
    };
  }, []);

  const handleNotificationResponse = (response: any) => {
    try {
      console.log('🔔 Handling notification response:', response);
      
      const action = response.notification?.request?.content?.data?.action;
      const type = response.notification?.request?.content?.data?.type;
      
      if (action === 'open_chat' || type === 'welcome') {
        console.log('🔔 Navigating to chat screen from notification');
        router.push('/(main)/chat/default');
      } else {
        console.log('🔔 No specific action, navigating to home from notification');
        router.push('/(main)/home');
      }
    } catch (error) {
      console.error('🔔 Error handling notification response:', error);
    }
  };

  // Check for pending notification navigation
  const checkPendingNotificationNavigation = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const navigationData = await AsyncStorage.getItem('notification_navigation');
      
      if (navigationData) {
        const { route, timestamp } = JSON.parse(navigationData);
        
        // Only process if it's recent (within last 30 seconds)
        if (Date.now() - timestamp < 30000) {
          console.log('🔔 Processing pending notification navigation:', route);
          
          // Clear the stored navigation
          await AsyncStorage.removeItem('notification_navigation');
          
          // Navigate to the route
          router.push(route);
        } else {
          // Clean up old navigation data
          await AsyncStorage.removeItem('notification_navigation');
        }
      }
    } catch (error) {
      console.error('🔔 Error checking pending notification navigation:', error);
    }
  };

  useEffect(() => {
    // Don't do anything until the navigation state is ready
    if (!navigationState?.key) {
      return;
    };

    // Check for pending notification navigation when app becomes active
    checkPendingNotificationNavigation();

    const checkAuthState = async () => {
      try {
        console.log(`[${Platform.OS}] App Starting...`, { segments });
        console.log(`[${Platform.OS}] Navigation state ready:`, navigationState?.key);
        
        // Prevent multiple navigations Check the Platform
        if (hasNavigated) {
          console.log(`[${Platform.OS}] Already navigated, skipping`);
          setIsLoading(false);
          return;
        }

        // Handle various initial states
        const shouldRedirectToOnboarding = 
          segments.length === 0 as any ||
          (segments as string[]).includes('+not-found') ||
          (segments as string[]).includes('_sitemap') ||
          !segments[0];


        if (shouldRedirectToOnboarding) {
          console.log(`[${Platform.OS}] Redirecting to onboarding from:`, segments);
          setHasNavigated(true);
          
          // Use timeout for iOS stability
          const delay = Platform.OS === 'ios' ? 300 : 100;
          setTimeout(() => {
            router.replace('/(onboarding)/screen1');
            setIsLoading(false);
          }, delay);
          return;
        }

        // Skip if already on onboarding
        if (segments[0] === '(onboarding)') {
          console.log(`[${Platform.OS}] Already on onboarding, skipping redirect`);
          setIsLoading(false);
          return;
        }

        // Check authentication for protected routes
        const authData = await getStoredAuthData();
        const isProtectedRoute = segments[0] === '(main)';
        
        if (isProtectedRoute && (!authData?.token || !authData?.userId)) {
          console.log(`[${Platform.OS}] Unauthenticated access to protected route, redirecting`);
          setHasNavigated(true);
          
          const delay = Platform.OS === 'ios' ? 300 : 100;
          setTimeout(() => {
            router.replace('/(onboarding)/screen1');
            setIsLoading(false);
          }, delay);
          return;
        }

        // All checks passed
        setIsLoading(false);
        
      } catch (error) {
        console.error(`[${Platform.OS}] Error in auth check:`, error);
        
        // Fallback to onboarding on error
        if (!hasNavigated) {
          setHasNavigated(true);
          const delay = Platform.OS === 'ios' ? 300 : 100;
          setTimeout(() => {
            router.replace('/(onboarding)/screen1');
            setIsLoading(false);
          }, delay);
        }
      }
    };

    checkAuthState();
  }, [router, segments, navigationState?.key, hasNavigated]);

  // Show loading while checking auth or navigating
  if (isLoading || !navigationState?.key) {
    return null; // You can return a loading spinner here
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    DMSans: require('../assets/fonts/DMSans-Regular.ttf'),
    Lexend: require('../assets/fonts/Lexend-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <InitialAuthCheck>
              <Stack screenOptions={{ headerShown: false, animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right' }}>
                <Stack.Screen 
                  name="(onboarding)" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="(auth)" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="(main)" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="+not-found" 
                  options={{ 
                    headerShown: false,
                    presentation: 'modal' 
                  }} 
                />
              </Stack>
            </InitialAuthCheck>
            <StatusBar style="light" />
          </GestureHandlerRootView>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
