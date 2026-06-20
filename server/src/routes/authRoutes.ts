import { Router } from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from '../controllers/authController';
import { passwordResetLimiter } from '../middlewares/rateLimiters';

const router = Router();

// Registration & Verification Routes
router.post('/register', registerUser);

// Login Route
router.post('/login', loginUser);

// Password Recovery Routes
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

export default router;
