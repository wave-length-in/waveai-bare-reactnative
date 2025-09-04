import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getStoredAuthData } from '@/services/auth';
import { navigateTo } from '@/utils/router-helper';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import "../styles/global.css";
// import { initAnalytics } from '@/firebase/analytics';

function InitialAuthCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log("App Starting...")
        // Always redirect to onboarding first if no route is specified
        if (segments.length === 0 as number) {
          console.log('App starting - redirecting to onboarding');
          navigateTo.replaceToOnboarding();
          return;
        }

        // Check if trying to access protected routes without auth
        const authData = await getStoredAuthData();
        const inProtectedGroup = segments[0] === '(main)' || segments[0] === 'chat';
        
        if (inProtectedGroup && (!authData?.token || !authData?.userId)) {
          console.log('Redirecting unauthenticated user trying to access protected route');
          navigateTo.replaceToOnboarding();
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        
        // On error, redirect to onboarding to start fresh
        if (segments.length === 0 as number) {
          console.log('Error occurred, redirecting to onboarding');
          navigateTo.replaceToOnboarding();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, [router, segments]);

  // Don't render children until auth check is complete
  if (isLoading) {
    return null; // Or return a loading screen component
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

  // Initialize analytics when app starts
  // useEffect(() => {
  //   initAnalytics();
  // }, []);

  if (!loaded) {
    return null;
  };

  return (
    <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
        <AuthProvider>
          <GestureHandlerRootView>
            <InitialAuthCheck>
              <Stack>
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
              </Stack>
            </InitialAuthCheck>
            <StatusBar style="light" />
          </GestureHandlerRootView>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};