"use client";
import { SOCKET_URL } from '@/config/apiUrl';
import {
    trackAIResponse,
    trackChatInitiated,
    trackImageUpload,
    trackMessageSent,
    trackPageView,
    trackVoiceRecording,
} from '@/services/analytics';
import { getStoredAuthData } from '@/services/auth';
import { convertSpeechToText } from '@/services/speechToText';
import { convertTextToSpeech } from '@/services/textToSpeech';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import { ChatSection } from './ChatSection';

const SOCKET_SERVER_URL = SOCKET_URL;

const generateISTTimestamp = () => new Date().toISOString();

interface Message {
    id: number;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
    isFromServer?: boolean;
    isTyping?: boolean;
    image_url?: string;
    imageFile?: ImagePicker.ImagePickerAsset;
    isImageUploading?: boolean;
    audio_url?: string;
    audioFile?: string;
    isAudioUploading?: boolean;
    audioDuration?: number;
    ttsAudioUrl?: string;
    ttsProcessing?: boolean;
    delivered?: boolean;
    deliveryStatus?: 'pending' | 'sent' | 'delivered';
    messageType?: 'text' | 'audio';
}

interface ZennyMainDashboardProps {
    characterId?: string;
    characterName?: string;
    characterImage?: string;
}

const ZennyMainDashboard: React.FC<ZennyMainDashboardProps> = ({
    characterId = '688210873496b5e441480d22',
    characterName = 'Zenny',
    characterImage,
}) => {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [isProcessingTTS, setIsProcessingTTS] = useState(false);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingMessagesRef = useRef<string[]>([]);
    const pendingImageRef = useRef<string | null>(null);
    const deliveryTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
        new Map(),
    );

    // Get userId and track page view on mount
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

        if (userId) {
            trackPageView('Chat Screen', {
                user_id: userId,
                character_id: characterId,
                character_name: characterName,
            });
            trackChatInitiated(userId, characterId, characterName);
        }
    }, [userId, characterId, characterName]);

    // Cleanup delivery timeouts on unmount
    useEffect(() => {
        return () => {
            deliveryTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
            deliveryTimeoutsRef.current.clear();
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    // Setup Socket connection
    useEffect(() => {
        if (!userId) return;

        const newSocket = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            reconnection: true,
            secure: false,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Connected to SocketIO');
            setIsLoadingHistory(true);
            newSocket.emit('fetch_chat_history', {
                userId,
                characterId,
            });
        });

        newSocket.on('receive_chat_history', (data) => {
            console.log('📜 Chat history received:', data.messages.length, 'messages');
            const fetchedMessages: Message[] = data.messages.map((msg: any, index: number) => ({
                id: index + 1,
                type: msg.sender as 'user' | 'ai',
                content: msg.message,
                isTyping: false,
                timestamp: msg.timestamp,
                image_url: msg.image_url,
                audio_url: msg.audio_url,
                audioDuration: msg.audio_duration,
                ttsAudioUrl: msg.sender === 'ai' ? msg.audio_url : undefined,
                ttsProcessing: false,
                delivered: msg.sender === 'user' ? true : undefined,
                deliveryStatus: msg.sender === 'user' ? 'delivered' : undefined,
            }));

            setMessages(fetchedMessages);
            setIsLoadingHistory(false);
        });

        newSocket.on('chat_history_error', (data) => {
            console.error('Error fetching chat history:', data.error);
            setIsLoadingHistory(false);
        });

        newSocket.on('receive_message', (data) => {
            setMessages((prev) => {
                const updatedMessages = prev.map((msg) => {
                    if (msg.type === 'user' && !msg.delivered) {
                        const existingTimeout = deliveryTimeoutsRef.current.get(msg.id);
                        if (existingTimeout) {
                            clearTimeout(existingTimeout);
                            deliveryTimeoutsRef.current.delete(msg.id);
                        }
                        
                        return { ...msg, delivered: true, deliveryStatus: 'delivered' as const };
                    }
                    return msg;
                });

                return [
                    ...updatedMessages,
                    {
                        id: Date.now() + Math.random(),
                        type: 'ai',
                        content: data.message,
                        isTyping: true,
                        timestamp: data.timestamp,
                        isFromServer: true,
                        ttsProcessing: data.type === 'audio',
                        messageType: data.type || 'text',
                    },
                ];
            });

            setLoading(false);

            if (data.type === 'audio' && data.message) {
                generateTTSForMessage(data.message);
            }

            if (userId) {
                trackAIResponse(userId, undefined, characterId);
            }
        });

        newSocket.on('receive_tts', (data) => {
            setMessages((prev) =>
                prev.map((msg, index) =>
                    msg.type === 'ai' &&
                        msg.isTyping &&
                        msg.messageType === 'audio' &&
                        index === prev.length - 1
                        ? { ...msg, ttsAudioUrl: data.audio_url, ttsProcessing: false, isTyping: false }
                        : msg,
                ),
            );
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            setIsLoadingHistory(false);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [userId, characterId]);

    const setDeliveryStatusWithTimeout = useCallback((messageId: number) => {
        const existingTimeout = deliveryTimeoutsRef.current.get(messageId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        const timeout = setTimeout(() => {
            setMessages((prev) =>
                prev.map((msg) =>
                     msg.id === messageId ? { ...msg, deliveryStatus: 'sent' as const } : msg,
                ),
            );
            deliveryTimeoutsRef.current.delete(messageId);
        }, 750);
        deliveryTimeoutsRef.current.set(messageId, timeout);
    }, []);

    const triggerAiReplyWithDebounce = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            debounceTimer.current = null;

            if (socket && userId && (pendingMessagesRef.current.length > 0 || pendingImageRef.current)) {
                const combinedMessage = pendingMessagesRef.current.join(' ');
                const imageUrl = pendingImageRef.current;

                setMessages((prev) =>
                    prev.map((msg) => {
                        if (msg.type === 'user' && !msg.delivered) {
                            const existingTimeout = deliveryTimeoutsRef.current.get(msg.id);
                            if (existingTimeout) {
                                clearTimeout(existingTimeout);
                                deliveryTimeoutsRef.current.delete(msg.id);
                            }
                             return { ...msg, deliveryStatus: 'delivered' as const, delivered: true };
                        }
                        return msg;
                    }),
                );

                setLoading(true);

                if (combinedMessage.trim() || imageUrl) {
                    socket.emit('summarize_message', {
                        userId,
                        characterId,
                        message: combinedMessage.trim() || '',
                        image_url: imageUrl || undefined,
                    });
                }

                const aiPayload: any = {
                    userId,
                    characterId,
                    characterName,
                    type: 'text',
                };

                if (combinedMessage.trim()) {
                    aiPayload.message = combinedMessage;
                }
                if (imageUrl) {
                    aiPayload.image_url = imageUrl;
                }

                socket.emit('trigger_ai_reply', aiPayload);
                pendingMessagesRef.current = [];
                pendingImageRef.current = null;
            }
        }, 2500);
    }, [socket, userId, characterId, characterName]);

    const handleImagePreview = useCallback(
        (file: ImagePicker.ImagePickerAsset, text: string = '') => {
            const previewMessage: Message = {
                id: Date.now() + Math.random(),
                type: 'user',
                content: text,
                timestamp: generateISTTimestamp(),
                isFromServer: false,
                imageFile: file,
                isImageUploading: true,
                delivered: false,
                 deliveryStatus: 'pending' as const,
            };

            setMessages((prev) => [...prev, previewMessage]);
            setDeliveryStatusWithTimeout(previewMessage.id);

            if (text.trim()) {
                pendingMessagesRef.current.push(text);
            }
            setIsUploading(true);
            return previewMessage.id;
        },
        [setDeliveryStatusWithTimeout],
    );

    const handleImageUpload = useCallback(
        (image_url: string, messageId: number) => {
            if (!socket || !userId) return;

            let messageContent = '';
            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg.id === messageId) {
                        messageContent = msg.content || '';
                        return {
                            ...msg,
                            image_url,
                            isImageUploading: false,
                            imageFile: undefined,
                            delivered: false,
                            deliveryStatus: msg.deliveryStatus ?? 'pending',
                        };
                    }
                    return msg;
                }),
            );

            setIsUploading(false);

            socket.emit('upload_image', {
                userId,
                characterId,
                characterName,
                image_url,
                message: messageContent,
            });

            pendingImageRef.current = image_url;

            if (userId) {
                trackImageUpload(userId, true, characterId);
                trackMessageSent(userId, 'image', undefined, characterId);
            }

            triggerAiReplyWithDebounce();
        },
        [socket, userId, characterId, characterName, triggerAiReplyWithDebounce],
    );

    const handleImageUploadError = useCallback(
        (messageId: number) => {
            const existingTimeout = deliveryTimeoutsRef.current.get(messageId);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
                deliveryTimeoutsRef.current.delete(messageId);
            }
            setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
            setIsUploading(false);

            if (userId) {
                trackImageUpload(userId, false, characterId);
            }
        },
        [userId, characterId],
    );

    const handleVoiceRecordingComplete = useCallback(
        async (audioUri: string, messageId: number) => {
            if (!socket || !userId) return;

            console.log('🎤 Voice recording completed, processing...', { audioUri, messageId });

            if (userId) {
                trackVoiceRecording(userId, 'stop', characterId);
            }

            const voiceMessage: Message = {
                id: messageId,
                type: 'user',
                content: '',
                timestamp: generateISTTimestamp(),
                isFromServer: false,
                audioFile: audioUri,
                isAudioUploading: true,
                delivered: false,
                 deliveryStatus: 'pending' as const,
            };

            setMessages((prev) => [...prev, voiceMessage]);
            setDeliveryStatusWithTimeout(messageId);
            setIsProcessingVoice(true);

            try {
                const speechResult = await convertSpeechToText({
                    audioUri,
                    userId,
                    characterId,
                });

                console.log('🎤 Speech-to-text result:', speechResult);

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageId
                            ? {
                                ...msg,
                                content: speechResult.DisplayText,
                                audio_url: speechResult.file_url,
                                audioDuration: speechResult.Duration,
                                isAudioUploading: false,
                                audioFile: undefined,
                            }
                            : msg,
                    ),
                );

                socket.emit('send_message', {
                    userId,
                    characterId,
                    characterName,
                    message: speechResult.DisplayText,
                    audio_url: speechResult.file_url,
                    type: 'audio',
                });

                pendingMessagesRef.current.push(speechResult.DisplayText);

                if (userId) {
                    trackMessageSent(userId, 'audio', speechResult.DisplayText.length, characterId);
                }

                triggerAiReplyWithDebounce();
            } catch (error) {
                console.error('❌ Voice processing failed:', error);
                setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
                const existingTimeout = deliveryTimeoutsRef.current.get(messageId);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                    deliveryTimeoutsRef.current.delete(messageId);
                }
            } finally {
                setIsProcessingVoice(false);
            }
        },
        [socket, userId, characterId, characterName, triggerAiReplyWithDebounce, setDeliveryStatusWithTimeout],
    );

    const handleVoiceRecordingError = useCallback((messageId: number) => {
        console.error('❌ Voice recording error for message:', messageId);
        const existingTimeout = deliveryTimeoutsRef.current.get(messageId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            deliveryTimeoutsRef.current.delete(messageId);
        }
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        setIsProcessingVoice(false);
    }, []);

    const handleSendMessage = useCallback(
        (content: string) => {
            if (!socket || !userId || !content.trim()) return;

            const userMessage: Message = {
                id: Date.now() + Math.random(),
                type: 'user',
                content,
                timestamp: generateISTTimestamp(),
                isFromServer: false,
                delivered: false,
                 deliveryStatus: 'pending' as const,
            };

            setMessages((prev) => [...prev, userMessage]);
            setDeliveryStatusWithTimeout(userMessage.id);

            socket.emit('send_message', {
                userId,
                characterId,
                characterName,
                message: content,
                type: 'text',
            });

            pendingMessagesRef.current.push(content);

            if (userId) {
                trackMessageSent(userId, 'text', content.length, characterId);
            }

            triggerAiReplyWithDebounce();
        },
        [socket, userId, characterId, characterName, triggerAiReplyWithDebounce, setDeliveryStatusWithTimeout],
    );

    const handleInputChange = useCallback((text: string) => {
        setInputValue(text);
        if (text.trim() && (pendingMessagesRef.current.length > 0 || pendingImageRef.current)) {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
        }
    }, []);

    const cleanTextForTTS = (text: string): string => {
        return text
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Miscellaneous Symbols and Pictographs
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map Symbols
            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
            .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous Symbols
            .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
            .replace(/[^\w\s.,!?]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
    };

    const generateTTSForMessage = useCallback(
        async (text: string) => {
            if (!userId) return;

            try {
                setIsProcessingTTS(true);
                const cleanedText = cleanTextForTTS(text);

                if (!cleanedText.trim()) {
                    console.log('⚠️ No text content after cleaning, skipping TTS');
                    setMessages((prev) =>
                        prev.map((msg, index) =>
                            msg.type === 'ai' && index === prev.length - 1 && msg.ttsProcessing
                                ? { ...msg, ttsProcessing: false }
                                : msg,
                        ),
                    );
                    return;
                }

                console.log('🔊 Generating TTS for AI message...', {
                    originalText: text.substring(0, 50) + '...',
                    cleanedText: cleanedText.substring(0, 50) + '...',
                });

                const ttsResult = await convertTextToSpeech({
                    userId,
                    characterId,
                    text: cleanedText,
                    voiceName: 'en-IN-NeerjaNeural',
                    language: 'en-IN',
                });

                console.log('✅ TTS generation successful:', { audioUrl: ttsResult.audio_url });

                setMessages((prev) =>
                    prev.map((msg, index) =>
                        msg.type === 'ai' && index === prev.length - 1 && msg.ttsProcessing
                            ? { ...msg, ttsAudioUrl: ttsResult.audio_url, ttsProcessing: false }
                            : msg,
                    ),
                );
            } catch (error) {
                console.error('❌ TTS generation failed:', error);
                setMessages((prev) =>
                    prev.map((msg, index) =>
                        msg.type === 'ai' && index === prev.length - 1 && msg.ttsProcessing
                            ? { ...msg, ttsProcessing: false }
                            : msg,
                    ),
                );
            } finally {
                setIsProcessingTTS(false);
            }
        },
        [userId, characterId],
    );

    const refetchChatHistory = useCallback(() => {
        if (!socket || !userId) return;
        try {
            setIsLoadingHistory(true);
            socket.emit('fetch_chat_history', {
                userId,
                characterId,
            });
        } catch (e) {
            console.log('[chat] Refetch history error:', e);
            setIsLoadingHistory(false);
        }
    }, [socket, userId, characterId]);

    const handleTypingComplete = useCallback((messageId: number) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === messageId ? { ...msg, isTyping: false } : msg,
            ),
        );
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#000', '#111']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.gradient}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(30, 144, 255, 0.2)', 'transparent']}
                    start={{ x: 0, y: 0.3 }}
                    end={{ x: 1, y: 0.7 }}
                    style={styles.cosmicOverlay}
                />
                {(isUploading || isProcessingVoice || isProcessingTTS) && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text style={styles.loaderText}>
                            {isProcessingVoice
                                ? 'Transcribing voice...'
                                : isProcessingTTS
                                    ? 'Generating AI voice...'
                                    : 'Uploading...'}
                        </Text>
                    </View>
                )}
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <ChatHeader
                        name={characterName}
                        username={`${characterName.toLowerCase()}_`}
                        image={characterImage}
                        onClearChatSuccess={refetchChatHistory}
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
                        userId={userId || ''}
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
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    loaderText: {
        color: '#FFF',
        fontSize: 18,
        marginTop: 16,
    },
});

export default ZennyMainDashboard;