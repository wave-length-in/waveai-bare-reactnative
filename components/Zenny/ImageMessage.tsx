// ImageMessage.tsx
import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp?: string | Date;
  isTyping?: boolean;
  delivered?: boolean;
  deliveryStatus?: 'pending' | 'sent' | 'delivered';
  image_url?: string;
  imageFile?: any;
  isImageUploading?: boolean;
  isFromServer?: boolean;
}

interface ImageMessageProps {
  message: Message;
}

const { width, height } = Dimensions.get('window');

const ImageMessage: React.FC<ImageMessageProps> = ({ message }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImagePress = () => {
    if (!message.isImageUploading && !imageError) {
      setIsModalVisible(true);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  const getImageSource = () => {
    if (message.image_url) {
      return { uri: message.image_url };
    } else if (message.imageFile?.uri) {
      return { uri: message.imageFile.uri };
    }
    return null;
  };

  const imageSource = getImageSource();

  return (
    <>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handleImagePress}
        activeOpacity={0.8}
        disabled={message.isImageUploading || imageError}
      >
        <LinearGradient
          colors={message.type === 'user' ? ['#19A4EA', '#1e40af'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.imageBubble}
        >
          {imageSource ? (
            <View style={styles.imageWrapper}>
              <Image
                source={imageSource}
                style={styles.image}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              
              {/* Loading overlay */}
              {(isImageLoading || message.isImageUploading) && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  {message.isImageUploading && (
                    <Text style={styles.loadingText}>Uploading...</Text>
                  )}
                </View>
              )}

              {/* Error overlay */}
              {imageError && (
                <View style={styles.errorOverlay}>
                  <Ionicons name="image-outline" size={40} color="#fff" />
                  <Text style={styles.errorText}>Failed to load image</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="image-outline" size={40} color="#fff" />
              <Text style={styles.placeholderText}>No image available</Text>
            </View>
          )}

          {/* Text content below image */}
          {message.content && (
            <Text style={styles.imageCaption}>{message.content}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Full screen image modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setIsModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              
              {imageSource && (
                <Image
                  source={imageSource}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    maxWidth: width * 0.7,
  },
  imageBubble: {
    borderRadius: 16,
    overflow: 'hidden',
    borderTopRightRadius: 4, // Assuming this is a user message
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  placeholderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  imageCaption: {
    color: '#fff',
    fontSize: 16,
    padding: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullScreenImage: {
    width: width * 0.9,
    height: height * 0.8,
  },
});

export default ImageMessage;