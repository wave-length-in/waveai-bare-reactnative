// Create this file: utils/routing-helper.ts
import { router } from 'expo-router';

export const AppRoutes = {
  onboarding: '/(onboarding)/screen1',
  login: '/(auth)/loginScreen',
  basicDetails: '/(auth)/basicDetails',
  chat: (id: string) => `/chat/${id}`,
  defaultChat: '/chat/688210873496b5e441480d22',
} as const;

export const navigateTo = {
  onboarding: () => router.replace(AppRoutes.onboarding as any),
  login: () => router.push(AppRoutes.login as any),
  basicDetails: () => router.push(AppRoutes.basicDetails as any),
  chat: (id: string) => router.push(AppRoutes.chat(id) as any),
  defaultChat: () => router.push(AppRoutes.defaultChat as any),
  
  // Replace versions
  replaceToOnboarding: () => router.replace(AppRoutes.onboarding as any),
  replaceToLogin: () => router.replace(AppRoutes.login as any),
  replaceToChat: (id: string) => router.replace(AppRoutes.chat(id) as any),
  replaceToDefaultChat: () => router.replace(AppRoutes.defaultChat as any),
};