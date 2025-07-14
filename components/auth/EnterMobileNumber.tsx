import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface EnterMobileNumberProps {
  mobile: string;
  setMobile: (value: string) => void;
  onGetOtp: () => void;
}

const EnterMobileNumber: React.FC<EnterMobileNumberProps> = ({
  mobile,
  setMobile,
  onGetOtp,
}) => {
  const isValid = mobile.length === 10;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white px-4"
    >
      <View className="space-y-[2rem] w-full">
        <Text className="text-4xl text-black font-sans my-4">Login</Text>
        <Text className="text-gray-500 mb-2 text-base">
          Enter your phone number to login
        </Text>

        {/* Phone number input */}
        <View className="flex-row items-center border border-gray-300 rounded-full px-4 bg-white w-11/12">
          <Text className="text-lg text-black mr-2">+91</Text>
          <TextInput
            placeholder="9876543210"
            keyboardType="numeric"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
            className="flex-1 text-lg py-3 text-black"
          />
        </View>

        {/* Login Button with Gradient */}
        <TouchableOpacity
          onPress={onGetOtp}
          disabled={!isValid}
          className="mt-5 rounded-full overflow-hidden"
        >
          <LinearGradient
            colors={
              isValid ? ["#9578D9", "#0072FF"] : ["#9578D9", "#0096FF"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row w-full justify-center items-center py-4 px-4 rounded-full"
          >
            <Text className="text-white font-semibold text-lg mr-2">Login</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default EnterMobileNumber;
