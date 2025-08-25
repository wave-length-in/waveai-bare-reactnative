export function splitSentencesToLines(text: string): string[] {
  return text
    // Remove AI/Markdown formatting patterns like **bold**, _italic_, `code`, ---
    .replace(/\*\*(.*?)\*\*/g, "$1") // remove **bold**
    .replace(/__(.*?)__/g, "$1")     // remove __bold__
    .replace(/_(.*?)_/g, "$1")       // remove _italic_
    .replace(/`([^`]*)`/g, "$1")     // remove inline `code`
    .replace(/---/g, " ")            // remove long dashes
    .replace(/--/g, " ")             // remove double dashes
    .replace(/#+\s?/g, "")           // remove markdown headings (# Title)
    .replace(/\*/g, "")              // remove stray asterisks
    .replace(/_/g, " ")              // replace underscores with space
    .trim()

    // Split after punctuation, Hindi danda, ellipsis, or any emoji
    .split(/(?<=[.!?…।]|[\p{Emoji_Presentation}\p{Extended_Pictographic}])\s+/gu)
    .flatMap(line => line.split(/\n+/)) // also split on explicit newlines
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
