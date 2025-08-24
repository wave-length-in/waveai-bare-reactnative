import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onInputChange: (text: string) => void;
  onImagePreview: (file: ImagePicker.ImagePickerAsset, text?: string) => number;
  onImageUpload: (image_url: string, messageId: number) => void;
  onImageUploadError: (messageId: number) => void;
  inputValue: string;
  remainingTime?: number | null;
}

const placeholders = ["Type here...", "Ask Zenny anything", "What's your mood?"];

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onInputChange,
  onImagePreview,
  onImageUpload,
  onImageUploadError,
  inputValue,
  remainingTime,
}) => {
  const [localInputValue, setLocalInputValue] = useState(inputValue);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Sync local state with prop when it changes externally
  useEffect(() => {
    setLocalInputValue(inputValue);
  }, [inputValue]);

  // Placeholder rotation with animation
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  // Debounced onChange to reduce parent re-renders
  const debouncedOnInputChange = useCallback((value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onInputChange(value);
    }, 100);
  }, [onInputChange]);

  // Handle local input change with immediate UI update
  const handleInputChange = useCallback((text: string) => {
    setLocalInputValue(text);
    debouncedOnInputChange(text);
  }, [debouncedOnInputChange]);

  // Handle content size change for auto-resize
  const handleContentSizeChange = useCallback((event: any) => {
    const newHeight = Math.min(Math.max(40, event.nativeEvent.contentSize.height), 120);
    setInputHeight(newHeight);
  }, []);

  const handleSubmit = useCallback(() => {
    if (localInputValue.trim()) {
      const messageToSend = localInputValue.trim();
      
      // Clear both local and parent state immediately
      setLocalInputValue("");
      
      // Clear the debounce timer to prevent stale updates
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      
      // Immediately notify parent of empty state
      onInputChange("");
      
      // Send the message
      onSendMessage(messageToSend);
    }
  }, [localInputValue, onSendMessage, onInputChange]);

  const uploadImageToServer = useCallback(async (imageAsset: ImagePicker.ImagePickerAsset): Promise<string> => {
    try {
      // Create FormData for upload
      const formData = new FormData();
      
      // Read the file as base64 (you might need to adjust this based on your API)
      const base64 = await FileSystem.readAsStringAsync(imageAsset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Append the image to FormData
      formData.append('image', {
        uri: imageAsset.uri,
        type: imageAsset.mimeType || 'image/jpeg',
        name: imageAsset.fileName || `image_${Date.now()}.jpg`,
      } as any);

      // Replace with your actual API URL
      const API_URL = 'YOUR_API_URL_HERE';
      
      const response = await fetch(`${API_URL}/upload-image/`, {
        method: "POST",
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload Failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Upload failed: Server returned unsuccessful response');
      }

      return data.image_url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }, []);

  const handleImageSelect = useCallback(async () => {
    if (isUploading) return;

    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageAsset = result.assets[0];
        
        // Check file size (10MB limit)
        const fileInfo = await FileSystem.getInfoAsync(imageAsset.uri);
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (fileInfo.exists && fileInfo.size && fileInfo.size > maxSize) {
          Alert.alert("File Too Large", "File size must be less than 10MB");
          return;
        }

        // Capture current input text
        const currentInputText = localInputValue.trim();

        // Clear input immediately
        setLocalInputValue("");
        
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        
        onInputChange("");

        // Create preview with current text
        const messageId = onImagePreview(imageAsset, currentInputText || "");
        setIsUploading(true);

        try {
          // Upload image to server
          const image_url = await uploadImageToServer(imageAsset);

          // Update with server URL
          onImageUpload(image_url, messageId);

          Alert.alert("Success", "Image uploaded successfully!");
        } catch (error) {
          console.log('Image Upload failed:', error);
          Alert.alert("Upload Failed", "Failed to upload image");
          onImageUploadError(messageId);
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert("Error", "Failed to select image");
      setIsUploading(false);
    }
  }, [isUploading, localInputValue, onImagePreview, onImageUpload, onImageUploadError, onInputChange, uploadImageToServer]);

  const canSend = localInputValue.trim() && !isUploading;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={[styles.inputContainer, { minHeight: inputHeight + 20 }]}
      >
        <View style={styles.inputWrapper}>
          {!localInputValue && (
            <Animated.View style={[styles.placeholderContainer, { opacity: fadeAnim }]}>
              <Text style={styles.placeholder}>
                {placeholders[placeholderIndex]}
              </Text>
            </Animated.View>
          )}
          
          <TextInput
            style={[styles.textInput, { height: Math.max(40, inputHeight) }]}
            value={localInputValue}
            onChangeText={handleInputChange}
            onContentSizeChange={handleContentSizeChange}
            multiline
            textAlignVertical="center"
            placeholderTextColor="transparent" // Hide default placeholder
            selectionColor="#19A4EA"
          />

          <View style={styles.buttonsContainer}>
            {/* Image Upload Button */}
            <TouchableOpacity
              style={[styles.iconButton, isUploading && styles.disabledButton]}
              onPress={handleImageSelect}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isUploading ? "hourglass-outline" : "image-outline"} 
                size={20} 
                color={isUploading ? "#999" : "#fff"} 
              />
            </TouchableOpacity>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.iconButton, !canSend && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!canSend}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={canSend ? "#fff" : "#999"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  inputContainer: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 60,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'relative',
  },
  placeholderContainer: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -8 }],
    pointerEvents: 'none',
    zIndex: 1,
  },
  placeholder: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ChatInput;