import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ImageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
}

const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <SafeAreaView className="w-full">
          <LinearGradient
            colors={['#1a1a1a', '#0a0a0a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="rounded-t-3xl"
          >
            {/* Header */}
            <View className="flex-row justify-between items-center px-5 py-4 border-b border-white/10">
              <Text className="text-lg font-semibold text-white">Select Image</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View className="px-5 py-6">
              <TouchableOpacity 
                className="flex-row items-center p-4 bg-white/5 rounded-2xl mb-3" 
                onPress={onCameraPress}
              >
                <View className="w-12 h-12 rounded-full bg-blue-500/20 justify-center items-center mr-4">
                  <Ionicons name="camera" size={24} color="#1e90ff" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-white">Camera</Text>
                  <Text className="text-sm text-white/60 mt-0.5">Take a new photo</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center p-4 bg-white/5 rounded-2xl mb-6" 
                onPress={onGalleryPress}
              >
                <View className="w-12 h-12 rounded-full bg-blue-500/20 justify-center items-center mr-4">
                  <Ionicons name="images" size={24} color="#1e90ff" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-white">Gallery</Text>
                  <Text className="text-sm text-white/60 mt-0.5">Choose from photos</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <View className="px-5 pb-8">
              <TouchableOpacity 
                className="py-4 bg-white/10 rounded-2xl items-center" 
                onPress={onClose}
              >
                <Text className="text-base font-medium text-red-400">Cancel</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default ImageSelectionModal;
