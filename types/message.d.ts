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

  deliveryStatus?: 'pending' | 'sent' | 'delivered';
}