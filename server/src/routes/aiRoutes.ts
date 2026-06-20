import { Router } from 'express';
import {
  consultAiCopilot,
  explainCode,
  fixBugs,
  optimizeCode,
  generateFunction,
  generateComments,
  refactorCode,
  analyzeComplexity,
  securityReview,
} from '../controllers/aiController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// General AI consultation
router.post('/consult', protect, consultAiCopilot);

// Specific AI capabilities
router.post('/explain', protect, explainCode);
router.post('/fix-bugs', protect, fixBugs);
router.post('/optimize', protect, optimizeCode);
router.post('/generate-function', protect, generateFunction);
router.post('/generate-comments', protect, generateComments);
router.post('/refactor', protect, refactorCode);
router.post('/complexity-analysis', protect, analyzeComplexity);
router.post('/security-review', protect, securityReview);

export default router;