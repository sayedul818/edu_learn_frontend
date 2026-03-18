import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import katex from "katex/dist/katex.js";
import "katex/dist/katex.min.css";

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

  // Rich-text editor content may include HTML attributes with ':' characters.
  // Do not run instruction parsing on HTML, or tags like style="text-decoration: overline"
  // get split and rendered as broken literal text.
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
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

  // Rich HTML should be rendered as-is; parsing for roman sub-points can break HTML tags/content.
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    return { hasSubPoints: false, mainQuestion: text, subPoints: [] };
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

/**
 * Convert percentage to grade letter.
 * Ranges (inclusive lower bound):
 * 80-100 => A+
 * 70-79  => A
 * 60-69  => A-
 * 50-59  => B
 * 40-49  => C
 * 33-39  => D
 * <33    => F
 */
export function percentageToGrade(p: number | string | null | undefined): string {
  const n = Number(p) || 0;
  if (n >= 80 && n <= 100) return 'A+';
  if (n >= 70 && n < 80) return 'A';
  if (n >= 60 && n < 70) return 'A-';
  if (n >= 50 && n < 60) return 'B';
  if (n >= 40 && n < 50) return 'C';
  if (n >= 33 && n < 40) return 'D';
  return 'F';
}

// Render text that may contain LaTeX math delimiters \(...\) or $$...$$ to HTML using KaTeX.
// If KaTeX is not available or rendering fails, fall back to escaped plain text.
export function renderMathToHtml(input: string | null | undefined): string {
  const txt = input ?? "";
  const normalizedTxt = txt
    .replace(/\\\\\(/g, "\\(")
    .replace(/\\\\\)/g, "\\)")
    .replace(/\\\\\[/g, "\\[")
    .replace(/\\\\\]/g, "\\]")
    .replace(/\\\\([a-zA-Z]+)/g, "\\$1");
  // quick escape for HTML
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const preserveLineBreaks = (s: string) => s.replace(/\r\n|\r|\n/g, "<br />");
  try {
    // Scan for display $$..$$, inline \(...\) and bare LaTeX commands like \bar{A}
    const parts: string[] = [];
    const pattern = /(\$\$([\s\S]+?)\$\$|\\\\(([\s\S]+?)\\\\)|\\[a-zA-Z]+(?:\{[^}]*\})?)/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(normalizedTxt)) !== null) {
      if (m.index > lastIndex) parts.push(escapeHtml(normalizedTxt.slice(lastIndex, m.index)));
      try {
        if (m[2]) {
          // $$...$$ display math
          parts.push(katex.renderToString(m[2].trim(), { throwOnError: false, displayMode: true }));
        } else if (m[3]) {
          // \(...\) inline math
          parts.push(katex.renderToString(m[3].trim(), { throwOnError: false, displayMode: false }));
        } else {
          // bare command like \bar{A} or \frac{1}{2}
          const cmd = m[0];
          parts.push(katex.renderToString(cmd.trim(), { throwOnError: false, displayMode: false }));
        }
      } catch (e) {
        parts.push(escapeHtml(m[0]));
      }
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < normalizedTxt.length) parts.push(escapeHtml(normalizedTxt.slice(lastIndex)));
    return preserveLineBreaks(parts.join(''));
  } catch (e) {
    // katex failed - return escaped text preserving LaTeX delimiters
    return preserveLineBreaks(escapeHtml(normalizedTxt));
  }
}

// Render rich HTML when content comes from the admin editor; otherwise render plain/math text.
export function renderRichOrMathHtml(input: string | null | undefined): string {
  const txt = input ?? "";
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(txt);
  if (!hasHtml) return renderMathToHtml(txt);

  const preserveLineBreaksOutsideTags = (html: string) =>
    html
      .split(/(<[^>]+>)/g)
      .map((segment) => (segment.startsWith("<") ? segment : segment.replace(/\r\n|\r|\n/g, "<br />")))
      .join("");

  const allowedStyleProps = new Set([
    "color",
    "background",
    "background-color",
    "font-size",
    "font-weight",
    "font-style",
    "text-decoration",
    "text-align",
    "font-family",
    "border",
    "border-collapse",
    "padding",
    "margin",
    "display",
    "width",
    "min-width",
    "max-width",
    "vertical-align",
  ]);

  const sanitized = txt
    .replace(/\sstyle=(['"])(.*?)\1/gi, (_match, quote, styleValue) => {
      const cleaned = String(styleValue)
        .split(";")
        .map((rule) => rule.trim())
        .filter(Boolean)
        .filter((rule) => {
          const property = rule.split(":")[0]?.trim().toLowerCase();
          return !!property && allowedStyleProps.has(property);
        })
        .join("; ");

      return cleaned ? ` style=${quote}${cleaned}${quote}` : "";
    })
    .replace(/<font\b[^>]*>/gi, (match) => match);

  return preserveLineBreaksOutsideTags(sanitized);
}
