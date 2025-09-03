// components/TextWithLinks.tsx
import React from "react";
import { Text, Linking, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { URL_REGEX } from "@/utils/splitSentence";

interface Props {
  content: string;
}

export const TextWithLinks: React.FC<Props> = ({ content }) => {
  const parts = content.split(URL_REGEX);

  const handlePress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn("Failed to open URL:", error);
    }
  };

  return (
    <Text style={styles.text}>
      {parts.map((part, index) => {
        if (URL_REGEX.test(part)) {
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(part)}
              style={styles.linkContainer}
            >
              <Text style={styles.link}>{part} </Text>
              <Ionicons name="open-outline" size={12} color="#3b82f6" />
            </TouchableOpacity>
          );
        }
        return (
          <Text key={index} style={styles.text}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: "#fff",
    flexWrap: "wrap",
  },
  link: {
    color: "#3b82f6",
    textDecorationLine: "underline",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
});
