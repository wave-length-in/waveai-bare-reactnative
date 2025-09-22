import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface GoogleAuthButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  title = "Continue with Google"
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      className={`w-full ${(loading || disabled) ? 'opacity-50' : ''}`}
    >
      <View className="bg-white border border-gray-200 rounded-full overflow-hidden">
        <LinearGradient
          colors={["#fff", "#f8f9fa"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-row items-center justify-center py-4 px-6"
        >
          {/* Google Logo */}
          <View className="w-6 h-6 mr-3 bg-white rounded-full items-center justify-center shadow-sm">
            <Image
              source={{
                uri: 'https://developers.google.com/identity/images/g-logo.png'
              }}
              className="w-5 h-5"
              resizeMode="contain"
            />
          </View>
          
          <Text className="text-gray-700 font-semibold text-lg">
            {title}
          </Text>
          
          {loading && (
            <View className="ml-3">
              <Ionicons name="refresh" size={20} color="#666" />
            </View>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

export default GoogleAuthButton;
