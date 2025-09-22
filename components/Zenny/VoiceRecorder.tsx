import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface VoiceRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
  onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getPermission();
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      pulseAnim.stopAnimation();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, pulseAnim]);

  const getPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Failed to get recording permission:', error);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        await getPermission();
        if (!hasPermission) {
          throw new Error('Recording permission not granted');
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    console.log('Stopping recording...');
    setIsRecording(false);
    setRecording(null);
    
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      
      if (uri) {
        onRecordingComplete(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const cancelRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }
    setIsRecording(false);
    setRecordingDuration(0);
    onCancel();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <View className="flex-row items-center justify-center p-4">
        <Text className="text-white">Requesting permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-row items-center justify-center p-4">
        <Text className="text-white text-center">
          No permission to record audio
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between p-4 bg-black/20 rounded-2xl mx-4 mb-2">
      {/* Cancel Button */}
      <TouchableOpacity
        onPress={cancelRecording}
        className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center"
      >
        <Ionicons name="close" size={20} color="#ef4444" />
      </TouchableOpacity>

      {/* Recording Info */}
      <View className="flex-1 items-center">
        <Text className="text-white text-sm mb-1">
          {isRecording ? 'Recording...' : 'Voice Message'}
        </Text>
        <Text className="text-white/70 text-xs">
          {formatTime(recordingDuration)}
        </Text>
      </View>

      {/* Record/Send Button */}
      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{
          backgroundColor: isRecording ? '#ef4444' : '#19A4EA',
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
        >
          {isRecording ? (
            <View className="w-4 h-4 bg-white rounded-sm" />
          ) : (
            <Ionicons name="mic" size={24} color="#fff" />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default VoiceRecorder;
