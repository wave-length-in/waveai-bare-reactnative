import { API_URL } from '@/config/apiUrl';

export interface TextToSpeechResponse {
  audio_size_bytes: number;
  audio_url: string;
  language: string;
  message: string;
  success: boolean;
  synthesis_time_seconds: number;
  text: string;
  total_time_seconds: number;
  voice_name: string;
}

// Utility function to remove all emojis
const removeEmojis = (input: string): string => {
  return input.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDDFF])/g,
    ''
  );
};

export interface TextToSpeechRequest {
  userId: string;
  characterId: string;
  text: string;
  voiceName?: string;
  language?: string;
}

export const convertTextToSpeech = async ({
  userId,
  characterId,
  text,
  voiceName = 'en-IN-NeerjaNeural',
  language = 'en-IN',
}: TextToSpeechRequest): Promise<TextToSpeechResponse> => {
  try {
    console.log('🔊 Starting text-to-speech conversion...', {
      userId,
      characterId,
      text: text.substring(0, 50) + '...',
      voiceName,
      language,
    });

    const sanitizedText = removeEmojis(text);
    console.log('🔊 Sanitized text:', sanitizedText);

    const response = await fetch(`${API_URL}/text-to-speech/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        character_id: characterId,
        text: sanitizedText,
        voice_name: voiceName,
        language: language,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Text-to-speech API error: ${response.status} - ${errorText}`);
    }

    const result: TextToSpeechResponse = await response.json();
    
    console.log('✅ Text-to-speech conversion successful:', {
      audioUrl: result.audio_url,
      success: result.success,
      synthesisTime: result.synthesis_time_seconds,
      audioSize: result.audio_size_bytes,
    });

    return result;
  } catch (error) {
    console.error('❌ Text-to-speech conversion failed:', error);
    throw error;
  }
};