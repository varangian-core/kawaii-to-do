/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

/**
 * Convert RGB to hex color
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Mix multiple colors together by averaging their RGB values
 */
export const mixColors = (colors: string[]): string => {
  if (colors.length === 0) return '#000000';
  if (colors.length === 1) return colors[0];

  const rgbColors = colors.map(hexToRgb);
  
  const avgR = Math.round(rgbColors.reduce((sum, color) => sum + color.r, 0) / colors.length);
  const avgG = Math.round(rgbColors.reduce((sum, color) => sum + color.g, 0) / colors.length);
  const avgB = Math.round(rgbColors.reduce((sum, color) => sum + color.b, 0) / colors.length);
  
  return rgbToHex(avgR, avgG, avgB);
};