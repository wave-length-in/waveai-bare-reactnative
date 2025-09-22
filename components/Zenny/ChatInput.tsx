import { API_URL } from '@/config/apiUrl';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import VoiceRecorder from './VoiceRecorder';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onInputChange: (text: string) => void;
  onImagePreview: (file: ImagePicker.ImagePickerAsset, text?: string) => number;
  onImageUpload?: (imageUrl: string, messageId: number) => void;
  onImageUploadError?: (messageId: number) => void;
  onVoiceRecordingComplete?: (audioUri: string, messageId: number) => void;
  onVoiceRecordingError?: (messageId: number) => void;
  inputValue: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onInputChange,
  onImagePreview,
  onImageUpload,
  onImageUploadError,
  onVoiceRecordingComplete,
  onVoiceRecordingError,
  inputValue,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleInputChange = useCallback(
    (text: string) => {
      onInputChange(text);
    },
    [onInputChange]
  );

  const handleSubmit = useCallback(() => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      onInputChange('');
    }
  }, [inputValue, onSendMessage, onInputChange]);

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

    try {
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
          if (onImageUpload) onImageUpload(imageUrl, messageId);
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
  }, [isUploading, isRecording, inputValue, onImagePreview, onImageUpload, onImageUploadError]);

  const handleVoiceRecordingComplete = useCallback((audioUri: string) => {
    console.log('🎤 Voice recording completed:', audioUri);
    
    // Create a temporary message ID for the voice message
    const messageId = Date.now();
    
    if (onVoiceRecordingComplete) {
      onVoiceRecordingComplete(audioUri, messageId);
    }
    
    setIsRecording(false);
  }, [onVoiceRecordingComplete]);

  const handleVoiceRecordingCancel = useCallback(() => {
    setIsRecording(false);
  }, []);

  const startVoiceRecording = useCallback(() => {
    setIsRecording(true);
  }, []);

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
          />

          {/* Microphone Button */}
          <TouchableOpacity 
            className="p-2" 
            onPress={startVoiceRecording} 
            disabled={isUploading}
          >
            <Ionicons
              name="mic"
              size={22}
              color={isUploading ? '#999' : '#fff'}
            />
          </TouchableOpacity>

          {/* Image Button */}
          <TouchableOpacity className="p-2" onPress={handleImageSelect} disabled={isUploading}>
            <Ionicons
              name="image-outline"
              size={22}
              color={isUploading ? '#999' : '#fff'}
            />
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            className={`p-2 ${!canSend ? 'opacity-50' : ''}`}
            onPress={handleSubmit}
            disabled={!canSend}
          >
            <Ionicons name="send" size={22} color={canSend ? '#fff' : '#999'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ChatInput;
