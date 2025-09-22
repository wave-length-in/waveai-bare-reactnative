import { API_URL } from '@/config/apiUrl';

export interface SpeechToTextResponse {
  DisplayText: string;
  Duration: number;
  Offset: number;
  RecognitionStatus: string;
  converted: boolean;
  file_url: string;
  final_format: string;
  original_format: string;
}

export interface SpeechToTextRequest {
  audioUri: string;
  language?: string;
  userId: string;
  characterId: string;
}

export const convertSpeechToText = async ({
  audioUri,
  language = 'en-IN',
  userId,
  characterId,
}: SpeechToTextRequest): Promise<SpeechToTextResponse> => {
  try {
    console.log('🎤 Starting speech-to-text conversion...', {
      audioUri,
      language,
      userId,
      characterId,
    });

    const formData = new FormData();
    
    // Create audio file object
    const audioFile = {
      uri: audioUri,
      type: 'audio/opus',
      name: `voice_note_${Date.now()}.opus`,
    } as any;

    formData.append('audio', audioFile);
    formData.append('language', language);
    formData.append('user_id', userId);
    formData.append('character_id', characterId);

    console.log('🎤 Sending request to speech-to-text API...');

    const response = await fetch(`${API_URL}/speech-to-text/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Speech-to-text API error: ${response.status} - ${errorText}`);
    }

    const result: SpeechToTextResponse = await response.json();
    
    console.log('✅ Speech-to-text conversion successful:', {
      displayText: result.DisplayText,
      duration: result.Duration,
      fileUrl: result.file_url,
      recognitionStatus: result.RecognitionStatus,
    });

    return result;
  } catch (error) {
    console.error('❌ Speech-to-text conversion failed:', error);
    throw error;
  }
};
