// utils/splitText.ts
export const URL_REGEX = /(https?:\/\/[^\s<>"'{}|\\^`\[\]]+)/gi;

// Enhanced function to split text while preserving URLs
export function splitSentencesToLines(text: string): (string | { type: 'link'; url: string })[] {
  // Check if the entire message is just a URL
  const trimmedText = text.trim();
  if (URL_REGEX.test(trimmedText) && trimmedText.match(URL_REGEX)?.[0] === trimmedText) {
    return [{ type: 'link', url: trimmedText }];
  }

  // Reset regex lastIndex since it's global
  URL_REGEX.lastIndex = 0;

  // Split text by lines first to preserve natural line breaks
  const initialLines = text.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);
  
  const result: (string | { type: 'link'; url: string })[] = [];
  
  initialLines.forEach(line => {
    // Check if this line is just a URL
    const lineUrl = line.match(URL_REGEX);
    if (lineUrl && lineUrl[0] === line.trim()) {
      // This line is just a URL
      result.push({ type: 'link', url: line.trim() });
      return;
    }
    
    // Extract URLs and replace them with placeholders for processing
    const urls: string[] = [];
    const urlPlaceholders: string[] = [];
    
    const lineWithPlaceholders = line.replace(URL_REGEX, (match) => {
      const placeholder = `__URL_PLACEHOLDER_${urls.length}__`;
      urls.push(match);
      urlPlaceholders.push(placeholder);
      return placeholder;
    });

    // Process the line without URLs (remove markdown formatting)
    const processedLine = lineWithPlaceholders
      .replace(/\*\*(.*?)\*\*/g, "$1") // remove **bold**
      .replace(/__(.*?)__/g, "$1")     // remove __bold__
      .replace(/_(.*?)_/g, "$1")       // remove _italic_
      .replace(/`([^`]*)`/g, "$1")     // remove inline `code`
      .replace(/---/g, " ")            // remove long dashes
      .replace(/--/g, " ")             // remove double dashes
      .replace(/#+\s?/g, "")           // remove markdown headings
      .replace(/\*/g, "")              // remove stray asterisks
      .replace(/_/g, " ")              // replace underscores with space
      .trim();

    // Split into sentences if needed
    const sentences = processedLine
      .split(/(?<=[.!?…।]|[\p{Emoji_Presentation}\p{Extended_Pictographic}])\s+/gu)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);

    // Restore URLs in each sentence
    sentences.forEach(sentence => {
      let finalSentence = sentence;
      
      // Restore URLs
      urlPlaceholders.forEach((placeholder, index) => {
        finalSentence = finalSentence.replace(placeholder, urls[index]);
      });
      
      if (finalSentence.trim()) {
        result.push(finalSentence);
      }
    });
  });

  return result;
};