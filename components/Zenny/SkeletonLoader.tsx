import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const SkeletonLoader: React.FC = () => {
  return (
    <View className="flex-1 px-5">

      <View className="absolute inset-0 bg-black opacity-70" />

      <View className="py-4">
        {/* Privacy Notice */}
        <View className="mt-4 md:mt-0 mb-6">
          <LinearGradient
            colors={['transparent', 'rgba(25,164,234,0.5)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-2 rounded-md border-2 border-white/10 bg-white/10"
          >
            <Text className="text-white text-base text-center">
              Your data's safe, we only use it to make your chat better.
            </Text>
          </LinearGradient>
        </View>

        {/* Loading indicator */}
        <View className="flex-1 justify-center items-center mt-20">
          <ActivityIndicator size="large" color="#19A4EA" />
          <Text className="text-white text-base mt-4">Loading chats...</Text>
        </View>
      </View>
    </View>
  );
};

export default SkeletonLoader;