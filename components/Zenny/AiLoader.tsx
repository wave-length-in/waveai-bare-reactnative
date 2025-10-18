import MessageTypeLoading from "@/utils/MessageLoading"; // assume you have RN loader
import { splitSentencesToLines } from "@/utils/splitSentence";
import { MotiView } from "moti";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import LinkPreviewComponent from "./LinkPreviewComponent";

interface FadeInTextProps {
  text?: string;
  onComplete?: () => void;
  onLineAdded?: () => void;
}

const AiReplyAnimation: React.FC<FadeInTextProps> = ({
  text,
  onComplete,
  onLineAdded,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines = useMemo(() => splitSentencesToLines(text ?? ""), [text]);
  
  // 🔍 DEBUG: Log when AiLoader starts
  console.log(`🎬 AiLoader started with text:`, text);
  console.log(`📝 AiLoader lines:`, lines);

  useEffect(() => {
    setVisibleCount(0);
    setShowLoader(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (lines.length === 0) {
      onComplete?.();
      return;
    }

    let index = 0;

    const revealNext = () => {
      console.log(`🎬 Revealing line ${index + 1}/${lines.length}:`, lines[index]);
      setVisibleCount(index + 1);
      setShowLoader(false);

      setTimeout(() => {
        onLineAdded?.();
      }, 50);

      index++;

      if (index < lines.length) {
        setShowLoader(true);
        const delay = 800 + index * 400; // Increased delay for better visibility
        console.log(`⏰ Next line in ${delay}ms`);
        timeoutRef.current = setTimeout(revealNext, delay);
      } else {
        console.log(`✅ AiLoader animation complete`);
        onComplete?.();
      }
    };

    revealNext();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text]);

  return (
    <View className="gap-2">
      {lines.slice(0, visibleCount).map((line, idx) => (
        <MotiView
          key={idx}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          className="self-start mb-1"
        >
          {typeof line === 'string' ? (
            <View className="rounded-2xl bg-white/10 border border-white/10 px-3 py-2">
              <Text className="text-base text-white">{line}</Text>
            </View>
          ) : (
            <LinkPreviewComponent url={line.url} />
          )}
        </MotiView>
      ))}

      {/* Loader */}
      {showLoader && visibleCount < lines.length && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "timing", duration: 300 }}
          className="self-start rounded-2xl bg-white/10 border border-white/10 px-2 py-1.5"
        >
          <MessageTypeLoading />
        </MotiView>
      )}
    </View>
  );
};

export default AiReplyAnimation;