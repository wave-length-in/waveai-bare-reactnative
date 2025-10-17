import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import OTPVerification from "@/components/auth/OtpVerification";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from '@/contexts/AuthContext';
import { identifyUser, trackButtonClick, trackLogin, trackPageView } from "@/services/analytics";
import { configureGoogleSignIn, loginUser, sendOtp, signInWithGoogle, STORAGE_KEYS, verifyOtp } from "@/services/auth";
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [snapPoints, setSnapPoints] = useState<string[]>(["50%"]);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Track page view when component mounts
  useEffect(() => {
    trackPageView('Login Screen');
  }, []);

  const handleKeyboardShow = () => {
    setIsKeyboardVisible(true);
    setSnapPoints(["60%", "80%"]);
  };

  const handleKeyboardHide = () => {
    setIsKeyboardVisible(false);
    setSnapPoints(["50%"]);
  };

  useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();
    
    const showSubscription = Keyboard.addListener("keyboardDidShow", handleKeyboardShow);
    const hideSubscription = Keyboard.addListener("keyboardDidHide", handleKeyboardHide);
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Handle snapping after snapPoints update
  useEffect(() => {
    const timer = setTimeout(() => {
      const targetIndex = isKeyboardVisible && snapPoints.length > 1 ? 1 : 0;
      if (targetIndex >= 0 && targetIndex < snapPoints.length) {
        bottomSheetRef.current?.snapToIndex(targetIndex);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [snapPoints, isKeyboardVisible]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    trackButtonClick('Google Sign In', 'Login Screen', { auth_method: 'google' });
    
    try {
      console.log('🔍 User initiated Google Sign-In...');
      const googleUser = await signInWithGoogle();
      
      // Check if user exists with this email
      try {
        const loginResponse = await loginUser(undefined, googleUser.email);
        
        if (loginResponse.success) {
          // User exists, login successful
          showToast("success", "Login Successful", "Welcome back!");
          
          // Track successful login following official documentation
          trackLogin('google', loginResponse.data.userId);
          
          // Identify user and set profile properties
          identifyUser(loginResponse.data.userId, {
            email: googleUser.email,
            name: googleUser.name,
            auth_method: 'google',
            login_date: new Date().toISOString()
          });
          
          // Navigate to chat with userId
          setTimeout(() => {
            router.push(`/chat/${loginResponse.data.userId}`);
          }, 1000);
        }
      } catch (loginError: any) {
        // User doesn't exist, redirect to Google signup flow
        if (loginError.message.includes("not found") || loginError.message.includes("does not exist")) {
          // Store Google user data for signup flow
          await AsyncStorage.setItem('googleUserData', JSON.stringify({
            ...googleUser,
            authMethod: 'google'
          }));
          
          showToast("info", "New User", "Let's complete your profile!");
          setTimeout(() => {
            router.push("/(auth)/googleSignup");
          }, 1000);
        } else {
          throw loginError;
        }
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      
      // Handle specific Google Sign-In errors gracefully
      if (error.message.includes("DEVELOPER_ERROR")) {
        showToast("error", "Google Sign-In Not Available", "Google Sign-In is not configured yet. Please use mobile number login.");
      } else if (error.message.includes("cancelled")) {
        showToast("info", "Sign-In Cancelled", "You cancelled the Google sign-in process.");
      } else if (error.message.includes("Play services not available")) {
        showToast("error", "Google Play Services Required", "Please install Google Play Services to use Google Sign-In.");
      } else {
        showToast("error", "Google Sign-In Failed", "Please try mobile number login instead.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGetOtp = async () => {
    trackButtonClick('Get OTP', 'Login Screen', { auth_method: 'otp', mobile_length: mobile.length });
    
    if (mobile.trim().length !== 10) {
      showToast("error", "Invalid Mobile Number", "Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      // Store mobile number
      await AsyncStorage.setItem(STORAGE_KEYS.MOBILE_NUMBER, `+91${mobile}`);

      // Check if this is the bypass number - direct login without OTP
      if (mobile === "8739900038") {
        console.log("🔓 Bypass number detected - proceeding with direct login");
        
        // Try to login directly
        try {
          const loginResponse = await loginUser(`+91${mobile}`);
          
          if (loginResponse.success) {
            // User exists, login successful
            showToast("success", "Login Successful", "Welcome back!");
            
            // Navigate to chat with userId
            setTimeout(() => {
              router.push(`/chat/${loginResponse.data.userId}`);
            }, 1000);
          }
        } catch (loginError: any) {
          // User doesn't exist, redirect to registration
          if (loginError.message.includes("not found") || loginError.message.includes("does not exist")) {
            showToast("info", "New User", "Let's create your account!");
            setTimeout(() => {
              router.push("/(auth)/basicDetails");
            }, 1000);
          } else {
            throw loginError;
          }
        }
      } else {
        // Normal flow - send OTP
        const response = await sendOtp(`+91${mobile}`);

        if (response.success) {
          setOtpSent(true);
          showToast("success", "OTP Sent", "Please check your messages for the OTP.");
        } else {
          showToast("error", "Error", response.message || "Failed to send OTP");
        }
      }
    } catch (error: any) {
      showToast("error", "Error", error.message || "Failed to process login");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    trackButtonClick('Verify OTP', 'Login Screen', { auth_method: 'otp', otp_length: otpCode.length });
    
    if (otpCode.length !== 6) {
      showToast("error", "Invalid OTP", "Please enter a valid 4-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      // First verify the OTP
      const verifyResponse = await verifyOtp(otpCode);

      if (verifyResponse.success) {
        // OTP verified, now check if user exists
        try {
          const loginResponse = await loginUser(`+91${mobile}`);

          if (loginResponse.success) {
            // User exists, login successful
            showToast("success", "Login Successful", "Welcome back!");

            // Track successful login following official documentation
            trackLogin('otp', loginResponse.data.userId);
            
            // Identify user and set profile properties
            identifyUser(loginResponse.data.userId, {
              mobile: `+91${mobile}`,
              auth_method: 'otp',
              login_date: new Date().toISOString()
            });

            // Navigate to chat with userId
            setTimeout(() => {
              router.push(`/chat/${loginResponse.data.userId}`);
            }, 1000);
          }
        } catch (loginError: any) {
          // User doesn't exist, redirect to registration
          if (loginError.message.includes("not found") || loginError.message.includes("does not exist")) {
            showToast("info", "New User", "Let's create your account!");
            setTimeout(() => {
              router.push("/(auth)/basicDetails");
            }, 1000);
          } else {
            throw loginError;
          }
        }
      } else {
        showToast("error", "Invalid OTP", verifyResponse.message || "Please enter the correct OTP.");
      }
    } catch (error: any) {
      showToast("error", "Error", error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await sendOtp(`+91${mobile}`);
      if (response.success) {
        showToast("success", "OTP Resent", "Please check your messages for the new OTP.");
        // Reset OTP input
        setOtp(["", "", "", ""]);
      } else {
        showToast("error", "Error", response.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      showToast("error", "Error", error.message || "Failed to resend OTP");
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="none"
      />
    ),
    []
  );

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#000", "#111"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="flex-1 items-center justify-center relative"
      />

      {/* Cosmic Background Overlay */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={["transparent", "rgba(30, 144, 255, 0.2)", "transparent"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 1, y: 0.7 }}
          className="absolute inset-0"
        />
        <View className="flex-1 items-center">
          <View className="w-32 h-32 mt-24 rounded-full overflow-hidden bg-white/10 border-2 border-white/20">
            <Image
              source={require("../../assets/images/zenny.jpg")}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <Text className="text-white text-3xl font-bold my-4 text-center tracking-wide">
            Hii, I'm Zenny!
          </Text>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={false}
        backgroundComponent={() => (
          <LinearGradient
            colors={["#000", "#fff"]}
            style={{ flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          />
        )}
        handleIndicatorStyle={{ backgroundColor: "#fff" }}
      >
        <BottomSheetView className="h-full items-center backdrop-blur-xl bg-black/40 px-6">
          {!otpSent ? (
            // Show main authentication screen with mobile input
            <View className="w-full">
              <Text className="text-white text-3xl font-medium mb-8 mt-4 text-left">
                Login
              </Text>
              
              {/* Mobile Number Input */}
              <View className="w-full mb-3">
                {/* <Text className="text-white text-lg mb-3">Enter your mobile number</Text> */}
                <View className="flex-row items-center bg-white/10 rounded-full px-4 border border-white/20">
                  <Text className="text-lg text-white mr-2">+91</Text>
                  <TextInput
                    placeholder="Enter Mobile Number"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="numeric"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                    className="flex-1 text-lg py-3 text-white"
                    editable={!loading}
                  />
                </View>
                
                {/* Bypass Number Indicator */}
                {mobile === "8739900038" && (
                  <Text className="text-blue-400 text-sm mt-2 text-center">
                    🔓 Development Mode: Direct login enabled
                  </Text>
                )}
                
                {/* Get OTP Button */}
                <TouchableOpacity
                  onPress={handleGetOtp}
                  disabled={mobile.length !== 10 || loading}
                  className={`mt-4 rounded-full overflow-hidden ${(mobile.length !== 10 || loading) ? 'opacity-50' : ''}`}
                >
                  <LinearGradient
                    colors={["#19A4EA", "#111"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="flex-row items-center justify-center py-4 px-6 rounded-full"
                  >
                    <Ionicons name={mobile === "8739900038" ? "log-in" : "call"} size={20} color="#fff" />
                    <Text className="text-white font-semibold text-lg ml-2">
                      {loading 
                        ? (mobile === "8739900038" ? "Logging in..." : "Sending OTP...")
                        : (mobile === "8739900038" ? "Login" : "Get OTP")
                      }
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View className="flex-row items-center my-5 w-full">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-300">OR</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Google Option */}
              <GoogleAuthButton
                onPress={handleGoogleSignIn}
                loading={googleLoading}
                disabled={loading}
                title="Continue with Google"
              />
            </View>
          ) : (
            // OTP Verification Screen
            <OTPVerification
              otp={otp}
              mobile={mobile}
              setOtp={setOtp}
              inputRefs={inputRefs}
              onChangeMobile={() => {
                setMobile('');
                setOtpSent(false);
                setOtp(["", "", "", "", "", ""]);
              }}
              onVerifyOtp={handleVerifyOtp}
              onResendOtp={handleResendOtp}
              loading={loading}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default LoginScreen;