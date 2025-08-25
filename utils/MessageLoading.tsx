import React from "react";
import { View, StyleSheet } from "react-native";
import { MotiView } from "moti";

const dots = [1, 2, 3];

const MessageTypeLoading: React.FC = () => {
  return (
    <View style={styles.container}>
      {dots.map((dot, index) => (
        <MotiView
          key={index}
          from={{ translateY: 0 }}
          animate={{ translateY: -8 }}
          transition={{
            loop: true,
            type: "timing",
            duration: 600,
            delay: index * 200,
          }}
          style={styles.dot}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
});

export default MessageTypeLoading;
