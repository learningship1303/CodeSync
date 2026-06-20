import { Schema, model } from 'mongoose';

export interface IChatMessage {
  roomId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  avatar?: string;
}

const chatMessageSchema = new Schema<IChatMessage>({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  avatar: {
    type: String,
    default: '',
  },
});

// Create compound index for efficient queries
chatMessageSchema.index({ roomId: 1, timestamp: -1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);
