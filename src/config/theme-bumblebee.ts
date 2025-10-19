export interface BumblebeePalette {
  yellowA: string;     // Primary border (#F2D638)
  yellowB: string;     // Status/title text (#E9B033)
  nearBlack: string;   // Background (#010600)
  gray: string;        // Quotes/secondary (#8E8F95)
  cyan: string;        // Focus accent (#1EC4F2)
}

export interface BumblebeeTheme {
  trueColor: BumblebeePalette;
  ansi256: BumblebeePalette;
  current: BumblebeePalette;
}

// TrueColor palette (24-bit)
const TRUE_COLOR_PALETTE: BumblebeePalette = {
  yellowA: '\x1b[38;2;242;214;56m',    // #F2D638
  yellowB: '\x1b[38;2;233;176;51m',    // #E9B033
  nearBlack: '\x1b[38;2;1;6;0m',       // #010600
  gray: '\x1b[38;2;142;143;149m',      // #8E8F95
  cyan: '\x1b[38;2;30;196;242m',       // #1EC4F2
};

// ANSI 256-color fallbacks (8-bit)
const ANSI256_PALETTE: BumblebeePalette = {
  yellowA: '\x1b[38;5;226m',    // Bright yellow (closest to #F2D638)
  yellowB: '\x1b[38;5;214m',    // Orange (closest to #E9B033)
  nearBlack: '\x1b[38;5;0m',     // Black (closest to #010600)
  gray: '\x1b[38;5;244m',       // Gray (closest to #8E8F95)
  cyan: '\x1b[38;5;39m',        // Bright cyan (closest to #1EC4F2)
};

// Reset ANSI code
const RESET = '\x1b[0m';

// Color capability detection
export function detectColorSupport(): 'truecolor' | '256' | '16' {
  // Check for truecolor support
  if (process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '24bit') {
    return 'truecolor';
  }

  // Check TERM for 256-color support
  const term = process.env.TERM?.toLowerCase() || '';
  if (term.includes('256') || term.includes('xterm') || term.includes('screen')) {
    return '256';
  }

  // Fallback to 16 colors
  return '16';
}

// Get appropriate palette based on terminal capabilities
function getCurrentPalette(): BumblebeePalette {
  const colorSupport = detectColorSupport();

  switch (colorSupport) {
    case 'truecolor':
      return TRUE_COLOR_PALETTE;
    case '256':
      return ANSI256_PALETTE;
    case '16':
    default:
      // For 16-color terminals, fall back to ANSI 256 but with more basic colors
      return ANSI256_PALETTE;
  }
}

// Bumblebee theme with automatic color detection
export const bumblebeeTheme: BumblebeeTheme = {
  trueColor: TRUE_COLOR_PALETTE,
  ansi256: ANSI256_PALETTE,
  get current() {
    return getCurrentPalette();
  },
};

// Utility functions for applying colors
export function colorize(text: string, color: keyof BumblebeePalette): string {
  const palette = getCurrentPalette();
  return `${palette[color]}${text}${RESET}`;
}

export function yellowA(text: string): string {
  return colorize(text, 'yellowA');
}

export function yellowB(text: string): string {
  return colorize(text, 'yellowB');
}

export function nearBlack(text: string): string {
  return colorize(text, 'nearBlack');
}

export function gray(text: string): string {
  return colorize(text, 'gray');
}

export function cyan(text: string): string {
  return colorize(text, 'cyan');
}

// Export the theme as default
export default bumblebeeTheme;
