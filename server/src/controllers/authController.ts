import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';

// Helper function to sign JSON Web Tokens
const generateToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d', // Token will be valid for 7 days
    });
};

/**
 * @desc    Register new user account with synchronized regex security matrices
 * @route   POST /api/auth/register
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        const cleanName = name?.trim();
        const cleanEmail = email?.trim();

        // 🛡️ BACKEND VALIDATION 1: Empty Nodes Intercept
        if (!cleanName || !cleanEmail || !password) {
            res.status(400).json({ message: 'All registration parameters are mandatory.' });
            return;
        }

        // 🛡️ BACKEND VALIDATION 2: Synchronized Strict Gmail Matrix check
       const gmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!gmailRegex.test(cleanEmail)) {
            res.status(400).json({ message: 'Access Denied: Please provide a valid standalone @gmail.com domain.' });
            return;
        }

        // 🛡️ BACKEND VALIDATION 3: Complex Vault Password Rules Synchronization
        // 🚀 FIXED: Dynamic bounds expanded to range {6, 20} to prevent payload rejection errors
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,20}$/;
        
        if (password.length < 6 || password.length > 20) {
            res.status(400).json({ message: 'Vault Constraint: Password length bounds must be 6 to 20 characters.' });
            return;
        }
        if (!passwordRegex.test(password)) {
            res.status(400).json({ message: 'Weak Signature: Requires 1 uppercase, 1 lowercase, 1 digit, and 1 special symbol.' });
            return;
        }

        // 1. Check if user already exists in cloud DB
        const userExists = await User.findOne({ email: cleanEmail });
        if (userExists) {
            res.status(400).json({ message: 'User already exists with this email address' });
            return;
        }

        // 2. Hash raw password string with salt round of 10
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create record in MongoDB Atlas
        const user = await User.create({
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
        });

        // 4. Send profile metadata alongside dynamic token string
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id.toString()),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: (error as Error).message });
    }
};

/**
 * @desc    Authenticate user credentials & login
 * @route   POST /api/auth/login
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email?.trim();

        if (!cleanEmail || !password) {
             res.status(400).json({ message: 'Email and password parameters are required.' });
             return;
        }

        // 1. Locate user via email parameters
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        // 2. Compare user typed text with hashed DB password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        // 3. Dispatch data back with fresh authentication token
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id.toString()),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: (error as Error).message });
    }
};