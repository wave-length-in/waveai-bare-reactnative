import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiImage, MotiText, MotiView } from "moti";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen() {

  const router = useRouter();

  return (
    <LinearGradient
      colors={["#000", "#111"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex-1 items-center justify-center relative"
    >
      {/* Cosmic Background Overlay */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={["transparent", "rgba(30, 144, 255, 0.2)", "transparent"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 1, y: 0.7 }}
          className="absolute inset-0"
        />
      </View>

      {/* Main Content */}
      <View className="flex-1 items-center justify-center px-3">
        {/* Profile Image with Glow */}
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 1000 }}
          className="relative mb-16"
        >
          <View className="w-48 h-48 rounded-full overflow-hidden bg-white/10 border-2 border-white/20">
            <MotiImage
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 400 }}
              source={require("../../assets/images/zenny.jpg")}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        </MotiView>

        {/* Title Text */}
        <MotiText
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 700, duration: 800 }}
          className="text-white text-5xl font-bold mb-4 text-center tracking-wide"
        >
          Hii, I'm Zenny!
        </MotiText>

        {/* Subtitle */}
        <MotiText
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1200, duration: 1000 }}
          className="text-white/80 text-xl text-center mb-20 px-4 leading-relaxed"
        >
          Your AI Friend, Listener, and Secret-Keeper.
        </MotiText>
      </View>

      {/* Get Started Button */}
      <MotiView
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 1600, duration: 800 }}
        className="absolute bottom-12 left-6 right-6"
      >
        <TouchableOpacity
          onPress={() => router.push("/(auth)/loginScreen")}
          className="overflow-hidden rounded-full"
          style={{
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={["#19A4EA", "#111"]}
            start={{ x: 0, y: -5 }}
            end={{ x: 1, y: -5 }}
            className="px-8 py-5"
          >
            <Text className="text-white text-center text-xl font-bold tracking-wide">
              Let's chat
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>

      {/* Floating Stars */}
      <MotiView
        from={{ translateY: 0, opacity: 0.6 }}
        animate={{ translateY: -10, opacity: 1 }}
        transition={{ loop: true, type: "timing", duration: 2000, delay: 200 }}
        className="absolute top-20 left-10 w-2 h-2 bg-white/40 rounded-full"
      />
      <MotiView
        from={{ translateY: 0, opacity: 0.6 }}
        animate={{ translateY: -8, opacity: 1 }}
        transition={{ loop: true, type: "timing", duration: 1800, delay: 400 }}
        className="absolute top-32 right-16 w-1 h-1 bg-blue-300/60 rounded-full"
      />
      <MotiView
        from={{ translateY: 0, opacity: 0.6 }}
        animate={{ translateY: -12, opacity: 1 }}
        transition={{ loop: true, type: "timing", duration: 2200, delay: 600 }}
        className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-purple-300/50 rounded-full"
      />
      <MotiView
        from={{ translateY: 0, opacity: 0.6 }}
        animate={{ translateY: -9, opacity: 1 }}
        transition={{ loop: true, type: "timing", duration: 2400, delay: 800 }}
        className="absolute top-48 right-8 w-1 h-1 bg-cyan-300/40 rounded-full"
      />
    </LinearGradient>
  );
};