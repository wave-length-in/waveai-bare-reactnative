import ChatHeader from "@/components/chat/ChatHeader";
import ChatInputBar from "@/components/chat/ChatInputBar";
import { dummyRecentChats } from "@/static/dummyRecentChats";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ChatScreen = () => {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const chat = dummyRecentChats.find((item) => item.scenarioId === scenarioId);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (!chat) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.innerContainer}>
          <ChatHeader
            name={chat.name}
            username={`${chat.name.toLowerCase()}_`}
            image={chat.image}
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: keyboardHeight + 80 }, // 80 to avoid last message being hidden
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text>Chat bubbles will go here</Text>
          </ScrollView>

          <ChatInputBar />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    paddingTop: 32,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default ChatScreen;
