import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const ChatInputBar = () => {
  return (
    <View style={styles.container}>
      <View style={styles.inputBox}>
        {/* Camera Icon */}
        <View style={styles.cameraIcon}>
          <Ionicons name="camera" size={20} color="#fff" />
        </View>

        {/* Message Input */}
        <TextInput
          placeholder="Message..."
          placeholderTextColor="#888"
          style={styles.input}
        />

        {/* Mic */}
        <TouchableOpacity style={styles.icon}>
          <Feather name="mic" size={20} color="#000" />
        </TouchableOpacity>

        {/* Image */}
        <TouchableOpacity style={styles.icon}>
          <Ionicons name="image-outline" size={22} color="#000" />
        </TouchableOpacity>

        {/* Emoji */}
        <TouchableOpacity style={styles.icon}>
          <MaterialCommunityIcons name="sticker-emoji" size={22} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
  cameraIcon: {
    backgroundColor: "#0096FF",
    padding: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  icon: {
    marginLeft: 12,
  },
});

export default ChatInputBar;
