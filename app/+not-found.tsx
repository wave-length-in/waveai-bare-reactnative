import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';

export default function NotFound() {
  useEffect(() => {
    // Immediately redirect to onboarding
    const timeout = setTimeout(() => {
      router.replace('/(onboarding)/screen1');
    }, 100); // Very short delay to prevent flash

    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient
      colors={["#000", "#111"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <Image
        source={require('../assets/images/wave-new-logo2.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
