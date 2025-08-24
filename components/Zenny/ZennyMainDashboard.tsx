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

// Types
interface Message {
    id: number;
    type: 'user' | 'ai';
    content: string;
    timestamp?: string | Date;
    isTyping?: boolean;
    delivered?: boolean;
    deliveryStatus?: 'pending' | 'sent' | 'delivered';
    image_url?: string;
    imageFile?: ImagePicker.ImagePickerAsset;
    isImageUploading?: boolean;
    isFromServer?: boolean;
}

// Constants - Replace with your actual URLs
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
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const typingTimer = useRef<NodeJS.Timeout | null>(null);
    const pendingMessagesRef = useRef<string[]>([]);
    const pendingImageRef = useRef<string | null>(null);
    const isUserActivelyTypingRef = useRef(false);
    const deliveryTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
    const messagesBackupRef = useRef<Message[]>([]);

    // Memoize character config to prevent recreation
    const characterConfig = useMemo(() => ({
        characterId,
        characterName
    }), [characterId, characterName]);

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

    // Debounced AI trigger function
    const triggerAiReplyWithDebounce = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
            if (socket && !isUserActivelyTypingRef.current &&
                (pendingMessagesRef.current.length > 0 || pendingImageRef.current)) {

                const combinedMessage = pendingMessagesRef.current.join(" ");
                const imageUrl = pendingImageRef.current;

                // Get user ID from storage
                const authData = await getStoredAuthData();
                const userId = authData?.userId;

                if (!userId) {
                    console.error('User ID not found in storage');
                    return;
                }

                // Mark messages as delivered
                setMessages((prev) => {
                    return prev.map((msg) => {
                        if (msg.type === "user" && (msg.deliveryStatus === 'sent' || msg.delivered === false)) {
                            const existingTimeout = deliveryTimeoutsRef.current.get(msg.id);
                            if (existingTimeout) {
                                clearTimeout(existingTimeout);
                                deliveryTimeoutsRef.current.delete(msg.id);
                            }
                            return {
                                ...msg,
                                deliveryStatus: 'delivered' as const,
                                delivered: true
                            };
                        }
                        return msg;
                    });
                });

                setLoading(true);

                // Send summarize_message for both text and image content
                if (combinedMessage.trim() || imageUrl) {
                    socket.emit("summarize_message", {
                        userId,
                        characterId: characterConfig.characterId,
                        message: combinedMessage.trim() || "",
                        image_url: imageUrl || undefined
                    });
                }

                // Trigger AI with combined message and/or image
                const aiPayload: any = {
                    userId,
                    characterId: characterConfig.characterId,
                    characterName: characterConfig.characterName,
                };

                if (combinedMessage.trim()) {
                    aiPayload.message = combinedMessage;
                }

                if (imageUrl) {
                    aiPayload.image_url = imageUrl;
                }

                socket.emit("trigger_ai_reply", aiPayload);

                // Clear pending content
                pendingMessagesRef.current = [];
                pendingImageRef.current = null;
            }
        }, 2000);
    }, [socket, characterConfig]);

    // Setup Socket connection
    useEffect(() => {
        const setupSocket = async () => {
            try {
                const authData = await getStoredAuthData();
                const userId = authData?.userId;

                if (!userId) {
                    console.error('User ID not found, cannot setup socket');
                    return;
                }

                const newSocket = io(SOCKET_SERVER_URL, {
                    transports: ['websocket'],
                    reconnection: true,
                    secure: false,
                });

                setSocket(newSocket);

                newSocket.on('connect', () => {
                    console.log('✅ Connected to SocketIO');
                    console.log('🔍 Fetching chat history for:', {
                        userId,
                        characterId: characterConfig.characterId
                    });

                    newSocket.emit('fetch_chat_history', {
                        userId,
                        characterId: characterConfig.characterId,
                    });
                });

                newSocket.on('receive_chat_history', (data) => {
  console.log('📩 Raw chat history data:', JSON.stringify(data, null, 2));
  
  try {
    let messagesArray = [];
    
    if (typeof data === 'string') {
      // Parse log-formatted string into an array of message objects
      const lines = data.split('\n').filter(l => l.trim());
      const messages = [];
      let currentMessage = { id: '', sender: '', content: '' };

      for (let line of lines) {
        const match = line.match(/^LOG\s+(\d+)\.\s+\[([^\]]+)\]\s+(.*)$/);
        if (match) {
          if (currentMessage.id) {
            messages.push({ ...currentMessage });
          }
          currentMessage = {
            id: match[1],
            sender: match[2],
            content: match[3]
          };
        } else if (currentMessage.id) {
          // Append multi-line content
          currentMessage.content += '\n' + line;
        }
      }
      if (currentMessage.id) {
        messages.push({ ...currentMessage });
      }
      messagesArray = messages;
    } else {
      // Handle non-string data (arrays or objects)
      if (data && Array.isArray(data)) {
        messagesArray = data;
      } else if (data && data.messages && Array.isArray(data.messages)) {
        messagesArray = data.messages;
      } else if (data && data.data && Array.isArray(data.data)) {
        messagesArray = data.data;
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        messagesArray = [data];
      }
    }
    
    console.log('📋 Messages array to process:', messagesArray);
    
    if (messagesArray.length === 0) {
      console.log('📭 No messages found in chat history');
      setMessages([]);
      return;
    }
    
    // Directly map the parsed array to Message format
    const fetchedMessages: Message[] = messagesArray.map((msg: any, index: number) => {
      console.log(`🔍 Processing message ${index}:`, msg);
      
      let messageType: 'user' | 'ai' = 'ai';
      if (msg.sender === 'user' || msg.type === 'user' || msg.from === 'user' || (typeof msg.sender === 'string' && msg.sender.toLowerCase() === 'user')) {
        messageType = 'user';
      } else if (msg.sender === 'ai' || msg.type === 'ai' || msg.from === 'ai' || msg.sender === 'bot' || (typeof msg.sender === 'string' && msg.sender.toLowerCase() === 'ai')) {
        messageType = 'ai';
      }
      
      const messageContent = msg.message || msg.content || msg.text || msg.body || msg.content || '';
      const messageTimestamp = msg.timestamp || msg.created_at || msg.createdAt || msg.date || new Date().toISOString();
      
      return {
        id: msg.id || msg._id || msg.id || (Date.now() + index + Math.random()),
        type: messageType,
        content: messageContent.trim(),
        isTyping: false,
        timestamp: messageTimestamp,
        image_url: msg.image_url || msg.imageUrl || msg.image,
        delivered: messageType === 'user' ? true : undefined,
        deliveryStatus: messageType === 'user' ? ('delivered' as const) : undefined,
        isFromServer: true
      };
    });
    
    console.log(`📨 Setting ${fetchedMessages.length} messages to state`);
    setMessages(fetchedMessages);
    messagesBackupRef.current = fetchedMessages;
    setIsHistoryLoaded(true);
    
  } catch (error) {
    console.error('❌ Error processing chat history:', error);
    console.error('Raw data that caused error:', data);
    setMessages([]);
    setIsHistoryLoaded(true);
  }
});

                newSocket.on('chat_history_error', (data) => {
                    console.error('❌ Error fetching chat history:', data.error);
                    setMessages([]); // Set empty array on error
                    setIsHistoryLoaded(true);
                });

                newSocket.on('receive_message', (data) => {
                    console.log('📨 Received new message:', data); // Debug log

                    setMessages((prev) => {
                        const updatedMessages = prev.map((msg) => {
                            if (msg.type === "user" && (msg.deliveryStatus !== 'delivered' || !msg.delivered)) {
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
                                id: Date.now() + Math.random(),
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
                    console.error('❌ Socket connection error:', error.message);
                });

                newSocket.on('disconnect', (reason) => {
                    console.log('🔌 Socket disconnected:', reason);
                });

                return newSocket;
            } catch (error) {
                console.error('❌ Error setting up socket:', error);
            }
        };

        setupSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            if (typingTimer.current) {
                clearTimeout(typingTimer.current);
            }
        };
    }, [characterConfig]);

    const handleImagePreview = useCallback((file: ImagePicker.ImagePickerAsset, text: string = "") => {
        const previewMessage: Message = {
            id: Date.now() + Math.random(),
            type: 'user',
            content: text,
            timestamp: generateISTTimestamp(),
            isFromServer: false,
            imageFile: file,
            isImageUploading: true,
            delivered: false,
            deliveryStatus: 'pending' as const
        };

        setMessages((prev) => [...prev, previewMessage]);
        setDeliveryStatusWithTimeout(previewMessage.id);

        if (text.trim()) {
            pendingMessagesRef.current.push(text);
        }

        return previewMessage.id;
    }, [setDeliveryStatusWithTimeout]);

    const handleImageUpload = useCallback(async (image_url: string, messageId: number) => {
        if (!socket) return;

        let messageContent = '';
        const authData = await getStoredAuthData();
        const userId = authData?.userId;

        if (!userId) {
            console.error('User ID not found');
            return;
        }

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
            userId,
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
    }, [socket, characterConfig, triggerAiReplyWithDebounce]);

    const handleImageUploadError = useCallback((messageId: number) => {
        const existingTimeout = deliveryTimeoutsRef.current.get(messageId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            deliveryTimeoutsRef.current.delete(messageId);
        }

        setMessages((prev) => prev.filter(msg => msg.id !== messageId));
    }, []);

    const handleSendMessage = useCallback(async (content: string) => {
        if (!socket || !content.trim()) return;

        const authData = await getStoredAuthData();
        const userId = authData?.userId;

        if (!userId) {
            console.error('User ID not found');
            return;
        }

        const userMessage: Message = {
            id: Date.now() + Math.random(),
            type: 'user',
            content,
            timestamp: generateISTTimestamp(),
            isFromServer: false,
            delivered: false,
            deliveryStatus: 'pending' as const
        };

        setMessages((prev) => [...prev, userMessage]);
        setDeliveryStatusWithTimeout(userMessage.id);

        // Send message to backend
        socket.emit('send_message', {
            userId,
            characterId: characterConfig.characterId,
            characterName: characterConfig.characterName,
            message: content,
        });

        // Add to pending messages for AI processing
        pendingMessagesRef.current.push(content);

        // Mark user as not actively typing
        isUserActivelyTypingRef.current = false;

        // Start debounce timer
        triggerAiReplyWithDebounce();

        // Clear input value
        setInputValue("");
    }, [socket, characterConfig, triggerAiReplyWithDebounce, setDeliveryStatusWithTimeout]);

    const handleInputChange = useCallback((text: string) => {
        setInputValue(text);

        if (typingTimer.current) {
            clearTimeout(typingTimer.current);
        }

        if (text.trim()) {
            if (!isUserActivelyTypingRef.current) {
                isUserActivelyTypingRef.current = true;
            }

            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
        } else {
            typingTimer.current = setTimeout(() => {
                isUserActivelyTypingRef.current = false;

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

    // Backup and restore mechanism
    useEffect(() => {
        const backupMessages = () => {
            if (messages.length > 0) {
                messagesBackupRef.current = [...messages];
            }
        };

        const restoreInterval = setInterval(() => {
            if (isHistoryLoaded && messages.length === 0 && messagesBackupRef.current.length > 0) {
                console.log('🔄 Restoring messages from backup');
                setMessages([...messagesBackupRef.current]);
            }
        }, 1000);

        backupMessages();

        return () => clearInterval(restoreInterval);
    }, [messages, isHistoryLoaded]);

    // Debug effect to log messages state changes
    useEffect(() => {
        console.log('🔄 Messages state updated:', messages.length, 'messages');
        if (messages.length > 0) {
            console.log('📋 Current messages in state:');
            messages.forEach((msg, idx) => {
                console.log(`  ${idx + 1}. [${msg.type}] ${msg.content?.substring(0, 100)}${msg.content && msg.content.length > 100 ? '...' : ''}`);
            });
        } else {
            console.log('📭 No messages in state');
        }
    }, [messages]);

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