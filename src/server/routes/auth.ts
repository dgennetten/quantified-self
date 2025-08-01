import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// In-memory storage for demo (replace with database in production)
const users = new Map();
const allowedEmail = process.env.ALLOWED_EMAIL || 'douglas@gennetten.com';

// Generate a simple 2FA code (in production, use a proper 2FA service)
const generate2FACode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store 2FA codes temporarily (replace with Redis in production)
const twoFACodes = new Map();

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if email is allowed
    if (email !== allowedEmail) {
      return res.status(403).json({ 
        error: 'Access denied. Only authorized users can access this dashboard.' 
      });
    }

    // For demo purposes, create user if doesn't exist
    if (!users.has(email)) {
      const hashedPassword = await bcrypt.hash(password, 12);
      users.set(email, {
        email,
        password: hashedPassword,
        role: 'admin'
      });
    }

    const user = users.get(email);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate and send 2FA code
    const twoFACode = generate2FACode();
    twoFACodes.set(email, {
      code: twoFACode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      userId: email
    });

    // In production, send this via email/SMS
    logger.info(`2FA code for ${email}: ${twoFACode}`);

    res.json({ 
      message: '2FA code sent to your email',
      requires2FA: true 
    });

  } catch (error) {
    next(error);
  }
});

// 2FA verification endpoint
router.post('/verify-2fa', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    const stored2FA = twoFACodes.get(email);
    
    if (!stored2FA) {
      return res.status(400).json({ error: 'No 2FA code found. Please login again.' });
    }

    if (Date.now() > stored2FA.expiresAt) {
      twoFACodes.delete(email);
      return res.status(400).json({ error: '2FA code expired. Please login again.' });
    }

    if (stored2FA.code !== code) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    // Clear the 2FA code
    twoFACodes.delete(email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: stored2FA.userId,
        role: 'admin'
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        email: stored2FA.userId,
        role: 'admin'
      }
    });

  } catch (error) {
    next(error);
  }
});

// Verify token endpoint
router.get('/verify', (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router; 