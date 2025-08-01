import express from 'express';
import { query, validationResult } from 'express-validator';
import { ouraService } from '../services/ouraService';
import { protect } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// OAuth initiation endpoint
router.get('/auth/url', (req: any, res: any) => {
  const clientId = process.env.OURA_CLIENT_ID;
  const redirectUri = process.env.OURA_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Oura configuration missing' });
  }

  // Use the auth route callback instead of oura route callback
  const authUrl = `https://cloud.ouraring.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=heartrate daily sleep personal`;
  
  res.json({ authUrl });
});



// Get daily data
router.get('/daily', [
  protect,
  query('start_date').isISO8601().withMessage('Start date must be in ISO format'),
  query('end_date').isISO8601().withMessage('End date must be in ISO format'),
], async (req: any, res: any, next: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start_date, end_date } = req.query;
    const dailyData = await ouraService.getDailyData(start_date as string, end_date as string);

    res.json({
      success: true,
      data: dailyData,
    });
  } catch (error) {
    next(error);
  }
});

// Get sleep data
router.get('/sleep', [
  protect,
  query('start_date').isISO8601().withMessage('Start date must be in ISO format'),
  query('end_date').isISO8601().withMessage('End date must be in ISO format'),
], async (req: any, res: any, next: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start_date, end_date } = req.query;
    const sleepData = await ouraService.getSleepData(start_date as string, end_date as string);

    res.json({
      success: true,
      data: sleepData,
    });
  } catch (error) {
    next(error);
  }
});

// Get heart rate data
router.get('/heartrate', [
  protect,
  query('start_date').isISO8601().withMessage('Start date must be in ISO format'),
  query('end_date').isISO8601().withMessage('End date must be in ISO format'),
], async (req: any, res: any, next: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start_date, end_date } = req.query;
    const heartRateData = await ouraService.getHeartRateData(start_date as string, end_date as string);

    res.json({
      success: true,
      data: heartRateData,
    });
  } catch (error) {
    next(error);
  }
});

// Get personal info
router.get('/profile', protect, async (req: any, res: any, next: any) => {
  try {
    const profileData = await ouraService.getPersonalInfo();

    res.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    next(error);
  }
});

// Get weekly averages
router.get('/weekly', [
  protect,
  query('start_date').isISO8601().withMessage('Start date must be in ISO format'),
  query('end_date').isISO8601().withMessage('End date must be in ISO format'),
], async (req: any, res: any, next: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start_date, end_date } = req.query;
    const dailyData = await ouraService.getDailyData(start_date as string, end_date as string);
    const weeklyData = ouraService.calculateWeeklyAverages(dailyData);

    res.json({
      success: true,
      data: weeklyData,
    });
  } catch (error) {
    next(error);
  }
});

// Check Oura connection status
router.get('/status', protect, (req: any, res: any) => {
  // Check if we have valid tokens
  const hasTokens = ouraService.hasValidTokens();
  
  res.json({
    success: true,
    connected: hasTokens,
    message: hasTokens 
      ? 'Oura connection established. Your data is being fetched.'
      : 'Oura connection not established. Please complete OAuth flow.'
  });
});

// Get today's summary
router.get('/today', protect, async (req: any, res: any, next: any) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyData = await ouraService.getDailyData(today, today);
    
    const todayData = dailyData[0] || null;

    res.json({
      success: true,
      data: todayData,
    });
  } catch (error) {
    next(error);
  }
});

export default router; 