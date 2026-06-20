import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces/user.interface';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // Throws error if email is already registered
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password hash is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    isVerified: {
    type: Boolean,
    default: true,
  },

  emailOtp: {
    type: String,
    default: null,
  },

  emailOtpExpires: {
    type: Date,
    default: null,
  },

  resetPasswordOtp: {
    type: String,
    default: null,
  },

  resetPasswordOtpExpires: {
    type: Date,
    default: null,
  },
  },
  {
    timestamps: true, // Automatically provides createdAt and updatedAt fields
  }
);

export const User = model<IUser>('User', userSchema);
