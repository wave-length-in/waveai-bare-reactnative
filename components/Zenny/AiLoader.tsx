import MessageTypeLoading from "@/utils/MessageLoading"; // assume you have RN loader
import { splitSentencesToLines } from "@/utils/splitSentence";
import { MotiView } from "moti";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface FadeInTextProps {
  text?: string;
  onComplete?: () => void;
  onLineAdded?: () => void;
};

const AiReplyAnimation: React.FC<FadeInTextProps> = ({
  text,
  onComplete,
  onLineAdded,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines = useMemo(() => splitSentencesToLines(text ?? ""), [text]);

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
      setVisibleCount(index + 1);
      setShowLoader(false);

      setTimeout(() => {
        onLineAdded?.();
      }, 50);

      index++;

      if (index < lines.length) {
        setShowLoader(true);
        const delay = 1000 + index * 250;
        timeoutRef.current = setTimeout(revealNext, delay);
      } else {
        onComplete?.();
      }
    };

    revealNext();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text]);

  return (
    <View style={styles.container}>
      {lines.slice(0, visibleCount).map((line, idx) => (
        <MotiView
          key={idx}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={styles.bubble}
        >
          <Text style={styles.text}>{line}</Text>
        </MotiView>
      ))}

      {/* Loader */}
      {showLoader && visibleCount < lines.length && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "timing", duration: 300 }}
          style={styles.loaderBubble}
        >
          <MessageTypeLoading />
        </MotiView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  bubble: {
    alignSelf: "flex-start",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  text: {
    fontSize: 16,
    color: "#fff",
  },
  loaderBubble: {
    alignSelf: "flex-start",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});

export default AiReplyAnimation;
