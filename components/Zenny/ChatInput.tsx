import { API_URL } from '@/config/apiUrl';
import { trackButtonClick, trackVoiceRecording } from '@/services/analytics';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ImageSelectionModal from './ImageSelectionModal';
import VoiceRecorder from './VoiceRecorder';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onImagePreview: (file: ImagePicker.ImagePickerAsset, text?: string) => number;
  onImageUpload?: (imageUrl: string, messageId: number, source?: 'camera' | 'gallery') => void;
  onImageUploadError?: (messageId: number) => void;
  onVoiceRecordingComplete?: (audioUri: string, messageId: number) => void;
  onVoiceRecordingError?: (messageId: number) => void;
  userId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onImagePreview,
  onImageUpload,
  onImageUploadError,
  onVoiceRecordingComplete,
  onVoiceRecordingError,
  userId,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    console.log('🔍 handleSubmit called with inputValue:', inputValue);
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;
    
    // CRITICAL: Clear input FIRST for instant feedback
    setInputValue('');
    
    // Then send the message (non-blocking)
    onSendMessage(trimmedValue);
    
    // Track analytics (async, non-blocking)
    trackButtonClick('Send Message', 'Chat Input', { 
      user_id: userId, 
      message_length: trimmedValue.length 
    });
  }, [inputValue, onSendMessage, userId]);

  const uploadImageToServer = async (imageUri: string): Promise<string> => {
    const formData = new FormData();

    const imageFile = { 
      uri: imageUri,
      type: 'image/jpeg',
      name: `image_${Date.now()}.jpg`,
    } as any;

    formData.append('image', imageFile);

    try {
      const response = await fetch(`${API_URL}/upload-image/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.success && data.image_url) {
        return data.image_url;
      } else {
        throw new Error('Upload failed: Invalid response format');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleImageSelect = useCallback(async () => {
    if (isUploading || isRecording) return;
    
    trackButtonClick('Image Select', 'Chat Input', { user_id: userId, source: 'modal' });
    setShowImageModal(true);
  }, [isUploading, isRecording, userId]);

  const handleModalClose = useCallback(() => {
    setShowImageModal(false);
  }, []);

  const handleCameraCapture = useCallback(async () => {
    try {
      // Track camera usage
      trackButtonClick('Camera Capture', 'Chat Input', { user_id: userId, source: 'camera' });
      
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission Required', 'Camera access is required to take photos!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageAsset = result.assets[0];
        const messageId = onImagePreview(imageAsset, inputValue);

        setIsUploading(true);

        try {
          const imageUrl = await uploadImageToServer(imageAsset.uri);
          if (onImageUpload) onImageUpload(imageUrl, messageId, 'camera');
        } catch (uploadError) {
          if (onImageUploadError) onImageUploadError(messageId);
          Alert.alert(
            'Upload Failed',
            'Failed to upload image. Please check your internet connection and try again.'
          );
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
      setIsUploading(false);
    }
  }, [inputValue, onImagePreview, onImageUpload, onImageUploadError, userId]);

  const handleGallerySelect = useCallback(async () => {
    try {
      // Track gallery usage
      trackButtonClick('Gallery Select', 'Chat Input', { user_id: userId, source: 'gallery' });
      
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera roll access is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageAsset = result.assets[0];
        const messageId = onImagePreview(imageAsset, inputValue);

        setIsUploading(true);

        try {
          const imageUrl = await uploadImageToServer(imageAsset.uri);
          if (onImageUpload) onImageUpload(imageUrl, messageId, 'gallery');
        } catch (uploadError) {
          if (onImageUploadError) onImageUploadError(messageId);
          Alert.alert(
            'Upload Failed',
            'Failed to upload image. Please check your internet connection and try again.'
          );
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
      setIsUploading(false);
    }
  }, [inputValue, onImagePreview, onImageUpload, onImageUploadError, userId]);

  const handleCameraPress = useCallback(() => {
    setShowImageModal(false);
    // Use setTimeout to ensure modal closes before camera opens
    setTimeout(() => {
      handleCameraCapture();
    }, 100);
  }, [handleCameraCapture]);

  const handleGalleryPress = useCallback(() => {
    setShowImageModal(false);
    // Use setTimeout to ensure modal closes before gallery opens
    setTimeout(() => {
      handleGallerySelect();
    }, 100);
  }, [handleGallerySelect]);

  const handleVoiceRecordingComplete = useCallback((audioUri: string) => {
    console.log('🎤 Voice recording completed:', audioUri);
    
    const messageId = Date.now();
    
    if (onVoiceRecordingComplete) {
      onVoiceRecordingComplete(audioUri, messageId);
    }
    
    setIsRecording(false);
  }, [onVoiceRecordingComplete]);

  const handleVoiceRecordingCancel = useCallback(() => {
    setIsRecording(false);
    trackVoiceRecording(userId, 'cancel');
    trackButtonClick('Voice Recording Cancel', 'Chat Input', { user_id: userId });
  }, [userId]);

  const startVoiceRecording = useCallback(() => {
    setIsRecording(true);
    trackVoiceRecording(userId, 'start');
    trackButtonClick('Voice Recording Start', 'Chat Input', { user_id: userId });
  }, [userId]);

  // OPTIMIZED: Simplified send button state
  const canSend = inputValue.trim().length > 0 && !isUploading && !isRecording;

  return (
    <View className="px-4 pb-4 pt-2">
      {isRecording ? (
        <VoiceRecorder
          onRecordingComplete={handleVoiceRecordingComplete}
          onCancel={handleVoiceRecordingCancel}
        />
      ) : (
        <View className="relative flex-row items-end rounded-2xl border border-white/20 bg-white/5 p-2">
          <TextInput
            className="flex-1 text-white text-base px-2"
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline
            textAlignVertical="center"
            autoCorrect={false}
            autoCapitalize="sentences"
            returnKeyType="default"
            blurOnSubmit={false}
            maxLength={1000}
            keyboardType="default"
            textContentType="none"
            autoComplete="off"
          />

          {/* Microphone Button */}
          <TouchableOpacity 
            className="p-2" 
            onPress={startVoiceRecording} 
            disabled={isUploading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="mic"
              size={22}
              color={isUploading ? '#999' : '#fff'}
            />
          </TouchableOpacity>

          {/* Image Button */}
          <TouchableOpacity 
            className="p-2" 
            onPress={handleImageSelect} 
            disabled={isUploading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="image-outline"
              size={22}
              color={isUploading ? '#999' : '#fff'}
            />
          </TouchableOpacity>

          {/* Send Button - OPTIMIZED */}
          <TouchableOpacity
            className={`p-2 ${!canSend ? 'opacity-50' : ''}`}
            onPress={handleSubmit}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={22} color={canSend ? '#fff' : '#999'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Image Selection Modal */}
      <ImageSelectionModal
        visible={showImageModal}
        onClose={handleModalClose}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
      />
    </View>
  );
};

export default ChatInput;