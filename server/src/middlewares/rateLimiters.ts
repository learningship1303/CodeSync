import { Request } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limit: Max 5 password reset attempts per day per email
export const passwordResetLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,

  // Avoid express-rate-limit IPv6 keyGenerator validation by NEVER using req.ip.
  // Rate limit is enforced per email when provided.
  keyGenerator: (req: Request) => {
    const email = typeof (req.body as any)?.email === 'string' ? (req.body as any).email : '';
    return email.trim() ? `email:${email.trim().toLowerCase()}` : 'email:missing';
  },


  message: {
    error: 'Too many password reset attempts. Please try again tomorrow.',
  },
});


export default {
  passwordResetLimiter,
};
