import { SOCKET_URL } from '@/config/apiUrl';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet
} from 'react-native';
import { io, Socket } from 'socket.io-client';

import { getStoredAuthData } from '@/services/auth';
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
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pendingMessagesRef = useRef<string[]>([]);
    const pendingImageRef = useRef<string | null>(null);
    const isUserActivelyTypingRef = useRef(false);
    const deliveryTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

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
    const triggerAiReplyWithDebounce = useCallback(() => {
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
            newSocket.emit('fetch_chat_history', {
                userId: userId,
                characterId: characterConfig.characterId,
            });
        });

        newSocket.on('receive_chat_history', (data) => {
            const fetchedMessages: Message[] = data.messages.map((msg: any, index: number) => ({
                id: index + 1,
                type: msg.sender as 'user' | 'ai',
                content: msg.message,
                isTyping: false,
                timestamp: msg.timestamp,
                image_url: msg.image_url,
                delivered: msg.sender === "user" ? true : undefined,
                deliveryStatus: msg.sender === "user" ? ('delivered' as const) : undefined
            }));
            setMessages(fetchedMessages);
        });

        newSocket.on('chat_history_error', (data) => {
            console.error('Error fetching chat history:', data.error);
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
                        isFromServer: true
                    },
                ];
            });

            setLoading(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
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
        triggerAiReplyWithDebounce();
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
        });

        // Add to pending messages for AI processing
        pendingMessagesRef.current.push(content);

        // Mark user as not actively typing (they just sent a message)
        isUserActivelyTypingRef.current = false;

        // Start/restart the debounce timer immediately
        triggerAiReplyWithDebounce();

        // Clear input value
        setInputValue("");
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
                    triggerAiReplyWithDebounce();
                }
            }, 500);
        }
    }, [triggerAiReplyWithDebounce]);

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
                    />

                    <ChatInput
                        onSendMessage={handleSendMessage}
                        onInputChange={handleInputChange}
                        onImagePreview={handleImagePreview}
                        onImageUpload={handleImageUpload}
                        onImageUploadError={handleImageUploadError}
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
});

export default ZennyMainDashboard;