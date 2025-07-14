import EnterMobileNumber from "@/components/auth/EnterMobileNumber";
import OTPVerification from "@/components/auth/OtpVerification";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ImageBackground, Keyboard, TextInput, View } from 'react-native';

const LoginScreen: React.FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [snapPoints, setSnapPoints] = useState<string[]>(["50%"]);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleKeyboardShow = () => {
    setIsKeyboardVisible(true);
    setSnapPoints(["50%", "80%"]);
  };

  const handleKeyboardHide = () => {
    setIsKeyboardVisible(false);
    setSnapPoints(["50%"]);
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", handleKeyboardShow);
    const hideSubscription = Keyboard.addListener("keyboardDidHide", handleKeyboardHide);
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Handle snapping after snapPoints update
  useEffect(() => {
    // Delay snapping to ensure snapPoints is applied
    const timer = setTimeout(() => {
      const targetIndex = isKeyboardVisible && snapPoints.length > 1 ? 1 : 0;
      if (targetIndex >= 0 && targetIndex < snapPoints.length) {
        bottomSheetRef.current?.snapToIndex(targetIndex);
      }
    }, 100); // Small delay to allow snapPoints to update

    return () => clearTimeout(timer);
  }, [snapPoints, isKeyboardVisible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  return (
    <View className="flex-1">
      <ImageBackground
        source={require("../../assets/images/images/bg2.jpg")}
        className="w-full h-full"
        resizeMode="cover"
      />
      <BottomSheet
        ref={bottomSheetRef}
        index={snapPoints.length > 0 ? 0 : -1} 
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={false}
      >
        <BottomSheetView className="h-full items-center">
          {!mobile || mobile.length !== 10 ? (
            <EnterMobileNumber
              mobile={mobile}
              setMobile={setMobile}
              onGetOtp={() => setMobile(mobile)}
            />
          ) : (
            <OTPVerification
              otp={otp}
              mobile={mobile}
              setOtp={setOtp}
              inputRefs={inputRefs}
              onChangeMobile={() => setMobile('')}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default LoginScreen;