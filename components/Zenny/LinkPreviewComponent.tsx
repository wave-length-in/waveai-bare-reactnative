import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Linking, Text, TouchableOpacity, View } from "react-native";

interface LinkPreview {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
    siteName?: string;
}

const LinkPreviewComponent: React.FC<{ url: string }> = ({ url }) => {
    const getPreviewData = (url: string): LinkPreview => {
        if (url.includes("https://wave-length-assets.s3.ap-south-1.amazonaws.com/IMG")) {
            return { url, image: url };
        } else if (url.includes("spotify.com")) {
            return {
                url,
                title: "Spotify Playlist",
                description: "Listen to this amazing playlist on Spotify",
                image: "https://wave-length-assets.s3.ap-south-1.amazonaws.com/spotify.png",
                favicon: "https://wave-length-assets.s3.ap-south-1.amazonaws.com/spotify.png",
                siteName: "Spotify",
            };
        } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
            return {
                url,
                title: "YouTube Video",
                description: "Watch this video on YouTube",
                image: "https://wave-length-assets.s3.ap-south-1.amazonaws.com/youtube-logo.webp",
                favicon: "https://wave-length-assets.s3.ap-south-1.amazonaws.com/youtube-logo.webp",
                siteName: "YouTube",
            };
        } else {
            return {
                url,
                title: "Web Page",
                description: "Click to visit this website",
                image: "https://wave-length-assets.s3.ap-south-1.amazonaws.com/weblogo.jpg",
                favicon: "https://wave-length-assets.s3.ap-south-1.amazonaws.com/weblogo.jpg",
                siteName: new URL(url).hostname,
            };
        }
    };

    const preview = getPreviewData(url);

    return (
        <View className="my-2">
            <View className="rounded-lg overflow-hidden max-w-full">
                {preview.image && !preview.title && !preview.description ? (
                    <View className="rounded-lg overflow-hidden">
                        <Image
                            source={{ uri: preview.image }}
                            className="w-40 h-40 rounded-lg"
                            resizeMode="cover"
                        />
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => Linking.openURL(preview.url)}
                        className="block transition-colors"
                    >
                        <View className="flex rounded-b-2xl p-3 bg-white/10 border border-white/10 min-h-0">
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="flex-row items-center flex-1 min-w-0">
                                    {preview.favicon && (
                                        <Image
                                            source={{ uri: preview.favicon }}
                                            className="w-6 h-6 mr-2 rounded"
                                            resizeMode="contain"
                                        />
                                    )}
                                    <Text className="text-md text-white/70 flex-1" numberOfLines={1}>
                                        {preview.siteName || "Website"}
                                    </Text>
                                </View>
                                <Ionicons name="open-outline" size={14} color="white" />
                            </View>
                            {preview.title && (
                                <Text className="font-semibold text-white text-base mb-1" numberOfLines={2}>
                                    {preview.title}
                                </Text>
                            )}

                            {preview.description && (
                                <Text className="text-sm text-white/80 mb-2" numberOfLines={3}>
                                    {preview.description}
                                </Text>
                            )}

                            <Text className="text-xs text-blue-300" numberOfLines={1}>
                                {url}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default LinkPreviewComponent;