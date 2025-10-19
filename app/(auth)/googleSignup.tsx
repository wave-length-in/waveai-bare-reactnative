import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { createUser } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function GoogleSignup() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | null>("Male");
  const [age, setAge] = useState(20);
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(true);

  useEffect(() => {
    const loadGoogleUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('googleUserData');
        if (storedData) {
          const userData = JSON.parse(storedData);
          setGoogleUserData(userData);
        } else {
          showToast("error", "Error", "Google user data not found. Please try again.");
          router.push("/(auth)/loginScreen");
        }
      } catch (error) {
        showToast("error", "Error", "Failed to load Google user data.");
        console.error("Failed to load Google user data:", error);
        router.push("/(auth)/loginScreen");
      }
    };
    loadGoogleUserData();
  }, [router]);

  const getInitials = (fullName?: string, email?: string) => {
    const source = (fullName || '').trim() || (email || '').trim();
    if (!source) return '?';
    if (!fullName && email) {
      const namePart = email.split('@')[0];
      const letters = namePart.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
      return letters || namePart.slice(0, 2).toUpperCase();
    }
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleContinue = async () => {
    if (!mobileNumber.trim()) {
      showToast("error", "Error", "Please enter your mobile number.");
      return;
    }

    if (mobileNumber.length !== 10) {
      showToast("error", "Error", "Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!googleUserData) {
      showToast("error", "Error", "Google user data not found. Please try again.");
      return;
    }

    if (!agreeToTerms) {
      showToast("error", "Error", "Please agree to the terms and conditions.");
      return;
    }

    setLoading(true);
    try {
      const response = await createUser({
        userName: googleUserData.name,
        email: googleUserData.email,
        emailVerified: true,
        mobileNumber: `+91${mobileNumber}`,
        mobileNumberVerified: false, // Will need OTP verification for mobile
        age,
        gender: gender || "Male",
        profilePicture: googleUserData.picture,
        authMethod: 'google',
      });

      console.log("User Created", response);

      if (response.success) {
        // Update auth context
        setUser({
          userId: response.data.userId,
          userName: response.data.userName,
          email: response.data.email,
          emailVerified: response.data.emailVerified,
          mobileNumber: response.data.mobileNumber,
          mobileNumberVerified: response.data.mobileNumberVerified,
          age: response.data.age,
          gender: response.data.gender,
          profilePicture: googleUserData.picture,
          authMethod: 'google',
        });

        // Clear stored Google data
        await AsyncStorage.removeItem('googleUserData');

        showToast("success", "Account Created", "Your profile has been created successfully!");
        
        // Navigate to chat with userId after a delay
        setTimeout(() => {
          setLoading(false);
          router.push(`/chat/${response.data.userId}`);
        }, 2000);
      } else {
        throw new Error(response.message || "Failed to create user");
      }
    } catch (error: any) {
      setLoading(false);
      showToast("error", "Error", error.message || "Failed to create user. Please try again.");
      console.error("API Error:", error);
    }
  };

  if (!googleUserData) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#19A4EA" />
        <Text className="text-white mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#000", "#111"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex-1"
    >
      <LinearGradient
        colors={["transparent", "rgba(30, 144, 255, 0.2)", "transparent"]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.7 }}
        className="absolute inset-0"
      />
      <ScrollView 
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

      {/* Google User Info */}
      <View className="items-center my-4">
        <View className="w-24 h-24 rounded-full overflow-hidden bg-blue-500 border-2 border-white/20 mb-2 items-center justify-center">
          {(() => {
            const avatarUri = googleUserData.picture || googleUserData.photo || googleUserData.user?.photo || null;
            if (avatarUri) {
              return (
                <Image
                  source={{ uri: avatarUri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              );
            }
            const initials = getInitials(googleUserData.name, googleUserData.email);
            return (
              <Text className="text-white text-3xl font-semibold">
                {initials}
              </Text>
            );
          })()}
        </View>
        <Text className="text-white text-2xl font-semibold text-center mb-1">
          {googleUserData.name}
        </Text>
        <Text className="text-gray-400 text-base text-center">
          {googleUserData.email}
        </Text>
      </View>

      {/* Mobile Number Input */}
      <View className="my-4">
        {/* <Text className="text-3xl text-white font-semibold font-sans my-4">
          Add your Mobile Number
        </Text> */}
        <View style={styles.inputContainer} className="flex-row items-center">
          <Text className="text-lg text-white mr-2">+91</Text>
          <TextInput
            placeholder="Enter mobile number"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="numeric"
            maxLength={10}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            className="flex-1 text-lg py-3 text-white"
            editable={!loading}
          />
        </View>
      </View>

      {/* Gender Selection */}
      <Text className="text-3xl text-white font-sans font-semibold mb-6">
        Choose your Gender
      </Text>
      <View className="flex-row mb-8">
        {["Male", "Female","Other"].map((g) => {
          const isSelected = gender === g;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => !loading && setGender(g as "Male" | "Female")}
              className={`flex-1 py-3 h-24 my-5 mx-1 rounded-xl flex-col justify-center items-center ${
                isSelected ? "border-2 border-[#0096FF]" : "border-2 border-blue-100 opacity-40"
              } ${loading ? 'opacity-50' : ''}`}
              disabled={loading}
            >
              <Text
                className={`ml-2 text-xl my-2 font-semibold ${
                  isSelected ? "text-[#0096FF]" : "text-white"
                }`}
              >
                {g}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color="#0096FF" className="ml-1 absolute right-2 top-2" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Age Selection */}
      <Text className="text-3xl text-white font-sans font-semibold mb-5">Choose your Age</Text>
      <View style={{ alignItems: "center", marginBottom: 10 }}>
        <View style={styles.bubble} className="flex flex-col justify-center items-center">
          <Text style={styles.bubbleText}>{age === 50 ? "50+" : age}</Text>
        </View>
      </View>
      <Slider
        style={{ width: "100%", height: 40 }}
        minimumValue={16}
        maximumValue={50}
        step={1}
        minimumTrackTintColor="#0096FF"
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor="#0096FF"
        value={age}
        onValueChange={(val) => !loading && setAge(val)}
        disabled={loading}
      />

      {/* Terms and Conditions Checkbox */}
      <View className="mb-6 mt-4">
        <TouchableOpacity
          onPress={() => !loading && setAgreeToTerms(!agreeToTerms)}
          className="flex-row items-center"
          disabled={loading}
        >
          <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
            agreeToTerms ? 'bg-[#0096FF] border-[#0096FF]' : 'border-gray-400'
          }`}>
            {agreeToTerms && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </View>
          <Text className="text-white text-sm flex-1">
            I agree to the{' '}
            <Text 
              className="text-[#0096FF] underline"
              onPress={() => Linking.openURL('https://www.wave-length.in/terms-of-use')}
            >
              Terms and Conditions
            </Text>
            {' '}and{' '}
            <Text 
              className="text-[#0096FF] underline"
              onPress={() => Linking.openURL('https://www.wave-length.in/privacy-policy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        disabled={mobileNumber.length !== 10 || loading || !agreeToTerms}
        onPress={handleContinue}
        className={`my-3 w-full rounded-full overflow-hidden ${
          (mobileNumber.length !== 10 || loading || !agreeToTerms) ? 'opacity-50' : ''
        }`}
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
              <Text className="text-white font-semibold text-lg mr-2">Complete Registration</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#4f4f4f',
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 20,
    flexGrow: 1,
  },
  bubble: {
    backgroundColor: "#0096FF",
    borderRadius: 20,
    width: 40,
    height: 40,
  },
  bubbleText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
