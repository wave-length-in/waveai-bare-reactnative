import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getStoredAuthData, STORAGE_KEYS } from '@/services/auth';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import "../styles/global.css";

function InitialAuthCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Get stored auth data
        const authData = await getStoredAuthData();
        
        console.log('Auth Check - Stored Data:', {
          hasToken: !!authData?.token,
          hasUserId: !!authData?.userId,
          userData: authData?.userData
        });

        if (authData?.token && authData?.userId) {
          setIsAuthenticated(true);
          
          // Check if user is not already in a protected route
          const inAuthGroup = segments[0] === '(auth)' || segments[0] === '(onboarding)';
          
          if (inAuthGroup) {
            console.log('Redirecting authenticated user to chat:', authData.userId);
            // For now using hardcoded URL as requested, but you can use authData.userId
            router.replace('/chat/688210873496b5e441480d22');
            // If you want to use the actual stored userId, uncomment this:
            // router.replace(`/chat/${authData.userId}`);
          }
        } else {
          setIsAuthenticated(false);
          
          // Check if user is trying to access protected routes without auth
          const inProtectedGroup = segments[0] === '(main)' || segments[0] === 'chat';
          
          if (inProtectedGroup) {
            console.log('Redirecting unauthenticated user to login');
            router.replace('/(auth)/loginScreen');
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setIsAuthenticated(false);
        
        // On error, redirect to login if not already in auth flow
        const inAuthGroup = segments[0] === '(auth)' || segments[0] === '(onboarding)';
        if (!inAuthGroup) {
          router.replace('/(auth)/loginScreen');
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

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
        <AuthProvider>
          <GestureHandlerRootView>
            <InitialAuthCheck>
              <Stack>
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(main)" options={{ headerShown: false }} />
                <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
              </Stack>
            </InitialAuthCheck>
            <StatusBar style="light" />
          </GestureHandlerRootView>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}