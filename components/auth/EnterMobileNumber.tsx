import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface EnterMobileNumberProps {
  mobile: string;
  setMobile: (value: string) => void;
  onGetOtp: () => void;
  loading?: boolean;
  onBack?: () => void;
}

const EnterMobileNumber: React.FC<EnterMobileNumberProps> = ({
  mobile,
  setMobile,
  onGetOtp,
  loading = false,
  onBack,
}) => {
  const isValid = mobile.length === 10;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 px-4"
    >
      <View className="space-y-[2rem] w-[90%]">
        {onBack && (
          <TouchableOpacity onPress={onBack} className="self-start mb-4">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <Text className="text-4xl text-white font-sans my-4">Login</Text>
        <Text className="text-gray-500 mb-2 text-base">
          Enter your phone number to login
        </Text>

        {/* Phone number input */}
        <View style={styles.textInput} className="textInput flex-row items-center rounded-full px-4 bg-white/10 w-full">
          <Text className="text-lg text-white mr-2">+91</Text>
          <TextInput
            placeholder="Enter Mobile Number"
            placeholderTextColor="#ffff"
            keyboardType="numeric"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
            className="flex-1 text-lg py-3 text-white"
            editable={!loading}
          />
        </View>

        {/* Login Button with Gradient */}
        <TouchableOpacity
          onPress={onGetOtp}
          disabled={!isValid || loading}
          className={`mt-5 rounded-full overflow-hidden ${(!isValid || loading) ? 'opacity-50' : ''}`}
        >
          <LinearGradient
            colors={["#19A4EA", "#111"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row w-full justify-center items-center py-4 px-4 rounded-full"
          >
            {loading ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <>
                <Text className="text-white font-bold text-lg mr-2">Get OTP</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default EnterMobileNumber;

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)"
  }
});