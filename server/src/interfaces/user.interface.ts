import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;

  emailOtp?: string | null;
  emailOtpExpires?: Date | null;

  resetPasswordOtp?: string | null;
  resetPasswordOtpExpires?: Date | null;
}