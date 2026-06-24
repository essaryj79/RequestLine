// Helper functions for HEX color calculations, contrast verification, and styles injection

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

// Compute relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Check contrast ratio between two hex colors (WCAG rating)
// Formula: (L1 + 0.05) / (L2 + 0.05), where L1 is the lighter luminance
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Guard: Contrast must be at least 2.5 to prevent illegible screens
export function isContrastAcceptable(bgColor: string, textColor: string): boolean {
  try {
    const ratio = getContrastRatio(bgColor, textColor);
    return ratio >= 2.5; // WCAG 2.0 recommends 4.5:1 for normal text and 3:1 for large, but we can allow 2.5 for creative presets
  } catch {
    return true; // fallback
  }
}

// Dynamic style element injection
export function injectColorsCSS(bg: string, text: string, primary: string, accent: string, cardBg: string, mutedText: string, isBackend: boolean) {
  const prefix = isBackend ? 'backend' : 'frontend';
  const id = `dynamic-colors-${prefix}`;
  let el = document.getElementById(id);
  
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  
  el.innerHTML = `
    .theme-${prefix} {
      --bg-color: ${bg};
      --text-color: ${text};
      --primary-color: ${primary};
      --accent-color: ${accent};
      --card-bg: ${cardBg};
      --muted-text: ${mutedText};
    }
  `;
}
