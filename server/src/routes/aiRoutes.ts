import { Router } from 'express';
import { consultAiCopilot } from '../controllers/aiController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Secure endpoint: Only authenticated developers can consume token quotas
router.post('/consult', protect, consultAiCopilot);

export default router;