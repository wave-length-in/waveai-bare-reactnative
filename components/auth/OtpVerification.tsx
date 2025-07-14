import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface OTPVerificationProps {
  mobile: string;
  otp: string[];
  setOtp: (value: string[]) => void;
  inputRefs: React.MutableRefObject<Array<TextInput | null>>;
  onChangeMobile: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ mobile, otp, setOtp, inputRefs, onChangeMobile }) => {

  const router = useRouter();
  const [timer, setTimer] = useState(30);
  const [showResend, setShowResend] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: number | null = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setShowResend(true);
    }
    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleBackspace = (index: number) => {
    if (otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setShowResend(false);
    setTimer(30);
    // Add your resend OTP API call here
  };

  const handleContinue = () => {
    setLoading(true);
    // Add your OTP verification API call here
    setTimeout(() => {
      setLoading(false);
      router.push("/(auth)/basicDetails");
      // Navigate to the next screen or show success message
    }, 2000); // Simulating network delay
  }

  return (
    <View className="space-y-6">
      <Text className="text-4xl text-black font-sans my-4">Verify OTP</Text>
      <Text className="text-gray-500 mb-4 text-base">
        Enter the 4-digit OTP sent to +91 {mobile}
      </Text>
      <View className="flex-row justify-between px-2">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            value={digit}
            keyboardType="numeric"
            maxLength={1}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => nativeEvent.key === 'Backspace' && handleBackspace(index)}
            className="border border-gray-400 focus:ring-offset-purple-600 rounded-lg text-center text-xl w-16 h-16 bg-white"
          />
        ))}
      </View>
      <TouchableOpacity
        disabled={otp.some(digit => digit === '')}
        className="mt-5 rounded-full overflow-hidden"
      >
        <LinearGradient
          colors={["#9578D9", "#0096FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="flex-row w-full justify-center items-center py-4 px-4 rounded-full"
        >
          {loading ? (
            <ActivityIndicator size={25} color="#fff" />
          ) : (
            <TouchableOpacity onPress={handleContinue} className="flex-row items-center">
              <Text className="text-white font-semibold text-lg mr-2">Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {showResend ? (
        <TouchableOpacity onPress={handleResend}>
          <Text className="text-center text-lg my-2">
            Didn't Receive Code? <Text className="text-purple-600 font-semibold">Resend Code</Text>
          </Text>
        </TouchableOpacity>
      ) : (
        <Text className="text-center text-lg my-2 text-gray-500">
          Resend OTP in <Text className="text-purple-600 font-semibold">{timer}</Text> seconds
        </Text>
      )}

      {/* <TouchableOpacity onPress={onChangeMobile}>
        <Text className="text-center text-purple-600 underline">Change Mobile Number</Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default OTPVerification;