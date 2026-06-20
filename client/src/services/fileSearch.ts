export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
}

// Simple fuzzy search algorithm
export const fuzzyMatch = (query: string, text: string): number => {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  if (lowerText.includes(lowerQuery)) {
    return 100 + lowerText.indexOf(lowerQuery); // Bonus for substring match
  }

  let queryIdx = 0;
  let textIdx = 0;
  let score = 0;

  while (queryIdx < query.length && textIdx < text.length) {
    if (lowerQuery[queryIdx] === lowerText[textIdx]) {
      score += 10;
      queryIdx++;
    }
    textIdx++;
  }

  return queryIdx === query.length ? score : 0; // Return 0 if not all query chars found
};

// Search files with fuzzy matching
export const searchFiles = (
  files: FileNode[],
  query: string,
  limit: number = 20
): FileNode[] => {
  if (!query.trim()) return [];

  const results = files
    .filter((file) => file.type === 'file') // Only search files
    .map((file) => ({
      file,
      score: fuzzyMatch(query, file.name) + fuzzyMatch(query, file.path) * 0.5,
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.file);

  return results;
};

// Get file icon based on extension
export const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const icons: Record<string, string> = {
    js: '📄',
    ts: '📘',
    tsx: '⚛️',
    jsx: '⚛️',
    py: '🐍',
    cpp: '➕',
    c: '🔧',
    java: '☕',
    json: '🗂️',
    html: '🌐',
    css: '🎨',
    md: '📝',
    txt: '📃',
  };

  return icons[ext] || '📄';
};

// Format file path for display
export const formatPath = (path: string, maxLength: number = 50): string => {
  if (path.length <= maxLength) return path;
  const parts = path.split('/');
  const start = parts[0];
  const end = parts.slice(-2).join('/');
  return `${start}/.../${end}`;
};

export default {
  fuzzyMatch,
  searchFiles,
  getFileIcon,
  formatPath,
};
