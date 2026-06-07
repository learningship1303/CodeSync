import { Document, Schema } from 'mongoose';

// 🚀 FIXED: Added internal interface mapping for the Virtual File Tree Nodes
export interface IFileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
}

export interface IRoom extends Document {
  roomId: string;
  name: string;

  password?: string;
  roomPasswordPlain?: string;

  roomType: 'personal' | 'project';

  admin: Schema.Types.ObjectId;
  permittedUsers: Schema.Types.ObjectId[];

  files: IFileNode[];

  createdAt: Date;
  updatedAt: Date;
}