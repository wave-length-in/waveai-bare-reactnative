import { MotiView } from 'moti';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const AiLoader: React.FC = () => {
  const dotAnimation = {
    from: {
      opacity: 0.4,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      scale: 1,
    },
    transition: {
      type: 'timing' as const,
      duration: 600,
      loop: true,
      repeatReverse: true,
    },
  };

  return (
    <View style={styles.container}>
      <MotiView
        {...dotAnimation}
        transition={{
          ...dotAnimation.transition,
          delay: 0,
        }}
        style={styles.dot}
      />
      <MotiView
        {...dotAnimation}
        transition={{
          ...dotAnimation.transition,
          delay: 200,
        }}
        style={styles.dot}
      />
      <MotiView
        {...dotAnimation}
        transition={{
          ...dotAnimation.transition,
          delay: 200,
        }}
        style={styles.dot}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default AiLoader;