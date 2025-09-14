// utils/routing-helper.ts
import { router } from 'expo-router';

export const AppRoutes = {
  onboarding: '/(onboarding)/screen1',
  login: '/(auth)/loginScreen',
  basicDetails: '/(auth)/basicDetails',
  home: '/(main)/home',
  chat: (id: string) => `/(main)/chat/${id}`,
  defaultChat: '/(main)/chat/688210873496b5e441480d22',
  report: '/(main)/report',
} as const;

// Safe navigation with platform-specific handling
const safeNavigate = (path: string, replace: boolean = false) => {
  try {
    console.log(`Navigating to: ${path} (replace: ${replace})`);
    
    if (replace) {
      router.replace(path as any);
    } else {
      router.push(path as any);
    }
  } catch (error) {
    console.error(`Navigation error to ${path}:`, error);
    // Fallback navigation
    setTimeout(() => {
      try {
        if (replace) {
          router.replace(path as any);
        } else {
          router.push(path as any);
        }
      } catch (retryError) {
        console.error(`Retry navigation failed:`, retryError);
      }
    }, 100);
  }
};

export const navigateTo = {
  onboarding: () => safeNavigate(AppRoutes.onboarding),
  login: () => safeNavigate(AppRoutes.login),
  basicDetails: () => safeNavigate(AppRoutes.basicDetails),
  home: () => safeNavigate(AppRoutes.home),
  chat: (id: string) => safeNavigate(AppRoutes.chat(id)),
  defaultChat: () => safeNavigate(AppRoutes.defaultChat),
  report: () => safeNavigate(AppRoutes.report),
  
  // Replace versions
  replaceToOnboarding: () => safeNavigate(AppRoutes.onboarding, true),
  replaceToLogin: () => safeNavigate(AppRoutes.login, true),
  replaceToHome: () => safeNavigate(AppRoutes.home, true),
  replaceToChat: (id: string) => safeNavigate(AppRoutes.chat(id), true),
  replaceToDefaultChat: () => safeNavigate(AppRoutes.defaultChat, true),
  replaceToReport: () => safeNavigate(AppRoutes.report, true),
};