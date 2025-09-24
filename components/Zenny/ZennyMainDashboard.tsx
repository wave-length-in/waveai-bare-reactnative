import { SOCKET_URL } from '@/config/apiUrl';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { io, Socket } from 'socket.io-client';

import { getStoredAuthData } from '@/services/auth';
import { convertSpeechToText } from '@/services/speechToText';
import { convertTextToSpeech } from '@/services/textToSpeech';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import { ChatSection } from './ChatSection';

// Constants
const SOCKET_SERVER_URL = SOCKET_URL;

const generateISTTimestamp = () => {
    return new Date().toISOString();
};

interface ZennyMainDashboardProps {
    characterId?: string;
    characterName?: string;
    characterImage?: string;
}

const ZennyMainDashboard: React.FC<ZennyMainDashboardProps> = ({
    characterId = "688210873496b5e441480d22",
    characterName = "Zenny",
    characterImage
}) => {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true); // New state for skeleton
    
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pendingMessagesRef = useRef<string[]>([]);
    const pendingImageRef = useRef<string | null>(null);
    const isUserActivelyTypingRef = useRef(false);
    const deliveryTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const [isUploading, setIsUploading] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [isProcessingTTS, setIsProcessingTTS] = useState(false);

    // Memoize character config to prevent recreation
    const characterConfig = useMemo(() => ({
        characterId,
        characterName
    }), [characterId, characterName]);

    // Get userId on component mount
    useEffect(() => {
        const getUserId = async () => {
            try {
                const authData = await getStoredAuthData();
                if (authData?.userId) {
                    setUserId(authData.userId);
                } else {
                    console.error('User ID not found in storage');
                }
            } catch (error) {
                console.error('Error getting user ID:', error);
            }
        };
        getUserId();
    }, []);

    // Cleanup delivery timeouts on unmount
    useEffect(() => {
        return () => {
            deliveryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    // Helper function to set delivery status with timeout
    const setDeliveryStatusWithTimeout = useCallback((messageId: number) => {
        // Clear any existing timeout for this message
        const existingTimeout = deliveryTimeoutsRef.current.get(messageId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Set timeout to show double tick after 0.75 seconds
        const timeout = setTimeout(() => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === messageId
                        ? { ...msg, deliveryStatus: 'sent' as const }
                        : msg
                )
            );
            deliveryTimeoutsRef.current.delete(messageId);
        }, 750);

        deliveryTimeoutsRef.current.set(messageId, timeout);
    }, []);

    // Debounced AI trigger function - Updated to handle both text and images
    const triggerAiReplyWithDebounce = useCallback((messageType: 'text' | 'audio' = 'text') => {
        // Clear any existing timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            // Only trigger if user is not actively typing and we have pending content (messages or image)
            if (socket && userId && !isUserActivelyTypingRef.current &&
                (pendingMessagesRef.current.length > 0 || pendingImageRef.current)) {

                const combinedMessage = pendingMessagesRef.current.join(" ");
                const imageUrl = pendingImageRef.current;

                // Mark messages as delivered (blue tick) when AI is triggered
                setMessages((prev) => {
                    return prev.map((msg) => {
                        if (msg.type === "user" && (msg.deliveryStatus === 'sent' || msg.delivered === false)) {
                            // Clear any pending timeouts for this message
                            const existingTimeout = deliveryTimeoutsRef.current.get(msg.id);
                            if (existingTimeout) {
                                clearTimeout(existingTimeout);
                                deliveryTimeoutsRef.current.delete(msg.id);
                            }
                            return {
                                ...msg,
                                deliveryStatus: 'delivered' as const, // Blue tick
                                delivered: true
                            };
                        }
                        return msg;
                    });
                });

                // Set loading to true when actually triggering AI
                setLoading(true);

                // Send summarize_message for both text and image content
                if (combinedMessage.trim() || imageUrl) {
                    socket.emit("summarize_message", {
                        userId: userId,
                        characterId: characterConfig.characterId,
                        message: combinedMessage.trim() || "",
                        image_url: imageUrl || undefined
                    });
                }

                // Trigger AI with combined message and/or image
                const aiPayload: any = {
                    userId: userId,
                    characterId: characterConfig.characterId,
                    characterName: characterConfig.characterName,
                    type: messageType, // Use the passed message type
                };

                // Add message if we have text content
                if (combinedMessage.trim()) {
                    aiPayload.message = combinedMessage;
                }

                // Add image_url if we have pending image
                if (imageUrl) {
                    aiPayload.image_url = imageUrl;
                }

                socket.emit("trigger_ai_reply", aiPayload);

                // Clear the pending content after sending
                pendingMessagesRef.current = [];
                pendingImageRef.current = null;
            }
        }, 2000); // 2-second delay
    }, [socket, userId, characterConfig]);

    // Setup Socket connection
    useEffect(() => {
        if (!userId) return; // Wait for userId to be available

        const newSocket = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            reconnection: true,
            secure: false,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Connected to SocketIO');
            // Set loading history state when fetching begins
            setIsLoadingHistory(true);
            newSocket.emit('fetch_chat_history', {
                userId: userId,
                characterId: characterConfig.characterId,
            });
        });

        newSocket.on('receive_chat_history', (data) => {
            console.log('📜 Chat history received:', data.messages.length, 'messages');
            
            const fetchedMessages: Message[] = data.messages.map((msg: any, index: number) => {
                // Log TTS audio data for debugging
                if (msg.sender === 'ai' && msg.audio_url) {
                    console.log('🔊 Found TTS audio in chat history:', {
                        messageId: index + 1,
                        audioUrl: msg.audio_url,
                        content: msg.message?.substring(0, 50) + '...'
                    });
                }
                
                return {
                    id: index + 1,
                    type: msg.sender as 'user' | 'ai',
                    content: msg.message,
                    isTyping: false,
                    timestamp: msg.timestamp,
                    image_url: msg.image_url,
                    audio_url: msg.audio_url,
                    audioDuration: msg.audio_duration,
                    ttsAudioUrl: msg.sender === 'ai' ? msg.audio_url : undefined, // For AI messages, audio_url is TTS
                    ttsProcessing: false, // Set to false for fetched messages
                    delivered: msg.sender === "user" ? true : undefined,
                    deliveryStatus: msg.sender === "user" ? ('delivered' as const) : undefined
                };
            });
            
            setMessages(fetchedMessages);
            // Hide skeleton after messages are loaded
            setIsLoadingHistory(false);
        });

        newSocket.on('chat_history_error', (data) => {
            console.error('Error fetching chat history:', data.error);
            // Hide skeleton even on error
            setIsLoadingHistory(false);
        });

        newSocket.on('receive_message', (data) => {
            setMessages((prev) => {
                const updatedMessages = prev.map((msg) => {
                    if (msg.type === "user" && (msg.deliveryStatus !== 'delivered' || !msg.delivered)) {
                        // Clear any pending timeouts
                        const existingTimeout = deliveryTimeoutsRef.current.get(msg.id);
                        if (existingTimeout) {
                            clearTimeout(existingTimeout);
                            deliveryTimeoutsRef.current.delete(msg.id);
                        }
                        return {
                            ...msg,
                            delivered: true,
                            deliveryStatus: 'delivered' as const
                        };
                    }
                    return msg;
                });

                return [
                    ...updatedMessages,
                    {
                        id: Date.now() + Math.random(), // Ensure unique ID
                        type: 'ai',
                        content: data.message,
                        isTyping: true,
                        timestamp: data.timestamp,
                        isFromServer: true,
                        ttsProcessing: true, // Mark for TTS processing
                    },
                ];
            });

            setLoading(false);
            
            // Generate TTS for the AI response and wait for completion
            generateTTSForMessage(data.message);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            // Hide skeleton on connection error
            setIsLoadingHistory(false);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [userId, characterConfig]);

    const handleImagePreview = useCallback((file: ImagePicker.ImagePickerAsset, text: string = "") => {
        const previewMessage: Message = {
            id: Date.now() + Math.random(), // Ensure unique ID
            type: 'user',
            content: text,
            timestamp: generateISTTimestamp(),
            isFromServer: false,
            imageFile: file,
            isImageUploading: true,
            delivered: false,
            deliveryStatus: 'pending' as const // Single tick (grey)
        };

        setMessages((prev) => [...prev, previewMessage]);

        // Start the delivery status timeout
        setDeliveryStatusWithTimeout(previewMessage.id);

        // Only add text to pending if it's not empty
        if (text.trim()) {
            pendingMessagesRef.current.push(text);
        }

        setIsUploading(true);

        return previewMessage.id;
    }, [setDeliveryStatusWithTimeout]);

    const handleImageUpload = useCallback((image_url: string, messageId: number) => {
        if (!socket || !userId) return;

        let messageContent = '';

        // Update the message and capture its content
        setMessages((prev) => {
            return prev.map(msg => {
                if (msg.id === messageId) {
                    messageContent = msg.content || '';
                    return {
                        ...msg,
                        image_url: image_url,
                        isImageUploading: false,
                        imageFile: undefined,
                        delivered: false,
                        deliveryStatus: msg.deliveryStatus ?? ('pending' as const)
                    };
                }
                return msg;
            });
        });

        // Hide loader after successful upload
        setIsUploading(false);

        // Send to server
        socket.emit('upload_image', {
            userId: userId,
            characterId: characterConfig.characterId,
            characterName: characterConfig.characterName,
            image_url: image_url,
            message: messageContent,
        });

        // Add image to pending for AI
        pendingImageRef.current = image_url;

        // Start AI processing
        isUserActivelyTypingRef.current = false;
        triggerAiReplyWithDebounce('text');
    }, [socket, userId, characterConfig, triggerAiReplyWithDebounce]);

    const handleImageUploadError = useCallback((messageId: number) => {
        // Clear any timeouts for this message
        const existingTimeout = deliveryTimeoutsRef.current.get(messageId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            deliveryTimeoutsRef.current.delete(messageId);
        }

        // Remove the failed upload message
        setMessages((prev) => prev.filter(msg => msg.id !== messageId));
        setIsUploading(false);
    }, []);

    const handleVoiceRecordingComplete = useCallback(async (audioUri: string, messageId: number) => {
        if (!socket || !userId) return;

        console.log('🎤 Voice recording completed, processing...', { audioUri, messageId });

        // Create a preview message for the voice note
        const voiceMessage: Message = {
            id: messageId,
            type: 'user',
            content: '',
            timestamp: generateISTTimestamp(),
            isFromServer: false,
            audioFile: audioUri,
            isAudioUploading: true,
            delivered: false,
            deliveryStatus: 'pending' as const
        };

        setMessages((prev) => [...prev, voiceMessage]);
        setDeliveryStatusWithTimeout(messageId);
        setIsProcessingVoice(true);

        try {
            // Convert speech to text using your API
            const speechResult = await convertSpeechToText({
                audioUri,
                userId,
                characterId: characterConfig.characterId,
            });

            console.log('🎤 Speech-to-text result:', speechResult);

            // Update the message with the transcribed text and audio URL
            setMessages((prev) => 
                prev.map(msg => 
                    msg.id === messageId 
                        ? {
                            ...msg,
                            content: speechResult.DisplayText,
                            audio_url: speechResult.file_url,
                            audioDuration: speechResult.Duration,
                            isAudioUploading: false,
                            audioFile: undefined,
                        }
                        : msg
                )
            );

        // Send message to backend
        socket.emit('send_message', {
            userId: userId,
            characterId: characterConfig.characterId,
            characterName: characterConfig.characterName,
            message: speechResult.DisplayText,
            audio_url: speechResult.file_url,
            type: 'audio',
        });

            // Add to pending messages for AI processing
            pendingMessagesRef.current.push(speechResult.DisplayText);

            // Mark user as not actively typing and trigger AI with audio type
            isUserActivelyTypingRef.current = false;
            triggerAiReplyWithDebounce('audio');

        } catch (error) {
            console.error('❌ Voice processing failed:', error);
            
            // Remove the failed voice message
            setMessages((prev) => prev.filter(msg => msg.id !== messageId));
            
            // Clear any timeouts for this message
            const existingTimeout = deliveryTimeoutsRef.current.get(messageId);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
                deliveryTimeoutsRef.current.delete(messageId);
            }
        } finally {
            setIsProcessingVoice(false);
        }
    }, [socket, userId, characterConfig, triggerAiReplyWithDebounce, setDeliveryStatusWithTimeout]);

    const handleVoiceRecordingError = useCallback((messageId: number) => {
        console.error('❌ Voice recording error for message:', messageId);
        
        // Clear any timeouts for this message
        const existingTimeout = deliveryTimeoutsRef.current.get(messageId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            deliveryTimeoutsRef.current.delete(messageId);
        }

        // Remove the failed voice message
        setMessages((prev) => prev.filter(msg => msg.id !== messageId));
        setIsProcessingVoice(false);
    }, []);

    const handleSendMessage = useCallback((content: string) => {
        if (!socket || !userId || !content.trim()) return;

        // Add message to the chat display with IST timestamp
        const userMessage: Message = {
            id: Date.now() + Math.random(), // Ensure unique ID
            type: 'user',
            content,
            timestamp: generateISTTimestamp(),
            isFromServer: false,
            delivered: false,
            deliveryStatus: 'pending' as const // Single tick (grey)
        };

        setMessages((prev) => [...prev, userMessage]);

        // Start the delivery status timeout (single tick -> double tick after 1s)
        setDeliveryStatusWithTimeout(userMessage.id);

        // Send message to backend for storage immediately
        socket.emit('send_message', {
            userId: userId,
            characterId: characterConfig.characterId,
            characterName: characterConfig.characterName,
            message: content,
            type: 'text',
        });

        // Add to pending messages for AI processing
        pendingMessagesRef.current.push(content);

        // Mark user as not actively typing (they just sent a message)
        isUserActivelyTypingRef.current = false;

        // Start/restart the debounce timer immediately
        triggerAiReplyWithDebounce('text');
    }, [socket, userId, characterConfig, triggerAiReplyWithDebounce, setDeliveryStatusWithTimeout]);

    const handleInputChange = useCallback((text: string) => {
        setInputValue(text);

        // Clear any existing typing timer
        if (typingTimer.current) {
            clearTimeout(typingTimer.current);
        }

        // If user is typing (text length > 0), mark as actively typing
        if (text.trim()) {
            if (!isUserActivelyTypingRef.current) {
                isUserActivelyTypingRef.current = true;
            }

            // Cancel any pending AI calls
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
        } else {
            // User cleared the input, wait a bit to see if they start typing again
            typingTimer.current = setTimeout(() => {
                isUserActivelyTypingRef.current = false;

                // If we have pending content (messages or image) and user stopped typing, restart timer
                if (pendingMessagesRef.current.length > 0 || pendingImageRef.current) {
                    triggerAiReplyWithDebounce('text');
                }
            }, 500);
        }
    }, [triggerAiReplyWithDebounce]);

    const cleanTextForTTS = (text: string): string => {
        // Remove emojis and special characters, keep only text
        return text
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Remove emoji ranges
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Remove misc symbols
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Remove transport symbols
            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove flags
            .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Remove misc symbols
            .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Remove dingbats
            .replace(/[^\w\s.,!?]/g, '')           // Remove remaining special chars
            .replace(/\s+/g, ' ')                  // Normalize whitespace
            .trim();
    };

    const generateTTSForMessage = useCallback(async (text: string) => {
        if (!userId) return;
        
        try {
            setIsProcessingTTS(true);
            
            // Clean text for TTS (remove emojis and special characters)
            const cleanedText = cleanTextForTTS(text);
            
            if (!cleanedText.trim()) {
                console.log('⚠️ No text content after cleaning, skipping TTS');
                // Just remove TTS processing flag
                setMessages((prev) => 
                    prev.map((msg, index) => {
                        if (msg.type === 'ai' && index === prev.length - 1 && msg.ttsProcessing) {
                            return {
                                ...msg,
                                ttsProcessing: false,
                            };
                        }
                        return msg;
                    })
                );
                return;
            }
            
            console.log('🔊 Generating TTS for AI message...', { 
                originalText: text.substring(0, 50) + '...',
                cleanedText: cleanedText.substring(0, 50) + '...'
            });
            
            const ttsResult = await convertTextToSpeech({
                userId,
                characterId: characterConfig.characterId,
                text: cleanedText,
                voiceName: 'en-IN-NeerjaNeural',
                language: 'en-IN',
            });
            
            console.log('✅ TTS generation successful:', { audioUrl: ttsResult.audio_url });
            
            // Update the latest AI message with TTS audio URL
            setMessages((prev) => 
                prev.map((msg, index) => {
                    // Find the latest AI message that has TTS processing
                    if (msg.type === 'ai' && index === prev.length - 1 && msg.ttsProcessing) {
                        return {
                            ...msg,
                            ttsAudioUrl: ttsResult.audio_url,
                            ttsProcessing: false,
                        };
                    }
                    return msg;
                })
            );
            
        } catch (error) {
            console.error('❌ TTS generation failed:', error);
            
            // Remove TTS processing flag on error
            setMessages((prev) => 
                prev.map((msg, index) => {
                    if (msg.type === 'ai' && index === prev.length - 1 && msg.ttsProcessing) {
                        return {
                            ...msg,
                            ttsProcessing: false,
                        };
                    }
                    return msg;
                })
            );
        } finally {
            setIsProcessingTTS(false);
        }
    }, [userId, characterConfig.characterId]);

    const handleTypingComplete = useCallback((messageId: number) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === messageId ? { ...msg, isTyping: false } : msg
            )
        );
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={["#000", "#111"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.gradient}
            >
                {/* Cosmic Background Overlay */}
                <LinearGradient
                    colors={["transparent", "rgba(30, 144, 255, 0.2)", "transparent"]}
                    start={{ x: 0, y: 0.3 }}
                    end={{ x: 1, y: 0.7 }}
                    style={styles.cosmicOverlay}
                />

                {/* Absolute loading spinner for image uploads, voice processing, and TTS */}
                {(isUploading || isProcessingVoice || isProcessingTTS) && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text className="text-white text-lg mt-4">
                            {isProcessingVoice ? 'Processing voice...' : 
                             isProcessingTTS ? 'Generating AI voice...' : 
                             'Uploading...'}
                        </Text>
                    </View>
                )}

                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    <ChatHeader
                        name={characterName}
                        username={`${characterName.toLowerCase()}_`}
                        image={characterImage}
                    />

                    <ChatSection
                        messages={messages}
                        loading={loading}
                        onTypingComplete={handleTypingComplete}
                        isLoadingHistory={isLoadingHistory}
                    />

                    <ChatInput
                        onSendMessage={handleSendMessage}
                        onInputChange={handleInputChange}
                        onImagePreview={handleImagePreview}
                        onImageUpload={handleImageUpload}
                        onImageUploadError={handleImageUploadError}
                        onVoiceRecordingComplete={handleVoiceRecordingComplete}
                        onVoiceRecordingError={handleVoiceRecordingError}
                        inputValue={inputValue}
                    />
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    cosmicOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
});

export default ZennyMainDashboard;