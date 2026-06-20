import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';
import { generateOTP, generateOTPExpiry, verifyOTP } from '../services/otpService';
import { sendPasswordResetEmail } from '../services/emailService';
import { getJwtSecret } from '../config/auth';

// Helper function to sign JSON Web Tokens
const generateToken = (id: string): string => {
    return jwt.sign({ id }, getJwtSecret(), {
        expiresIn: '7d', // Token will be valid for 7 days
    });
};

const toAuthPayload = (user: { _id: unknown; name: string; email: string }) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(String(user._id)),
});

/**
 * @desc    Register new user account and authenticate immediately
 * @route   POST /api/auth/register
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        const cleanName = name?.trim();
        const cleanEmail = email?.trim().toLowerCase();

        // 🛡️ BACKEND VALIDATION 1: Empty Nodes Intercept
        if (!cleanName || !cleanEmail || !password) {
            res.status(400).json({ message: 'All registration parameters are mandatory.' });
            return;
        }

        // 🛡️ BACKEND VALIDATION 2: Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            res.status(400).json({ message: 'Please provide a valid email address.' });
            return;
        }

        // 🛡️ BACKEND VALIDATION 3: Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,20}$/;

        if (password.length < 6 || password.length > 20) {
            res.status(400).json({ message: 'Password length must be 6 to 20 characters.' });
            return;
        }
        if (!passwordRegex.test(password)) {
            res.status(400).json({ message: 'Password requires 1 uppercase, 1 lowercase, 1 digit, and 1 special character.' });
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

        // 3. Create verified user record in MongoDB
        const user = await User.create({
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            isVerified: true,
            emailOtp: null,
            emailOtpExpires: null,
        });
        console.log('[REGISTER] User created without OTP verification', {
            userId: user._id,
            email: user.email,
            isVerified: user.isVerified,
        });

        res.status(201).json(toAuthPayload(user));
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
        const cleanEmail = email?.trim().toLowerCase();

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
        res.status(200).json(toAuthPayload(user));
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: (error as Error).message });
    }
};

/**
 * @desc    Request password reset - send OTP to email
 * @route   POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanEmail) {
            res.status(400).json({ message: 'Email is required.' });
            return;
        }

        // Find user
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            // Don't reveal if user exists or not
            res.status(200).json({
                message: 'If an account exists with this email, a reset OTP will be sent.',
            });
            return;
        }

        // Generate reset OTP (15 minute expiry)
        const resetOtp = generateOTP();
        const resetOtpExpiry = generateOTPExpiry(15);

        user.resetPasswordOtp = resetOtp;
        user.resetPasswordOtpExpires = resetOtpExpiry;
        await user.save();

        // Send reset OTP email
        try {
            await sendPasswordResetEmail(cleanEmail, resetOtp);
        } catch (emailError) {
            console.error('[FORGOT_PASSWORD] Email send failure');
            console.error(emailError instanceof Error ? emailError.stack : emailError);
            res.status(502).json({
                message: 'Reset OTP was generated, but email could not be sent. Please check email server configuration.',
            });
            return;
        }

        res.status(200).json({
            message: 'If an account exists with this email, a reset OTP will be sent.',
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

/**
 * @desc    Verify password reset OTP
 * @route   POST /api/auth/verify-reset-otp
 */
export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanEmail || !otp) {
            res.status(400).json({ message: 'Email and OTP are required.' });
            return;
        }

        // Find user
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

   const isValidOTP = verifyOTP(
  otp,
  user.resetPasswordOtp ?? null,
  user.resetPasswordOtpExpires ?? null
);

if (!isValidOTP) {
  res.status(400).json({
    message: 'Invalid or expired OTP.'
  });
  return;
}
;

        res.status(200).json({
            message: 'OTP verified. You can now reset your password.',
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

/**
 * @desc    Reset password with new password
 * @route   POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;
        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanEmail || !otp || !newPassword) {
            res.status(400).json({ message: 'Email, OTP, and new password are required.' });
            return;
        }

        // Validate new password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,20}$/;
        if (newPassword.length < 6 || newPassword.length > 20 || !passwordRegex.test(newPassword)) {
            res.status(400).json({ message: 'Password requires 1 uppercase, 1 lowercase, 1 digit, and 1 special character (6-20 chars).' });
            return;
        }

        // Find user
           // Find user
const user = await User.findOne({
  email: cleanEmail
});

if (!user) {
  res.status(404).json({
    message: 'User not found.'
  });
  return;
}

// Verify reset OTP
const isValidOTP = verifyOTP(
  otp,
  user.resetPasswordOtp ?? null,
  user.resetPasswordOtpExpires ?? null
);

if (!isValidOTP) {
  res.status(400).json({
    message: 'Invalid or expired OTP.'
  });
  return;
}


        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpires = null;
        await user.save();

        res.status(200).json({
            message: 'Password reset successfully. Please login with your new password.',
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};
