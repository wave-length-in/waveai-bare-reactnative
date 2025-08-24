import ZennyMainDashboard from "@/components/Zenny/ZennyMainDashboard";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";

const ChatScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return (
    <SafeAreaView style={styles.container}>
      <ZennyMainDashboard/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default ChatScreen;