import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useContext, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

interface ToastData {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));

  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    setToast({ type, title, message });
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after 3 seconds
    setTimeout(() => {
      hideToast();
    }, 3000);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  };

  const getToastStyles = () => {
    switch (toast?.type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: 'checkmark-circle' as const,
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: 'close-circle' as const,
          iconColor: '#FFFFFF',
        };
      case 'info':
        return {
          backgroundColor: '#3B82F6',
          icon: 'information-circle' as const,
          iconColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: '#6B7280',
          icon: 'information-circle' as const,
          iconColor: '#FFFFFF',
        };
    }
  };

  const styles = getToastStyles();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 20,
            right: 20,
            zIndex: 9999,
            opacity: fadeAnim,
            transform: [{ translateY }],
          }}
        >
          <TouchableOpacity
            onPress={hideToast}
            activeOpacity={0.9}
            style={{
              backgroundColor: styles.backgroundColor,
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons
              name={styles.icon}
              size={24}
              color={styles.iconColor}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: toast.message ? 4 : 0,
                }}
              >
                {toast.title}
              </Text>
              {toast.message && (
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    opacity: 0.9,
                  }}
                >
                  {toast.message}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

// Legacy function for backward compatibility
export const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
  // This will be replaced by the context-based implementation
  console.warn('showToast called without ToastProvider context. Please use useToast hook instead.');
};