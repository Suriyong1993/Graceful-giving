import { useMemo } from "react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Adapted from ObsidianUI (MIT) — free component `flip-text`.
 * Removed Next.js `"use client"` directive (this is Vite).
 * Pair with the `.flip-char` keyframes appended in `client/src/index.css`.
 *
 * ⚠️ Latin/CJK-only, English-wordmark scope: `children` is split per
 * character, which detaches Thai
 * combining marks (\u0E48-\u0E4F) from their base consonants and breaks
 * surrogate pairs. This app's UI is otherwise 100% Thai, so this component
 * has exactly one legitimate use — the English "Graceful Giving"
 * logotype/wordmark — and must never receive Thai copy. Do not adopt it as
 * a general text primitive; a dev-only console warning below fires if Thai
 * characters slip through.
 */
const THAI_CHAR_RANGE_START = 0x0e00;
const THAI_CHAR_RANGE_END = 0x0e7f;

function containsThaiChars(text: string): boolean {
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (
      codePoint >= THAI_CHAR_RANGE_START &&
      codePoint <= THAI_CHAR_RANGE_END
    ) {
      return true;
    }
  }
  return false;
}
interface FlipTextProps {
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** The text content to animate (will be split by spaces) */
  children: string;
  /** Duration of the flip animation in seconds @default 2.2 */
  duration?: number;
  /** Initial delay before animation starts in seconds @default 0 */
  delay?: number;
  /** Whether the animation should loop infinitely @default true */
  loop?: boolean;
  /** Custom separator for splitting text @default " " */
  separator?: string;
  /** Whether all characters should animate together (no stagger) @default false */
  together?: boolean;
}

export function FlipText({
  className,
  children,
  duration = 2.2,
  delay = 0,
  loop = true,
  separator = " ",
  together = false,
}: FlipTextProps) {
  if (import.meta.env.DEV && containsThaiChars(children)) {
    console.warn(
      `[FlipText] Received Thai text ("${children}"). FlipText only supports Latin/CJK ` +
        "characters — per-character splitting breaks Thai combining marks. Reserve this " +
        'component for short English wordmarks (e.g. the "Graceful Giving" logotype); do ' +
        "not use it for general Thai UI copy."
    );
  }

  const words = useMemo(() => children.split(separator), [children, separator]);
  // Guard against empty children: totalChars of 0 would produce NaN stagger delays.
  const totalChars = children.length || 1;

  const getCharIndex = (wordIndex: number, charIndex: number) => {
    let index = 0;
    for (let i = 0; i < wordIndex; i++) {
      index += words[i].length + (separator === " " ? 1 : separator.length);
    }
    return index + charIndex;
  };

  return (
    // The real text lives in the visually-hidden label; the animated per-char
    // spans are decorative duplicates hidden from the accessibility tree.
    <div
      className={cn(
        "flip-text-wrapper relative inline-block leading-none",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {words.map((word, wordIndex) => {
          const chars = word.split("");
          return (
            <span
              key={wordIndex}
              className="word inline-block whitespace-nowrap"
              style={{ transformStyle: "preserve-3d" }}
            >
              {chars.map((char, charIndex) => {
                const currentGlobalIndex = getCharIndex(wordIndex, charIndex);
                let calculatedDelay = delay;
                if (!together) {
                  const normalizedIndex = currentGlobalIndex / totalChars;
                  const sineValue = Math.sin(normalizedIndex * (Math.PI / 2));
                  calculatedDelay = sineValue * (duration * 0.25) + delay;
                }
                return (
                  <span
                    key={charIndex}
                    className="flip-char inline-block relative"
                    data-char={char}
                    style={
                      {
                        "--flip-duration": `${duration}s`,
                        "--flip-delay": `${calculatedDelay}s`,
                        "--flip-iteration": loop ? "infinite" : "1",
                        transformStyle: "preserve-3d",
                      } as CSSProperties
                    }
                  >
                    {char}
                  </span>
                );
              })}
              {separator === " " && wordIndex < words.length - 1 && (
                <span className="whitespace inline-block">&nbsp;</span>
              )}
              {separator !== " " && wordIndex < words.length - 1 && (
                <span className="separator inline-block">{separator}</span>
              )}
            </span>
          );
        })}
      </span>
    </div>
  );
}

export default FlipText;
