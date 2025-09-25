import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

interface RecordingStatusProps {
  onComplete?: () => void;
}

const RecordingStatus: React.FC<RecordingStatusProps> = ({ onComplete }) => {
  const [animationKey, setAnimationKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 400);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getWaveformBars = () => {
    const bars = [];
    const heights = [12, 18, 24, 20, 16, 22, 14, 26, 18, 20];
    
    for (let i = 0; i < 10; i++) {
      const height = heights[i];
      const isActive = (i + animationKey) % 3 === 0;
      
      bars.push(
        <View
          key={i}
          className={`w-1 mx-0.5 rounded-full ${
            isActive ? 'bg-blue-400' : 'bg-blue-300/50'
          }`}
          style={{ height: isActive ? height : height * 0.6 }}
        />
      );
    }
    return bars;
  };

  return (
    <View className="mx-4 mb-2">
      {/* Simple text above */}
      <Text className="text-white/70 text-sm text-center mb-2">
        Zenny is recording...
      </Text>
      
      {/* Compact audio component */}
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 300 }}
        className="rounded-2xl bg-slate-800/80 border border-slate-600/30 px-4 py-3"
      >
        <View className="flex-row items-center">
          {/* Recording dot */}
          <MotiView
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{
              type: "timing",
              duration: 1200,
              loop: true,
            }}
            className="w-3 h-3 rounded-full bg-red-500 mr-3"
          />

          {/* Waveform */}
          <View className="flex-1 flex-row items-center justify-center">
            <View className="flex-row items-center">
              {getWaveformBars()}
            </View>
          </View>

          {/* Mic icon */}
          <Ionicons name="mic" size={16} color="#60A5FA" />
        </View>
      </MotiView>
    </View>
  );
};

export default RecordingStatus;