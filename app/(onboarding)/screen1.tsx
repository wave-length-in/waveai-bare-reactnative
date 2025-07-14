import { OnboardingData } from "@/static/onboarding";
import { LinearGradient } from "expo-linear-gradient";
import { MotiImage, MotiView } from "moti";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen() {
  return (
    <LinearGradient
      colors={["#ffffff", "#FFE4F5"]} // white to lime-200 (hex)
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="p-10 h-full flex-1 rounded-2xl items-center justify-center relative"
    >
      <View className="relative p-10 border-1 rounded-[2rem] border-black/10 flex flex-col justify-center items-center">

        {OnboardingData.map((item, index) => (
          <MotiImage
            from={{ translateY: 0 }}
            animate={{ translateY: -10 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true,
              delay: index * 100, // Optional staggered delay
            }}
            key={index}
            source={item.image}
            className={`${item.styles} w-28 h-28`}
            resizeMode="contain"
          />
        ))}


        {/* Hey I'm Your Bestie */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 500, duration: 700 }}
          className="flex flex-col justify-center items-center"
        >
          <Text className="text-4xl font-medium font-sans">Hey</Text>
          <MotiView className="flex flex-row justify-center my-2 items-center gap-4">
            <Text className="text-3xl my-2">I'm Your</Text>
            <MotiView className="bg-[#d08eff] px-2 py-1 rounded-full">
              <Text className="text-3xl font-semibold">Bestie</Text>
            </MotiView>
          </MotiView>
        </MotiView>

        {/* An Emotional Reset Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 1000, duration: 700 }}
          className="flex flex-col justify-center items-center my-10"
        >
          <Text className="text-3xl my-2">An Emotional</Text>
          <MotiView className="bg-[#ff9ae4] px-2 py-1 rounded-full">
            <Text className="text-3xl font-semibold">Reset Button</Text>
          </MotiView>
        </MotiView>

      </View>


      <LinearGradient
        colors={["#d08eff", "#ff9ae4"]} // purple to
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute w-[90%] bottom-10 bg-[#d08eff] px-6 py-4 rounded-full overflow-hidden"
      >
        <TouchableOpacity
          className=""
          onPress={() => console.log("Next Button Pressed")}
        >
          <Text className="text-white text-center text-2xl font-semibold">
            Get Started
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </LinearGradient>
  );
}
