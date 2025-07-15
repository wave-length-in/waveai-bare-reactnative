import { dummyRecentChats } from "@/static/dummyRecentChats";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export const RecentChatSection: React.FC = () => {

    const router = useRouter();

    const handlePress = (item: typeof dummyRecentChats[0]) => {
        router.push({
            pathname: "/chat/[scenarioId]",
            params: {
                scenarioId: item.scenarioId,
                name: item.name,
                image: item.image,
            },
        });
    };

    const renderItem = ({ item }: { item: typeof dummyRecentChats[0] }) => (
        <TouchableOpacity
            onPress={() => handlePress(item)}
            className="flex-row items-center justify-between py-3 border-b border-gray-200"
        >
            <Image
                source={item.image}
                className="w-12 h-12 rounded-full ml-2"
                resizeMode="cover"
            />
            <View className="flex-1 ml-4">
                <Text className="font-semibold text-black text-base">
                    {item.name}
                </Text>
                <Text className="text-gray-600" numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>
            <View className="flex-row items-center mr-2">
                <View className="w-2 h-2 bg-[#0096FF] rounded-full mr-2" />
                <Ionicons name="chatbox-ellipses-outline" size={22} color="#000" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="bg-white w-[90%] mx-auto mt-4 rounded-xl">
            <FlatList
                data={dummyRecentChats}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
            />
        </View>
    );
};