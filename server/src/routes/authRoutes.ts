import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';

const router = Router();

// Route for User Registration -> Maps to POST /api/auth/register
router.post('/register', registerUser);

// Route for User Login -> Maps to POST /api/auth/login
router.post('/login', loginUser);

export default router;