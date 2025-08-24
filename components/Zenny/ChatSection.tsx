import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// You'll need to create these utility components/functions
import AiLoader from '@/components/Zenny/AiLoader';
import ImageMessage from '@/components/Zenny/ImageMessage';

// Utility functions (you'll need to implement these)
const cleanHtml = (text: string) => {
  // Simple HTML cleaning - you might want to use a proper HTML parser
  return text.replace(/<[^>]*>/g, '');
};

const splitSentencesToLines = (text: string) => {
  // Simple sentence splitting
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim() + '.');
};

const formatTimestamp = (timestamp?: string | Date) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const getDateLabel = (timestamp?: string | Date, isFromServer: boolean = true) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

const shouldShowTimestamp = (index: number, messages: Message[]) => {
  const currentMessage = messages[index];
  const nextMessage = messages[index + 1];
  
  // Always show timestamp for the last message
  if (index === messages.length - 1) return true;
  
  // Show timestamp if next message is from different sender
  if (nextMessage && currentMessage.type !== nextMessage.type) return true;
  
  // Show timestamp if there's a significant time gap (you can adjust this logic)
  if (currentMessage.timestamp && nextMessage?.timestamp) {
    const currentTime = new Date(currentMessage.timestamp).getTime();
    const nextTime = new Date(nextMessage.timestamp).getTime();
    const timeDiff = Math.abs(nextTime - currentTime);
    
    // Show timestamp if more than 5 minutes apart
    if (timeDiff > 5 * 60 * 1000) return true;
  }
  
  return false;
};

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

interface ChatSectionProps {
  loading?: boolean;
  messages: Message[];
  onTypingComplete?: (messageId: number) => void;
}

const { width } = Dimensions.get('window');

export const ChatSection: React.FC<ChatSectionProps> = ({
  loading,
  messages,
  onTypingComplete,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (messages.length > 0 || loading) {
      // Small delay to ensure content is rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, loading]);

  // Helper function to render delivery status icon
  const renderDeliveryStatus = (message: Message) => {
    if (message.type !== "user") return null;

    // New delivery status system
    if (message.deliveryStatus) {
      switch (message.deliveryStatus) {
        case 'pending':
          return <Ionicons name="checkmark" size={15} color="rgba(255,255,255,0.7)" />;
        case 'sent':
          return <Ionicons name="checkmark-done" size={15} color="rgba(255,255,255,0.7)" />;
        case 'delivered':
          return <Ionicons name="checkmark-done" size={15} color="#19A4EA" />;
        default:
          return <Ionicons name="checkmark" size={15} color="rgba(255,255,255,0.7)" />;
      }
    }

    // Fallback to old system for backward compatibility
    if (message.delivered !== undefined) {
      return (
        <Ionicons
          name="checkmark-done"
          size={15}
          color={message.delivered ? "#19A4EA" : "rgba(255,255,255,0.7)"}
        />
      );
    }

    return <Ionicons name="checkmark" size={15} color="rgba(255,255,255,0.7)" />;
  };

  // Track last date to insert separators
  let lastDateLabel: string | null = null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Privacy Notice */}
        <LinearGradient
          colors={['rgba(25,164,234,0.3)', 'transparent']}
          style={styles.privacyNotice}
        >
          <Text style={styles.privacyText}>
            Your data's safe, we only use it to make your chat better.
          </Text>
        </LinearGradient>

        {messages.map((message, idx) => {
          const dateLabel = message.timestamp ? getDateLabel(message.timestamp, message.isFromServer ?? true) : null;
          const showDateLabel = dateLabel !== lastDateLabel;
          const showTimestamp = shouldShowTimestamp(idx, messages);

          if (dateLabel) lastDateLabel = dateLabel;

          // Check for image messages - both preview and uploaded
          const isImageMessage = !!(message.imageFile || message.image_url);

          return (
            <React.Fragment key={message.id}>
              {showDateLabel && (
                <View style={styles.dateSeparator}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateText}>{dateLabel}</Text>
                  <View style={styles.dateLine} />
                </View>
              )}

              <View style={[
                styles.messageContainer,
                message.type === "ai" ? styles.aiMessageContainer : styles.userMessageContainer
              ]}>
                {message.type === "ai" && (
                  <Image
                    source={require('@/assets/images/zenny.jpg')}
                    style={styles.aiAvatar}
                  />
                )}

                <View style={[
                  styles.messageContent,
                  message.type === "user" ? styles.userMessageContent : styles.aiMessageContent
                ]}>
                  {message.type === "ai" && message.isTyping ? (
                    <View style={styles.typingContainer}>
                      <Text style={styles.typingText}>Zenny is typing...</Text>
                      <AiLoader />
                    </View>
                  ) : (
                    <>
                      {message.type === "ai" ? (
                        <View style={styles.aiMessagesWrapper}>
                          {splitSentencesToLines(message.content).map((line, idx) => (
                            <LinearGradient
                              key={idx}
                              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                              style={styles.aiMessageBubble}
                            >
                              <Text style={styles.aiMessageText}>
                                {cleanHtml(line)}
                              </Text>
                            </LinearGradient>
                          ))}
                        </View>
                      ) : (
                        <>
                          {isImageMessage && message.image_url ? (
                            <ImageMessage message={message} />
                          ) : message.content ? (
                            <LinearGradient
                              colors={['#19A4EA', '#1e40af']}
                              style={styles.userMessageBubble}
                            >
                              <Text style={styles.userMessageText}>
                                {cleanHtml(message.content)}
                              </Text>
                            </LinearGradient>
                          ) : null}
                        </>
                      )}
                    </>
                  )}

                  {/* Timestamp and delivery status */}
                  {showTimestamp && !message.isTyping && (
                    <View style={[
                      styles.messageInfo,
                      message.type === "ai" ? styles.aiMessageInfo : styles.userMessageInfo
                    ]}>
                      <Text style={styles.timestampText}>
                        {formatTimestamp(message.timestamp)}
                      </Text>
                      {renderDeliveryStatus(message)}
                    </View>
                  )}
                </View>
              </View>
            </React.Fragment>
          );
        })}

        {loading && messages.length > 0 && messages[messages.length - 1].type === "user" && (
          <View style={styles.messageContainer}>
            <Image
              source={require('@/assets/images/zenny.jpg')}
              style={styles.aiAvatar}
            />
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>Zenny is Typing...</Text>
              <AiLoader />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100, // Extra space for input
  },
  privacyNotice: {
    marginTop: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  privacyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: width * 0.8,
  },
  aiMessageContent: {
    alignItems: 'flex-start',
  },
  userMessageContent: {
    alignItems: 'flex-end',
  },
  aiMessagesWrapper: {
    gap: 8,
  },
  aiMessageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  aiMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  userMessageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  userMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  aiMessageInfo: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  userMessageInfo: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  timestampText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  typingText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 8,
  },
});
