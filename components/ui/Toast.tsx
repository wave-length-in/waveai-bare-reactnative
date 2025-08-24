import Toast from 'react-native-toast-message';
import React from 'react';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toast />
    </>
  );
};

export const showToast = (type: 'success' | 'error' | 'info', text1: string, text2?: string) => {
  Toast.show({
    type,
    text1,
    text2,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
  });
};