import { Request, Response } from 'express';
import { ChatMessage } from '../models/chatModel';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!roomId) {
      res.status(400).json({ message: 'Room ID is required' });
      return;
    }

    const messages = await ChatMessage.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      messages: messages.reverse(), // Return oldest to newest
      count: messages.length,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to retrieve messages', error: (error as Error).message });
  }
};

export const saveMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, userId, username, message } = req.body;

    if (!roomId || !userId || !username || !message) {
      res.status(400).json({ message: 'Room ID, User ID, Username, and message are required' });
      return;
    }

    const chatMessage = await ChatMessage.create({
      roomId,
      userId,
      username,
      message: message.trim(),
      timestamp: new Date(),
      avatar: username.charAt(0).toUpperCase(),
    });

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ message: 'Failed to save message', error: (error as Error).message });
  }
};

export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      res.status(400).json({ message: 'Message ID is required' });
      return;
    }

    await ChatMessage.deleteOne({ _id: messageId });

    res.status(200).json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message', error: (error as Error).message });
  }
};
