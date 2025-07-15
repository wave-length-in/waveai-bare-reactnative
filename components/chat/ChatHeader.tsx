import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ChatHeaderProps {
  name: string;
  username: string;
  image: any;
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ name, username, image }) => {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      {/* Left: Back + Avatar + Name */}
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>

        <Image
          source={image}
          className="w-12 h-12 rounded-full ml-2"
          resizeMode="cover"
        />

        <View className="ml-3">
          <Text className="font-bold text-black text-md">{name}</Text>
          <Text className="text-gray-500 text-sm">{username}</Text>
        </View>
      </View>

      {/* Right: Call + Video */}
      <View className="flex-row items-center space-x-4 gap-4">
        <TouchableOpacity>
          <Feather name="phone" size={22} color="black" />
        </TouchableOpacity>
        {/* <TouchableOpacity>
          <Feather name="video" size={22} color="black" />
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

export default ChatHeader;
