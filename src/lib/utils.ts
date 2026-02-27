import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
