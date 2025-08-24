import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface OTPVerificationProps {
  mobile: string;
  otp: string[];
  setOtp: (value: string[]) => void;
  inputRefs: React.MutableRefObject<Array<TextInput | null>>;
  onChangeMobile: () => void;
  onVerifyOtp: () => void;
  onResendOtp: () => void;
  loading?: boolean;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  mobile, 
  otp, 
  setOtp, 
  inputRefs, 
  onChangeMobile, 
  onVerifyOtp,
  onResendOtp,
  loading = false 
}) => {
  const [timer, setTimer] = useState(30);
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    let interval: number | null = null;
    if (timer > 0 && !showResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setShowResend(true);
    }
    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [timer, showResend]);

  const handleOtpChange = (value: string, index: number) => {
    if (loading) return; // Prevent input changes during loading
    
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (loading) return;
    
    if (otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setShowResend(false);
    setTimer(30);
    await onResendOtp();
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <View className="space-y-6 w-[90%]">
      <Text className="text-4xl text-white font-sans my-4">Verify OTP</Text>
      <Text className="text-white mb-4 text-base">
        Enter the 4-digit OTP sent to +91 {mobile}
      </Text>
      
      {/* OTP Input Fields */}
      <View className="flex-row justify-between">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            value={digit}
            keyboardType="numeric"
            maxLength={1}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => nativeEvent.key === 'Backspace' && handleBackspace(index)}
            className={`border border-white/50 focus:border-[#19A4EA] rounded-lg text-center text-xl w-14 h-14 bg-transparent text-white ${loading ? 'opacity-50' : ''}`}
            editable={!loading}
          />
        ))}
      </View>
      
      {/* Continue Button */}
      <TouchableOpacity
        disabled={!isOtpComplete || loading}
        onPress={onVerifyOtp}
        className={`mt-5 rounded-full overflow-hidden ${(!isOtpComplete || loading) ? 'opacity-50' : ''}`}
      >
        <LinearGradient
          colors={["#19A4EA", "#111"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="flex-row w-full justify-center items-center py-4 px-4 rounded-full"
        >
          {loading ? (
            <ActivityIndicator size={25} color="#fff" />
          ) : (
            <View className="flex-row items-center">
              <Text className="text-white font-semibold text-lg mr-2">Verify</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Resend OTP Section */}
      {showResend ? (
        <TouchableOpacity onPress={handleResend} disabled={loading}>
          <Text className="text-center text-white/80 text-lg my-2">
            Didn't Receive Code? <Text className="text-[#19A4EA] font-semibold">Resend Code</Text>
          </Text>
        </TouchableOpacity>
      ) : (
        <Text className="text-center text-lg my-2 text-white">
          Resend OTP in <Text className="text-[#19A4EA] font-semibold">{timer}</Text> seconds
        </Text>
      )}

      {/* Change Mobile Number */}
      <TouchableOpacity onPress={onChangeMobile} disabled={loading}>
        <Text className="text-center text-white/60 underline text-sm">
          Change Mobile Number
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OTPVerification;