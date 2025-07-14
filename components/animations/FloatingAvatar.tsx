import React from "react";
import { ImageSourcePropType } from "react-native";
import { MotiView } from "moti";

type FloatingAvatarProps = {
  children?: React.ReactNode;
  style?: string;
  delay?: number;
};

export const FloatingAvatar = ({
  children,
  delay = 0,
}: FloatingAvatarProps) => {
  return (
    <MotiView
      from={{ translateY: -4 }}
      animate={{ translateY: 4 }}
      transition={{
        type: "timing",
        duration: 2000,
        delay,
        repeat: Infinity,
      }}
    >
      {children}
    </MotiView>
  );
};
