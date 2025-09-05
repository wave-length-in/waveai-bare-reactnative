// _layout.tsx
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getStoredAuthData } from '@/services/auth';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import "../styles/global.css";

function InitialAuthCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Don't do anything until the navigation state is ready
    if (!navigationState?.key) {
      return;
    }

    const checkAuthState = async () => {
      try {
        console.log(`[${Platform.OS}] App Starting...`, { segments });
        console.log(`[${Platform.OS}] Navigation state ready:`, navigationState?.key);
        
        // Prevent multiple navigations
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
