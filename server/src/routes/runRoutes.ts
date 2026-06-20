import { Router } from 'express';
import { runCode } from '../controllers/runController';
import { protect } from '../middlewares/authMiddleware';
const router = Router();

router.post('/', protect, runCode);

export default router;
