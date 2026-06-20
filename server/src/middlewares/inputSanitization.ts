import { Request, Response, NextFunction } from 'express';

// Sanitize filename - remove dangerous characters
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/\.\./g, '') // Remove ..
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove invalid characters
    .replace(/^\.+/, '') // Remove leading dots
    .trim();
};

// Sanitize file path - prevent directory traversal
export const sanitizePath = (path: string): string => {
  let cleaned = path
    .replace(/\.\./g, '') // Remove ..
    .replace(/\0/g, ''); // Remove null bytes

  // Normalize path separators
  cleaned = cleaned.replace(/\\/g, '/');

  // Ensure path doesn't start with /
  if (cleaned.startsWith('/')) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
};

// Escape HTML to prevent XSS
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Validate code input
export const validateCodeInput = (code: string, maxSize: number = 1024 * 1024): boolean => {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Check size limit (1MB default)
  if (code.length > maxSize) {
    return false;
  }

  return true;
};

// Middleware to sanitize request body
export const inputSanitizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize file names and paths
    if (req.body.fileName) {
      req.body.fileName = sanitizeFilename(req.body.fileName);
    }

    if (req.body.path) {
      req.body.path = sanitizePath(req.body.path);
    }

    if (req.body.oldPath) {
      req.body.oldPath = sanitizePath(req.body.oldPath);
    }

    if (req.body.newPath) {
      req.body.newPath = sanitizePath(req.body.newPath);
    }

    // Validate code inputs
    if (req.body.code) {
      if (!validateCodeInput(req.body.code)) {
        return res.status(400).json({ message: 'Invalid or oversized code input' });
      }
    }

    // Sanitize message input (for chat)
    if (req.body.message && typeof req.body.message === 'string') {
      req.body.message = req.body.message.trim();
      if (req.body.message.length > 1000) {
        req.body.message = req.body.message.substring(0, 1000);
      }
    }

    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({ message: 'Invalid input' });
  }
};

// Middleware to validate email format
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Middleware to validate password format
export const validatePasswordFormat = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,20}$/;
  return passwordRegex.test(password);
};

export default {
  sanitizeFilename,
  sanitizePath,
  escapeHtml,
  validateCodeInput,
  inputSanitizationMiddleware,
  validateEmailFormat,
  validatePasswordFormat,
};
