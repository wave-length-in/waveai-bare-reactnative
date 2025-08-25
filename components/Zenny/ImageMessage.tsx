import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  image_url?: string;
  imageFile?: any;
}

interface ImageMessageProps {
  message: Message;
}

const ImageMessage: React.FC<ImageMessageProps> = ({ message }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const getImageSource = () => {
    if (message.image_url) return { uri: message.image_url };
    if (message.imageFile?.uri) return { uri: message.imageFile.uri };
    return null;
  };

  const imageSource = getImageSource();

  const openModal = () => {
    setIsModalVisible(true);
    setTimeout(() => setShowContent(true), 20); // trigger animation
  };

  const closeModal = () => {
    setShowContent(false); // animate out
    setTimeout(() => setIsModalVisible(false), 300); // wait for animation to finish
  };

  return (
    <>
      {/* Thumbnail */}
      <TouchableOpacity onPress={openModal} activeOpacity={0.8}>
        {imageSource && (
          <Image
            source={imageSource}
            style={{
              width: width * 0.6,
              height: width * 0.6,
              borderRadius: 12,
            }}
            resizeMode="cover"
          />
        )}
        {message.content ? (
          <Text style={styles.imageCaption}>{message.content}</Text>
        ) : null}
      </TouchableOpacity>

      {/* Fullscreen Modal */}
      <Modal visible={isModalVisible} transparent animationType="none">
        <View style={styles.modalContainer}>
          {showContent && (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "timing", duration: 300 }}
              style={styles.modalInner}
            >
              <TouchableOpacity
                style={styles.backdrop}
                onPress={closeModal}
                activeOpacity={1}
              />
              {imageSource && (
                <Image
                  source={imageSource}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </MotiView>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  imageCaption: {
    color: "#fff",
    fontSize: 16,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  fullScreenImage: {
    width: width * 0.9,
    height: height * 0.8,
    borderRadius: 12,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
});

export default ImageMessage;
