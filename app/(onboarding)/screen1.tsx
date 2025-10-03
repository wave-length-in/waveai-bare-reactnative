import { getStoredAuthData } from '@/services/auth';
import { navigateTo } from '@/utils/routing-helper';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiText, MotiView } from 'moti';
import React, { useEffect } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppEventsLogger } from 'react-native-fbsdk-next';

export default function OnboardingScreen() {
  const handleGetStarted = async () => {
    console.log('Pressing Button');
    try {
      AppEventsLogger.logEvent('LetsChatButtonPressed');
    } catch (e) {
      // ignore logging failures
    }
    try {
      const authData = await getStoredAuthData();
      if (authData?.token && authData?.userId) {
        console.log('User is authenticated, redirecting to chat');
        navigateTo.defaultChat();
      } else {
        console.log('User is not authenticated, redirecting to login');
        navigateTo.login();
      }
    } catch (error) {
      console.error('Error checking auth in onboarding button:', error);
      navigateTo.login();
    }
  };

  // Auto-trigger handleGetStarted on iOS after 2 seconds
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const timer = setTimeout(() => {
        handleGetStarted();
      }, 2000); // 2-second delay

      // Cleanup timeout on component unmount
      return () => clearTimeout(timer);
    }
  }, []); // Empty dependency array to run once on mount

  return (
    <LinearGradient
      colors={['#000', '#111']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Cosmic Background Overlay */}
      <View style={styles.backgroundOverlay} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(30, 144, 255, 0.2)', 'transparent']}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 1, y: 0.7 }}
          style={styles.cosmicGradient}
          pointerEvents="none"
        />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.imageContainer}
        >
          <View style={styles.imageWrapper}>
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 400 }}
              style={styles.imageMotiWrapper}
            >
              <Image
                source={require('../../assets/images/zenny.jpg')}
                style={styles.profileImage}
                resizeMode="cover"
              />
            </MotiView>
          </View>
        </MotiView>

        <MotiText
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 700, duration: 800 }}
          style={styles.titleText}
        >
          Hii, I'm Zenny!
        </MotiText>

        <MotiText
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1200, duration: 1000 }}
          style={styles.subtitleText}
        >
          Your AI Friend, Listener, and Secret-Keeper.
        </MotiText>
      </View>

      {/* Get Started Button */}
      <View style={[styles.buttonContainer, { zIndex: 10 }]}>
        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => [
            styles.touchableButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <LinearGradient
            colors={['#19A4EA', '#111']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Let's chat</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Floating Stars */}
      <MotiView
        from={{ translateY: 0, opacity: 0.6 }}
        animate={{ translateY: -10, opacity: 1 }}
        transition={{ loop: true, type: 'timing', duration: 2000, delay: 200 }}
        style={[styles.floatingStar, styles.star1]}
      />
      <MotiView
        from={{ translateY: 0, opacity: 0.6 }}
        animate={{ translateY: -8, opacity: 1 }}
        transition={{ loop: true, type: 'timing', duration: 1800, delay: 400 }}
        style={[styles.floatingStar, styles.star2]}
      />
      <MotiView
        from={{ translateY: 0, opacity: 0.6 }}
        animate={{ translateY: -12, opacity: 1 }}
        transition={{ loop: true, type: 'timing', duration: 2200, delay: 600 }}
        style={[styles.floatingStar, styles.star3]}
      />
      <MotiView
        from={{ translateY: 0, opacity: 0.6 }}
        animate={{ translateY: -9, opacity: 1 }}
        transition={{ loop: true, type: 'timing', duration: 2400, delay: 800 }}
        style={[styles.floatingStar, styles.star4]}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cosmicGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 64,
  },
  imageWrapper: {
    width: 192,
    height: 192,
    borderRadius: 96,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageMotiWrapper: {
    width: '100%',
    height: '100%',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  titleText: {
    color: '#fff',
    fontSize: 44,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 80,
    paddingHorizontal: 16,
    lineHeight: 28,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  touchableButton: {
    borderRadius: 9999,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 9999,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  floatingStar: {
    position: 'absolute',
    borderRadius: 50,
  },
  star1: {
    top: 80,
    left: 40,
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  star2: {
    top: 128,
    right: 64,
    width: 4,
    height: 4,
    backgroundColor: 'rgba(147, 197, 253, 0.6)',
  },
  star3: {
    bottom: 128,
    left: 80,
    width: 6,
    height: 6,
    backgroundColor: 'rgba(196, 181, 253, 0.5)',
  },
  star4: {
    top: 192,
    right: 32,
    width: 4,
    height: 4,
    backgroundColor: 'rgba(103, 232, 249, 0.4)',
  },
});