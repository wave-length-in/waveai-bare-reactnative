import { API_URL } from '@/config/apiUrl';
import { getStoredAuthData as getStoredAuthDataGlobal } from '@/services/auth';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ChatHeaderProps {
  name: string;
  username?: string;
  image?: string;
  onClearChatSuccess?: () => void;
}

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  USER_DATA: 'user_data',
  MOBILE_NUMBER: 'mobile_number',
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ name, image, onClearChatSuccess }) => {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Zenny profile info
  const zennyInfo = {
    name: "Zenny",
    age: 25,
    location: "Bangalore, India",
    education: "MA in Liberal Arts, Delhi University",
    occupation: "Brand Head at Startup & Scuba Diving Instructor",
    weekend: "Teaching scuba diving in Goa",
    personality: ["Caring", "Wise", "Creative", "Playful", "Curious"],
    interests: ["Psychology", "Ocean diving", "Startups", "Mental wellness", "Gen Z culture"],
    bio: "I'm someone who's super fascinated by how the brain works and currently working remotely for a startup. I love helping people feel seen, heard, and understood!",
    image: require('@/assets/images/zenny.jpg')
  };

  const getStoredAuthData = async () => {
    try {
      const authToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      return {
        authToken,
        userId,
        userData: userData ? JSON.parse(userData) : null,
      };
    } catch (error) {
      console.error('Error getting stored auth data:', error);
      return null;
    }
  };

  const handleLogout = () => {
    setShowMenu(false);
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

  const handleReport = () => {
    setShowMenu(false);
    router.push('/report');
  };

  const handleClearChat = async () => {
    try {
      setShowMenu(false);
      // Prefer global auth storage which uses correct keys
      const globalAuth = await getStoredAuthDataGlobal();
      const userIdCandidate = globalAuth?.userId || (await AsyncStorage.getItem(STORAGE_KEYS.USER_ID)) || '';
      const userId = (userIdCandidate || '').trim();
      const isValidObjectId = /^[a-f0-9]{24}$/i.test(userId);
      if (!isValidObjectId) {
        Alert.alert('Clear Chat', 'Cannot clear chat: invalid or missing user id.');
        return;
      }

      const characterId = '688210873496b5e441480d22';
      const count = 10000;

      Alert.alert(
        'Clear Chat',
        'Are you sure you want to delete recent chats?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const url = `${API_URL}/chat/delete-recent-chats?userId=${encodeURIComponent(userId)}&characterId=${encodeURIComponent(characterId)}&count=${count}`;
                console.log('🔍 URL:', url);
                const res = await fetch(url, { method: 'DELETE' });
                const text = await res.text();
                let body: any = text;
                try { body = JSON.parse(text); } catch {}
                if (!res.ok) {
                  console.log('[chat] Clear chat failed:', { status: res.status, body });
                  Alert.alert('Clear Chat', body?.message || 'Failed to clear chat');
                  return;
                }
                console.log('[chat] Clear chat success:', body);
                Alert.alert('Clear Chat', 'Recent chats cleared.');
                try {
                  onClearChatSuccess?.();
                } catch {}
              } catch (err: any) {
                console.log('[chat] Clear chat error:', err);
                Alert.alert('Clear Chat', err?.message || 'Network error');
              }
            }
          }
        ]
      );
    } catch (e) {
      console.log('[chat] Clear chat init error:', e);
      Alert.alert('Clear Chat', 'Something went wrong');
    }
  };

  const handleProfilePress = () => {
    console.log("Opening Zenny profile modal");
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  const menuOptions = [
    {
      id: 'clear',
      title: 'Clear Chat',
      icon: 'trash-outline',
      color: '#ef4444',
      onPress: handleClearChat,
    },
    {
      id: 'report',
      title: 'Report',
      icon: 'flag-outline',
      color: '#f59e0b',
      onPress: handleReport,
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out-outline',
      color: '#ef4444',
      onPress: handleLogout,
    },
  ];

  return (
    <View className="px-4 py-3 pt-10">
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        className="rounded-2xl border-2 border-white/20"
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          {/* Left Section - Clickable Profile */}
          <TouchableOpacity
            className="flex-row items-center flex-1"
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
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
          </TouchableOpacity>

          {/* Three Dots Menu */}
          <TouchableOpacity
            className="bg-white/10 border-2 border-white/20 rounded-full p-2"
            onPress={() => setShowMenu(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Three Dots Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowMenu(false)}
        >
          <View className="flex-1 justify-start items-end pt-20 pr-6">
            <LinearGradient
              colors={['rgba(30, 30, 30, 0.95)', 'rgba(20, 20, 20, 0.95)']}
              className="rounded-2xl border border-white/10 shadow-2xl"
            >
              {menuOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  className={`flex-row items-center px-4 py-3 ${index === 0 ? 'rounded-t-2xl' : ''
                    } ${index === menuOptions.length - 1 ? 'rounded-b-2xl' : ''} ${index < menuOptions.length - 1 ? 'border-b border-white/10' : ''
                    }`}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={option.color}
                  />
                  <Text
                    className="text-white text-base font-medium ml-3"
                    style={{ color: option.color }}
                  >
                    {option.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </View>
        </Pressable>
      </Modal>

      {/* Zenny Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={closeProfileModal}
      >
        <View className="flex-1 bg-black/80">
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
          >
            <View className="flex-1 justify-center items-center">
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'timing',
                  duration: 400,
                }}
                className="w-full max-w-sm"
              >
                <LinearGradient
                  colors={['#000', '#111']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                >
                  {/* Cosmic Background Overlay */}
                  <View style={styles.backgroundOverlay} pointerEvents="none">
                    <LinearGradient
                      colors={['transparent', 'rgba(30, 144, 255, 0.2)', 'transparent']}
                      start={{ x: 0, y: 0.3 }}
                      end={{ x: 1, y: 0.7 }}
                      style={styles.cosmicGradient}
                      pointerEvents="none"
                    />
                  </View>
                  {/* Header with Close Button */}
                  <View className="flex-row justify-between items-center p-4 pt-6">
                    <View />
                    <TouchableOpacity
                      onPress={closeProfileModal}
                      className="bg-white/20 rounded-full p-2"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>


                  {/* Profile Image */}
                  <MotiView
                    from={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'timing',
                      duration: 600,
                      delay: 200,
                    }}
                    className="items-center mb-6"
                  >
                    <View className="w-32 h-32 rounded-full border-4 border-white/30 overflow-hidden mb-4">
                      <Image
                        source={zennyInfo.image}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>

                    <MotiView
                      from={{ translateY: 20, opacity: 0 }}
                      animate={{ translateY: 0, opacity: 1 }}
                      transition={{
                        type: 'timing',
                        duration: 500,
                        delay: 400,
                      }}
                    >
                      <Text className="text-3xl font-bold text-white text-center mb-2">
                        {zennyInfo.name}
                      </Text>
                      <Text className="text-lg text-white/80 text-center mb-1">
                        {zennyInfo.age} years old
                      </Text>
                      <View className="flex-row items-center justify-center">
                        <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.7)" />
                        <Text className="text-white/70 ml-1">
                          {zennyInfo.location}
                        </Text>
                      </View>
                    </MotiView>
                  </MotiView>

                  {/* Info Cards */}
                  <MotiView
                    from={{ translateY: 30, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    transition={{
                      type: 'timing',
                      duration: 500,
                      delay: 700,
                    }}
                    className="space-y-3"
                  >
                    {/* Education */}
                    <View className="bg-white/10 rounded-xl p-4">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="school-outline" size={20} color="#fbbf24" />
                        <Text className="text-white font-semibold ml-2 text-lg">
                          Education
                        </Text>
                      </View>
                      <Text className="text-white/90">
                        {zennyInfo.education}
                      </Text>
                    </View>

                    {/* Work */}
                    <View className="bg-white/10 rounded-xl p-4">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="briefcase-outline" size={20} color="#10b981" />
                        <Text className="text-white font-semibold ml-2 text-lg">
                          Work
                        </Text>
                      </View>
                      <Text className="text-white/90 mb-1">
                        {zennyInfo.occupation}
                      </Text>
                      <Text className="text-white/70 text-sm">
                        Weekend: {zennyInfo.weekend}
                      </Text>
                    </View>

                    {/* Personality */}
                    <View className="bg-white/10 rounded-xl p-4">
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="heart-outline" size={20} color="#f472b6" />
                        <Text className="text-white font-semibold ml-2 text-lg">
                          Personality
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap">
                        {zennyInfo.personality.map((trait, index) => (
                          <MotiView
                            key={trait}
                            from={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: 'timing',
                              duration: 300,
                              delay: 800 + (index * 100),
                            }}
                            className="bg-white/20 rounded-full px-3 py-1 mr-2 mb-2"
                          >
                            <Text className="text-white text-sm">
                              {trait}
                            </Text>
                          </MotiView>
                        ))}
                      </View>
                    </View>

                    {/* Interests */}
                    <View className="bg-white/10 rounded-xl p-4">
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="star-outline" size={20} color="#f59e0b" />
                        <Text className="text-white font-semibold ml-2 text-lg">
                          Interests
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap">
                        {zennyInfo.interests.map((interest, index) => (
                          <MotiView
                            key={interest}
                            from={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: 'timing',
                              duration: 300,
                              delay: 1000 + (index * 100),
                            }}
                            className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full px-3 py-1 mr-2 mb-2 border border-white/20"
                          >
                            <Text className="text-white text-sm">
                              {interest}
                            </Text>
                          </MotiView>
                        ))}
                      </View>
                    </View>
                  </MotiView>

                  {/* Fun Message */}
                  <MotiView
                    from={{ translateY: 30, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    transition={{
                      type: 'timing',
                      duration: 500,
                      delay: 1200,
                    }}
                    className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-4 mt-4 border border-white/20"
                  >
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#a78bfa" />
                      <Text className="text-white font-semibold ml-2">
                        Let's Chat!
                      </Text>
                    </View>
                    <Text className="text-white/90 text-sm">
                      I'm here to listen, understand, and be your supportive friend.
                      Ready to dive into some meaningful conversations? 🌊
                    </Text>
                  </MotiView>
                </LinearGradient>
              </MotiView>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default ChatHeader;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cosmicGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})