import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { createUser, STORAGE_KEYS } from "@/services/auth";
import { CharactersImages } from "@/static/characters";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function BasicDetails() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | null>("Male");
  const [age, setAge] = useState(20);
  const [mobileNumber, setMobileNumber] = useState("");

  useEffect(() => {
    const loadMobileNumber = async () => {
      try {
        const storedMobile = await AsyncStorage.getItem(STORAGE_KEYS.MOBILE_NUMBER);
        console.log("Stored Mobile Number", storedMobile);
        if (storedMobile) {
          setMobileNumber(storedMobile);
        } else {
          showToast("error", "Error", "Mobile number not found. Please log in again.");
          router.push("/(auth)/loginScreen");
        }
      } catch (error) {
        showToast("error", "Error", "Failed to load mobile number.");
        console.error("Failed to load mobile number:", error);
        router.push("/(auth)/loginScreen");
      }
    };
    loadMobileNumber();
  }, [router]);

  const handleNameChange = (text: string) => {
    setUserName(text);
  };

  const getCharacterImage = (id: number) => {
    const found = CharactersImages.find((img) => img.id === id);
    return found?.image;
  };

  const handleContinue = async () => {
    if (!userName.trim()) {
      showToast("error", "Error", "Please enter your name.");
      return;
    }

    if (!mobileNumber) {
      showToast("error", "Error", "Mobile number not found. Please try again.");
      return;
    }

    if (!email.trim()) {
      showToast("error", "Error", "Please enter your email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast("error", "Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await createUser({
        userName: userName.trim(),
        mobileNumber,
        mobileNumberVerified: true,
        email: email.trim(),
        emailVerified: true,
        age,
        gender: gender || "Male",
        authMethod: 'mobile',
      });

      console.log("User Created", response);

      if (response.success) {
        // Update auth context
        setUser({
          userId: response.data.userId,
          userName: response.data.userName,
          mobileNumber: response.data.mobileNumber,
          mobileNumberVerified: response.data.mobileNumberVerified,
          email: response.data.email,
          emailVerified: response.data.emailVerified,
          age: response.data.age,
          gender: response.data.gender,
          authMethod: 'mobile',
        });

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

  const renderSkeletons = () => {
    const skeletons = Array.from({ length: 6 });
    return skeletons.map((_, index) => (
      <View
        key={index}
        className="relative bg-gray-200 m-1 w-[47%] h-36 rounded-xl animate-pulse"
      />
    ));
  };

  return (
    <LinearGradient
      colors={["#000", "#111"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="p-10 h-full rounded-2xl relative"
    >
      <LinearGradient
        colors={["transparent", "rgba(30, 144, 255, 0.2)", "transparent"]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.7 }}
        className="absolute inset-0"
      />
      {/* Enter Your Name */}
      <View className="my-10">
        <Text className="text-3xl text-white font-semibold font-sans my-4">What's your Name?</Text>
        <View style={styles.inputContainer} className="flex-row items-center">
          <TextInput
            placeholder="Enter your name"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="default"
            maxLength={100}
            value={userName}
            onChangeText={handleNameChange}
            className="flex-1 text-lg py-3 text-white focus:border-b-2 border-blue-600"
            editable={!loading}
          />
        </View>
      </View>

      {/* Enter Your Email */}
      <View className="my-10">
        <Text className="text-3xl text-white font-semibold font-sans my-4">What's your Email?</Text>
        <View style={styles.inputContainer} className="flex-row items-center">
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={100}
            value={email}
            onChangeText={setEmail}
            className="flex-1 text-lg py-3 text-white focus:border-b-2 border-blue-600"
            editable={!loading}
          />
        </View>
      </View>

      <Text className="text-3xl text-white font-sans font-semibold mb-10">
        Choose your Gender
      </Text>
      <View className="flex-row mb-8">
        {["Male", "Female"].map((g) => {
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
                className={`ml-2 text-2xl my-2 font-semibold ${
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

      <TouchableOpacity
        disabled={userName.trim() === '' || email.trim() === '' || loading || !mobileNumber}
        onPress={handleContinue}
        className={`mt-5 absolute w-[80vw] bottom-10 left-[10%] rounded-full overflow-hidden ${
          (userName.trim() === '' || email.trim() === '' || loading || !mobileNumber) ? 'opacity-50' : ''
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
              <Text className="text-white font-semibold text-lg mr-2">Create Account</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#4f4f4f',
  },
  scrollContainer: {
    height: '60%'
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