import express from 'express';
import { body, validationResult, query } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { ouraService } from '../services/ouraService';

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
], async (req: any, res: any, next: any) => {
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
], async (req: any, res: any, next: any) => {
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
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const payload = { 
      email: stored2FA.userId,
      role: 'admin'
    };
    const token = jwt.sign(payload, secret, { expiresIn: 86400 }); // 24 hours in seconds

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
router.get('/verify', (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Oura OAuth callback endpoint
router.get('/oura/callback', [
  query('code').notEmpty().withMessage('Authorization code is required'),
], async (req: any, res: any, next: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if environment variables are set
    if (!process.env.OURA_CLIENT_ID || !process.env.OURA_CLIENT_SECRET) {
      logger.error('Oura OAuth configuration missing');
      return res.redirect('http://localhost:3000/oauth-callback?oura_error=config_missing');
    }

    const { code } = req.query;
    logger.info('Received OAuth code, attempting token exchange...');
    
    const tokenResponse = await ouraService.exchangeCodeForToken(code as string);

    // In production, store tokens securely in database
    logger.info('Oura authentication successful');

    // Create a temporary JWT token for the OAuth completion
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const payload = { 
      email: allowedEmail,
      role: 'admin',
      ouraConnected: true
    };
    const tempToken = jwt.sign(payload, secret, { expiresIn: 300 }); // 5 minutes

    // Redirect to OAuth callback page with success message and temporary token
    res.redirect(`http://localhost:3000/oauth-callback?oura_connected=true&temp_token=${tempToken}`);

  } catch (error: any) {
    logger.error('Oura OAuth callback error:', error);
    
    // Provide more specific error messages
    let errorType = 'unknown';
    if (error.message.includes('400')) {
      errorType = 'invalid_request';
    } else if (error.message.includes('401')) {
      errorType = 'unauthorized';
    } else if (error.message.includes('403')) {
      errorType = 'forbidden';
    }
    
    // Redirect to OAuth callback page with specific error message
    res.redirect(`http://localhost:3000/oauth-callback?oura_error=${errorType}`);
  }
});

export default router; 