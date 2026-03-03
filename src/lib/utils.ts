import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse instruction text (e.g., "নিচের উদ্দীপকটি পড়ে ১ ও ২ সংখ্যক প্রশ্নের উত্তর দাও:")
 * Returns an object with instruction and content
 */
export function parseInstructionAndContent(text: string): {
  hasInstruction: boolean;
  instruction: string;
  content: string;
} {
  if (!text) {
    return { hasInstruction: false, instruction: "", content: "" };
  }

  // Look for lines ending with colon (typical instruction pattern)
  // Pattern: text ending with colon, followed by new content
  const instructionPattern = /^([^:\n]+:)\s*\n(.+)$/ms;
  const match = text.match(instructionPattern);
  
  if (match) {
    return {
      hasInstruction: true,
      instruction: match[1].trim(),
      content: match[2].trim()
    };
  }

  // Alternative: check if first line ends with colon (even without explicit newline separation)
  const colonIndex = text.indexOf(':');
  if (colonIndex > 0 && colonIndex < text.length - 1) {
    // Check if there's substantial content after the colon
    const beforeColon = text.substring(0, colonIndex + 1);
    const afterColon = text.substring(colonIndex + 1).trim();
    
    // Only treat as instruction if the line before colon is reasonably short (instruction-like)
    if (beforeColon.length < 150 && afterColon.length > 10 && beforeColon.split('\n').length === 1) {
      return {
        hasInstruction: true,
        instruction: beforeColon.trim(),
        content: afterColon
      };
    }
  }

  return { hasInstruction: false, instruction: "", content: "" };
}

/**
 * Parse question text containing Roman numeral sub-points (i., ii., iii., etc.)
 * Returns an object with mainQuestion and subPoints array
 */
export function parseQuestionWithSubPoints(text: string): {
  hasSubPoints: boolean;
  mainQuestion: string;
  subPoints: string[];
} {
  if (!text) {
    return { hasSubPoints: false, mainQuestion: "", subPoints: [] };
  }

  // Pattern to match Roman numerals: i., ii., iii., iv., v., vi., vii., viii., ix., x. (case-insensitive)
  const romanPattern = /\b([ivxIVX]+)\.\s*/g;
  
  // Check if text contains Roman numeral sub-points
  const matches = text.match(romanPattern);
  
  if (!matches || matches.length === 0) {
    return { hasSubPoints: false, mainQuestion: text, subPoints: [] };
  }

  // Find the first occurrence of a Roman numeral
  const firstRomanIndex = text.search(/\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\.\s*/i);
  
  if (firstRomanIndex === -1) {
    return { hasSubPoints: false, mainQuestion: text, subPoints: [] };
  }

  // Split into main question and the rest
  const mainQuestion = text.substring(0, firstRomanIndex).trim();
  const subPointsText = text.substring(firstRomanIndex);

  // Split by Roman numerals to get individual sub-points
  const subPoints = subPointsText
    .split(/\b(?:i|ii|iii|iv|v|vi|vii|viii|ix|x)\.\s*/i)
    .filter(point => point.trim().length > 0)
    .map(point => point.trim());

  return {
    hasSubPoints: true,
    mainQuestion: mainQuestion || "",
    subPoints: subPoints
  };
}
