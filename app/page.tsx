import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to onboarding after a brief delay
    const timer = setTimeout(() => {
      router.replace('/(onboarding)/screen1');
    }, 1000); // 1 second splash screen

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#000", "#111"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="flex-1 items-center justify-center"
      >
        {/* Wave Logo */}
        <View className="w-32 h-32 mb-8">
          <Image
            source={require('../assets/images/wave-new-logo2.png')}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    </View>
  );
}
