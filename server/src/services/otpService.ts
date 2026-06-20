import crypto from 'crypto';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateOTPExpiry = (minutes: number = 10): Date => {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60 * 1000);
};

export const isOTPExpired = (expiryDate: Date | null | undefined): boolean => {
  if (!expiryDate) return true;
  return new Date() > new Date(expiryDate);
};

export const verifyOTP = (providedOTP: string, storedOTP: string | null, expiryDate: Date | null): boolean => {
  if (!storedOTP || !expiryDate) return false;
  if (isOTPExpired(expiryDate)) return false;
  return providedOTP === storedOTP;
};

export const generateSecurePassword = (length: number = 16): string => {
  return crypto.randomBytes(length).toString('hex');
};

export default {
  generateOTP,
  generateOTPExpiry,
  isOTPExpired,
  verifyOTP,
  generateSecurePassword,
};
