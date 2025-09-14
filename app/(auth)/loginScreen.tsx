import EnterMobileNumber from "@/components/auth/EnterMobileNumber";
import OTPVerification from "@/components/auth/OtpVerification";
import { showToast } from "@/components/ui/Toast";
import { loginUser, sendOtp, STORAGE_KEYS, verifyOtp } from "@/services/auth";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, Keyboard, Text, TextInput, View } from 'react-native';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [snapPoints, setSnapPoints] = useState<string[]>(["50%"]);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleKeyboardShow = () => {
    setIsKeyboardVisible(true);
    setSnapPoints(["50%", "80%"]);
  };

  const handleKeyboardHide = () => {
    setIsKeyboardVisible(false);
    setSnapPoints(["50%"]);
  };

  useEffect(() => {
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

  const handleGetOtp = async () => {
    if (mobile.trim().length !== 10) {
      showToast("error", "Invalid Mobile Number", "Please enter a valid 10-digit mobile number.");
      return;
    }

    // Bypass OTP for specific number
    if (mobile === "8739900038") {
      setLoading(true);
      try {
        // Store mobile number
        await AsyncStorage.setItem(STORAGE_KEYS.MOBILE_NUMBER, `+91${mobile}`);

        // Directly call login API
        const loginResponse = await loginUser(`+91${mobile}`);

        if (loginResponse.success) {
          // User exists, login successful
          showToast("success", "Login Successful", "Welcome back!");

          // Navigate to chat with userId
          setTimeout(() => {
            router.push(`/chat/688210873496b5e441480d22`);
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
          showToast("error", "Error", loginError.message || "Login failed");
        }
      } finally {
        setLoading(false);
      }
      return; // Exit early for bypass number
    }

    // Normal OTP flow for other numbers
    setLoading(true);
    try {
      // Store mobile number
      await AsyncStorage.setItem(STORAGE_KEYS.MOBILE_NUMBER, `+91${mobile}`);

      // Send OTP
      const response = await sendOtp(`+91${mobile}`);

      if (response.success) {
        setOtpSent(true);
        showToast("success", "OTP Sent", "Please check your messages for the OTP.");
      } else {
        showToast("error", "Error", response.message || "Failed to send OTP");
      }
    } catch (error: any) {
      showToast("error", "Error", error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
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

            // Navigate to chat with userId
            setTimeout(() => {
              router.push(`/chat/688210873496b5e441480d22`);
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
        <BottomSheetView className="h-full items-center backdrop-blur-xl bg-black/40">
          {!otpSent ? (
            <EnterMobileNumber
              mobile={mobile}
              setMobile={setMobile}
              onGetOtp={handleGetOtp}
              loading={loading}
            />
          ) : (
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