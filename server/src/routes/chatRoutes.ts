import { Router } from 'express';
import { getMessages, saveMessage, deleteMessage } from '../controllers/chatController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Get chat history for a room
router.get('/:roomId', protect, getMessages);

// Save a new message
router.post('/', protect, saveMessage);

// Delete a message
router.delete('/:messageId', protect, deleteMessage);

export default router;
