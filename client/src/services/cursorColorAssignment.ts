// Color palette for remote cursors
const CURSOR_COLORS = [
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Sky Blue
  '#f7b731', // Gold
  '#5f27cd', // Purple
  '#00d2d3', // Cyan
  '#ff9ff3', // Pink
  '#54a0ff', // Bright Blue
  '#48dbfb', // Light Blue
  '#ff6348', // Orange
];

// Generate consistent color for a socket ID
export const assignCursorColor = (socketId: string): string => {
  let hash = 0;
  for (let i = 0; i < socketId.length; i++) {
    const char = socketId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
};

// Get RGB values from hex for calculations
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

const cursorColorAssignment = {
  assignCursorColor,
  hexToRgb,
  CURSOR_COLORS,
};

export default cursorColorAssignment;
