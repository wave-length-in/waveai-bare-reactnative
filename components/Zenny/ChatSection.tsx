import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View
} from 'react-native';

// Import components
import { default as AiReplyAnimation } from '@/components/Zenny/AiLoader';
import AudioMessage from '@/components/Zenny/AudioMessage';
import ImageMessage from '@/components/Zenny/ImageMessage';
import { cleanHtml } from '@/utils/cleanHtml';
import { formatTimestamp, getDateLabel, shouldShowTimestamp } from '@/utils/formatDatetime';
import MessageTypeLoading from '@/utils/MessageLoading';
import { splitSentencesToLines } from '@/utils/splitSentence';
import LinkPreviewComponent from './LinkPreviewComponent';
import SkeletonLoader from './SkeletonLoader';
import { TextWithLinks } from './TextWithLinks';

interface ChatSectionProps {
  loading?: boolean;
  messages: Message[];
  onTypingComplete?: (messageId: number) => void;
  isLoadingHistory?: boolean
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  loading,
  messages,
  onTypingComplete,
  isLoadingHistory = false
}) => {

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollViewRef.current) {
      // Use scrollToEnd with animated: false for immediate scroll
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      // Small delay to ensure content is rendered
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages.length, loading, scrollToBottom]);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);


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

  if (isLoadingHistory) {
    return <SkeletonLoader />;
  };

  // Track last date to insert separators
  let lastDateLabel: string | null = null;

  return (
    <View className="flex-1 px-5">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="py-4 bg-"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      >
        {/* Privacy Notice - matching Next.js styling */}
        <View className="mt-20 md:mt-0 mb-3">
          <LinearGradient
            colors={['transparent', 'rgba(25,164,234,0.5)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-2 rounded-md border-2 border-white/10 bg-white/10"
          >
            <Text className="text-white text-base text-center">
              Your data's safe, we only use it to make your chat better.
            </Text>
          </LinearGradient>
        </View>

        {messages.map((message, idx) => {
          const dateLabel = message.timestamp ? getDateLabel(message.timestamp, message.isFromServer ?? true) : null;
          const showDateLabel = dateLabel !== lastDateLabel;
          const showTimestamp = shouldShowTimestamp(idx, messages);

          if (dateLabel) lastDateLabel = dateLabel;

          // Check for image messages - both preview and uploaded
          const isImageMessage = !!(message.imageFile || message.image_url);
          
          // Check for audio messages - both local file and uploaded URL
          const isAudioMessage = !!(message.audioFile || message.audio_url || message.audioUrl);
          
          // Check for TTS audio messages for AI responses
          const isTTSAudioMessage = message.type === 'ai' && !!(message.ttsAudioUrl);

          return (
            <React.Fragment key={message.id}>
              {showDateLabel && (
                <View className="my-10">
                  <View className="w-full h-px bg-white/50" />
                  <View className="mt-4">
                    <Text className="text-white text-base font-medium text-center">
                      {dateLabel}
                    </Text>
                  </View>
                </View>
              )}

              <View className={`flex-row items-start mb-4 ${message.type === "ai" ? "justify-start" : "justify-end"
                }`}>
                {message.type === "ai" && (
                  <View className="flex-shrink-0 mr-2">
                    <Image
                      source={require('@/assets/images/zenny.jpg')}
                      className="w-8 h-8 rounded-full"
                    />
                  </View>
                )}

                <View className={`${message.type === "user"
                  ? "max-w-[70%] items-end"
                  : "max-w-[85%] text-white items-start"
                  }`}>
                  {message.type === "ai" && message.isTyping ? (
                    <AiReplyAnimation
                      text={message.content}
                      onComplete={() => onTypingComplete?.(message.id)}
                      onLineAdded={scrollToBottom}
                    />
                  ) : (
                    <>
                      {message.type === "ai" ? (
                        <View className="space-y-2">
                          {/* TTS Audio Message for AI - Show only audio when available */}
                          {isTTSAudioMessage ? (
                            <AudioMessage message={{...message, audio_url: message.ttsAudioUrl}} isUser={false} />
                          ) : (
                            <>
                              {/* TTS Processing Indicator */}
                              {message.ttsProcessing && (
                                <View className="rounded-2xl bg-white/10 border border-white/10 px-4 py-2">
                                  <Text className="text-white text-sm">🎤 Generating voice...</Text>
                                </View>
                              )}
                              
                              {/* Text Content - Only show if no TTS audio */}
                              {splitSentencesToLines(message.content || "").map((line, idx) => {
                                // If line is a link object
                                if (typeof line === "object" && line.type === "link") {
                                  return (
                                    <View key={idx} className="rounded-2xl w-fit text-md md:text-lg">
                                      <LinkPreviewComponent url={line.url} />
                                    </View>
                                  );
                                }

                                // Check inline URLs
                                const hasInlineUrl = /https?:\/\/[^\s<>"'{}|\\^`\[\]]+/gi.test(
                                  line as string
                                );

                                return (
                                  <View
                                    key={idx}
                                    className="rounded-2xl self-start mt-2 rounded-b-2xl bg-white/10 border border-white/10 px-4 py-2"
                                  >
                                    {hasInlineUrl ? (
                                      <TextWithLinks content={line as string} />
                                    ) : (
                                      <Text className="text-white text-base">
                                        {cleanHtml(line as string)}
                                      </Text>
                                    )}
                                  </View>
                                );
                              })}
                            </>
                          )}
                        </View>
                      ) : (
                        <>
                          {isAudioMessage ? (
                            <AudioMessage message={message} isUser={true} />
                          ) : isImageMessage && message.image_url ? (
                            <ImageMessage message={message} />
                          ) : message.content ? (
                            <View className="rounded-t-2xl rounded-bl-2xl bg-[#19A4EA] px-4 py-2">
                              <Text className="text-white text-base">
                                <TextWithLinks content={message.content} />
                              </Text>
                            </View>
                          ) : null}
                        </>
                      )}
                    </>
                  )}

                  {/* Timestamp and delivery status - matching Next.js logic */}
                  {showTimestamp && !message.isTyping && (
                    <View className={`flex-row gap-1 mt-1 ${message.type === "ai"
                      ? "text-xs text-white self-start"
                      : "text-xs justify-end text-white self-end"
                      }`}>
                      <Text className="text-white text-xs">
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

        {/* Loading indicator - matching Next.js logic */}
        {loading && messages.length > 0 && messages[messages.length - 1].type === "user" && (
          <View className="flex-row">
            <View className="flex-shrink-0 mr-2">
              <Image
                source={require('@/assets/images/zenny.jpg')}
                className="w-6 h-6 rounded-full"
              />
            </View>
            <View className="flex-col items-start p-2 rounded-tr-2xl rounded-b-2xl">
              <Text className="text-white text-base mb-1">
                Zenny is Typing...
              </Text>
              <MessageTypeLoading />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};