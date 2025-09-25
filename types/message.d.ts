// Add this to your types file or wherever Message interface is defined

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp?: string;
  isFromServer?: boolean;
  delivered?: boolean;
  isTyping?: boolean;
  
  // Image-related properties
  imageFile?: ImagePicker.ImagePickerAsset;           // For preview with File object
  imageUrl?: string;          // For uploaded image URL from server
  image_url?: string;         // Alternative naming (if your API uses this)
  isImageUploading?: boolean; // Loading state for image uploads

  // Audio-related properties
  audioFile?: string;         // For local audio file URI
  audioUrl?: string;          // For uploaded audio URL from server
  audio_url?: string;         // Alternative naming (if your API uses this)
  isAudioUploading?: boolean; // Loading state for audio uploads
  audioDuration?: number;     // Duration in milliseconds
  
  // TTS (Text-to-Speech) properties for AI messages
  ttsAudioUrl?: string;       // Generated TTS audio URL
  ttsProcessing?: boolean;    // Loading state for TTS generation
  messageType?: 'text' | 'audio'; // Message type from backend

  deliveryStatus?: 'pending' | 'sent' | 'delivered';
}