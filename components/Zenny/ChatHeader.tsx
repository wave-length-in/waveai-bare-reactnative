import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';

interface ChatHeaderProps {
  name: string;
  username?: string;
  image?: string;
}

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  USER_DATA: 'user_data',
  MOBILE_NUMBER: 'mobile_number',
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ name, image }) => {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.AUTH_TOKEN,
              STORAGE_KEYS.USER_ID,
              STORAGE_KEYS.USER_DATA,
              STORAGE_KEYS.MOBILE_NUMBER,
            ]);
            router.replace(`/(auth)/loginScreen`);
          } catch (error) {
            console.error('Error during logout:', error);
          }
        },
      },
    ]);
  };

  return (
    <View className="px-4 py-3 pt-10">
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        className="rounded-2xl border-2 border-white/20"
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          {/* Left Section */}
          <View className="flex-row items-center flex-1">
            <Image
              source={
                image
                  ? { uri: image }
                  : require('@/assets/images/zenny.jpg')
              }
              className="w-12 h-12 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text className="text-lg font-semibold text-white mb-1">
                {name}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="ellipse" size={10} color="#10b981" className="mr-1" />
                <Text className="text-sm font-medium text-emerald-500">
                  Active
                </Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="flex-row items-center bg-white/10 border-2 border-white/20 rounded-2xl px-3 py-2"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 text-sm font-medium ml-1">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

export default ChatHeader;
