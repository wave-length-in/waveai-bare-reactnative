import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AudioMessageProps {
  message: Message;
  isUser?: boolean;
}

const AudioMessage: React.FC<AudioMessageProps> = ({ message, isUser = false }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const progressRef = useRef(new Animated.Value(0)).current;

  const { width: screenWidth } = Dimensions.get('window');
  const maxWidth = screenWidth * 0.7;

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync().catch(error => {
            console.error('Error unloading sound:', error);
          });
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    if (sound) {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setPosition(status.positionMillis || 0);
          setIsPlaying(status.isPlaying || false);
          
          // Update progress bar
          if (status.durationMillis && status.durationMillis > 0) {
            const progress = (status.positionMillis || 0) / status.durationMillis;
            progressRef.setValue(Math.min(Math.max(progress, 0), 1));
          }

          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            progressRef.setValue(0);
          }
        } else if (status.error) {
          console.error('Audio playback error:', status.error);
          setIsPlaying(false);
          setIsLoading(false);
        }
      });
    }
  }, [sound, progressRef]);

  // Animate waveform while playing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setAnimationKey(prev => prev + 1);
      }, 200); // Update every 200ms for smooth animation
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying]);

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const playPause = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      } else {
        setIsLoading(true);
        
        // Get the audio URL
        const audioUrl = message.audio_url || message.audioUrl;
        if (!audioUrl) {
          console.error('No audio URL provided');
          setIsLoading(false);
          return;
        }

        console.log('Loading audio from URL:', audioUrl);
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { 
            shouldPlay: true,
            isLooping: false,
            volume: 1.0,
            rate: 1.0,
          }
        );
        
        setSound(newSound);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
      // Reset sound state on error
      setSound(null);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        setPosition(0);
        progressRef.setValue(0);
        setIsPlaying(false);
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  };

  const getWaveformBars = () => {
    // Generate waveform bars with animation based on playback progress
    const bars = [];
    const barCount = 15;
    
    for (let i = 0; i < barCount; i++) {
      // Create different heights for visual variety
      const baseHeight = 4 + (i % 3) * 4; // Heights: 4, 8, 12
      
      // If playing, make bars more dynamic
      const height = isPlaying 
        ? baseHeight + Math.random() * 8 // Add random variation when playing
        : baseHeight; // Static when not playing
      
      bars.push(
        <View
          key={i}
          className="w-1 bg-white/80 rounded-full mx-0.5"
          style={{ 
            height,
            opacity: isPlaying ? 0.8 + Math.random() * 0.4 : 0.8 // Vary opacity when playing
          }}
        />
      );
    }
    return bars;
  };

  // Don't render if no audio URL
  if (!message.audio_url && !message.audioUrl) {
    return (
      <View className={`${isUser ? 'items-end' : 'items-start'}`}>
        <View className="rounded-2xl px-4 py-3 bg-gray-500/20">
          <Text className="text-white text-sm">Audio not available</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`${isUser ? 'items-end' : 'items-start'}`}>
      <TouchableOpacity
        onPress={playPause}
        disabled={isLoading}
        className={`flex-row w-full items-center rounded-2xl px-2 py-3 ${
          isUser 
            ? 'bg-[#19A4EA] rounded-br-md ' 
            : 'bg-white/10 border border-white/20 rounded-bl-md'
        }`}
        style={{
          maxWidth: '80%',
          minWidth: 170,
        }}
      >
        {/* Play/Pause Button */}
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-1 ${
          isUser ? 'bg-white/20' : 'bg-white/10'
        }`}>
          {isLoading ? (
            <Ionicons name="hourglass" size={16} color="#fff" />
          ) : isPlaying ? (
            <Ionicons name="pause" size={16} color="#fff" />
          ) : (
            <Ionicons name="play" size={16} color="#fff" />
          )}
        </View>

        {/* Waveform Visualization */}
        <View className="flex-row items-center flex-1 mr-3 justify-center">
          <View className="flex-row items-center" key={animationKey}>
            {getWaveformBars()}
          </View>
        </View>

        {/* Progress Bar */}
        {duration > 0 && (
          <View className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden">
            <Animated.View
              className="h-full bg-white/50 rounded-full"
              style={{
                width: progressRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>
        )}

      </TouchableOpacity>
    </View>
  );
};

export default AudioMessage;
