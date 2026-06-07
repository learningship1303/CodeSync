import { Router } from 'express';
import { 
  createRoom, 
  verifyRoom, 
  getUserRooms,
  saveFileMetadata,      // 🚀 Feature: Multi-file metadata persistence
  downloadWorkspaceZip,  // 🚀 Feature: ZIP compression pipeline
  deleteFile,
  renameFile
} from '../controllers/roomController';
import { protect } from '../middlewares/authMiddleware'; 

const router = Router();

// 1. Create a brand new collaborative workspace room
router.post('/create', protect, createRoom);
router.post('/verify', verifyRoom);
router.get('/my-rooms', protect, getUserRooms);

// 4. Persistence pipeline: Save/Update virtual file tree node
router.post('/:roomId/files/save', protect, saveFileMetadata);

// 5. Binary pipeline: Compress workspace into downloadable bundle
router.get('/:roomId/download', protect, downloadWorkspaceZip);
router.delete(
  '/:roomId/files/:filePath',
  protect,
  deleteFile
);
router.put(
  '/:roomId/files/rename',
  protect,
  renameFile
);

export default router;