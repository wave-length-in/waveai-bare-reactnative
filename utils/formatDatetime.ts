// React Native DateTime Utilities for IST timezone handling

export const formatTimestamp = (dateTime?: string): string => {
  if (!dateTime) return "";

  // Fix MongoDB microseconds and ensure it's UTC
  const safeDate = new Date(dateTime.slice(0, 23) + "Z");

  return safeDate.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper function to generate IST timestamp
export const generateISTTimestamp = () => {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000; // convert local to UTC
  const istOffset = 5.5 * 60 * 60000; // IST offset in ms
  const istTime = new Date(utcTime + istOffset);
  return istTime.toISOString();
};

export const convertToISTDate = (dateString: string): Date => {
  // Parse as UTC first
  const utcDate = new Date(dateString);

  // Convert to IST by adding 5.5 hours
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);

  return istDate;
};

// Helper to format date headers with explicit source indication
export const getDateLabel = (timestamp: string, isFromServer: boolean = true) => {
  const date = new Date(timestamp);
  
  let istDate: Date;
  
  if (isFromServer) {
    // Server timestamps are in UTC, convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30 in milliseconds
    istDate = new Date(date.getTime() + istOffset);
  } else {
    // Local timestamps are already in IST, use as-is
    istDate = date;
  }

  // Get current IST date for comparison
  // Use toLocaleString to get the actual IST time, not converted UTC
  const nowIST = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  // Compare dates (only the date part, not time)
  const istDateOnly = new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate());
  const todayISTOnly = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
  
  const isToday = istDateOnly.getTime() === todayISTOnly.getTime();
  if (isToday) return "Today";

  const yesterdayIST = new Date(todayISTOnly);
  yesterdayIST.setDate(todayISTOnly.getDate() - 1);

  const isYesterday = istDateOnly.getTime() === yesterdayIST.getTime();
  if (isYesterday) return "Yesterday";

  return istDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }); // e.g. "04 Aug 2025"
};

// Helper to check if timestamp should be shown
export const shouldShowTimestamp = (
  currentIndex: number,
  messages: Message[]
) => {
  const currentMessage = messages[currentIndex];
  const nextMessage = messages[currentIndex + 1];

  // Always show timestamp if it's the last message
  if (currentIndex === messages.length - 1) return true;

  // Show timestamp if next message is from different sender
  if (nextMessage && currentMessage.type !== nextMessage.type) return true;

  // Don't show timestamp otherwise
  return false;
};

// Message interface for TypeScript support
interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp?: string | Date;
  isTyping?: boolean;
  delivered?: boolean;
  deliveryStatus?: 'pending' | 'sent' | 'delivered';
  image_url?: string;
  imageFile?: any;
  isImageUploading?: boolean;
  isFromServer?: boolean;
}