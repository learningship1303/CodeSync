import { Schema, model } from 'mongoose';
import { IRoom } from '../interfaces/room.interface';

// 🚀 FIXED: Added internal interface for the Virtual File System Nodes
export interface IFileNode {
  name: string;
  path: string; // E.g., "src/index.js" or "components/Button.tsx"
  type: 'file' | 'folder';
  content?: string; // Will store the raw code string; empty if it's a folder
}

const fileNodeSchema = new Schema<IFileNode>({
  name: { type: String, required: true, trim: true },
  path: { type: String, required: true, trim: true },
  type: { type: String, enum: ['file', 'folder'], required: true },
  content: { type: String, default: '' }
});

const roomSchema = new Schema<IRoom>(
  {
    roomId: {
      type: String,
      required: [true, 'Unique Room ID is mandatory'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Room or Project Name is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [
        function (this: any) {
          return this.roomType === 'project';
        },
        'Password is mandatory for shared project rooms',
      ],
    },
    roomType: {
      type: String,
      enum: ['personal', 'project'],
      required: true,
    },
    roomPasswordPlain: {
  type: String,
  default: null,
  select: false,
},
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permittedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // 🚀 FIXED: Injected the virtual multi-file tree layout seamlessly into your existing schema
    files: [fileNodeSchema]
  },
  {
    timestamps: true,
  }
);

export const Room = model<IRoom>('Room', roomSchema);
