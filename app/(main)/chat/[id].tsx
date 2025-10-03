import NotificationPermissionModal from "@/components/chat/NotificationPermissionModal";
import { useToast } from "@/components/ui/Toast";
import ZennyMainDashboard from "@/components/Zenny/ZennyMainDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { registerForPushNotificationsAsync, sendTokenToBackend } from "@/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";

const NOTIFICATION_PERMISSION_ASKED_KEY = "notification_permission_asked";

const ChatScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    checkNotificationPermissionStatus();
  }, []);

  const checkNotificationPermissionStatus = async () => {
    try {
      const hasAsked = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_ASKED_KEY);
      // Only show if user hasn't been asked yet
      if (!hasAsked) {
        // Show modal after a short delay for better UX
        setTimeout(() => {
          setShowNotificationModal(true);
        }, 1500);
      }
    } catch (error) {
      console.error("Error checking notification permission status:", error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setShowNotificationModal(false);
      
      // Mark that we've asked for permission
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, "true");

      // Request notification permission and get token
      console.log("Starting notification permission request...");
      const token = await registerForPushNotificationsAsync();

      if (!token) {
        showToast("error", "Permission denied", "Notifications were not enabled");
        return;
      }

      console.log("Notification permission granted, token obtained:", token);

      // Send token to backend
      if (user?.userId) {
        await sendTokenToBackend(token, user.userId);
        showToast("success", "Notifications enabled!", "You'll now receive important updates");
      } else {
        // Store token locally to send later when user is available
        await AsyncStorage.setItem("pending_fcm_token", token);
        showToast("success", "Notifications enabled!", "Token will be registered when logged in");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      showToast("error", "Something went wrong", "Failed to enable notifications");
    }
  };

  const handleDismissModal = async () => {
    setShowNotificationModal(false);
    // Mark that we've asked, so we don't show it again this session
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, "dismissed");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ZennyMainDashboard />
      
      <NotificationPermissionModal
        visible={showNotificationModal}
        onEnableNotifications={handleEnableNotifications}
        onDismiss={handleDismissModal}
      />
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