import express from 'express';
import { query, validationResult } from 'express-validator';
import { ouraService } from '../services/ouraService';
import { protect } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// OAuth callback endpoint
router.get('/auth/callback', [
  query('code').notEmpty().withMessage('Authorization code is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.query;
    const tokenResponse = await ouraService.exchangeCodeForToken(code as string);

    // In production, store tokens securely in database
    logger.info('Oura authentication successful');

    res.json({
      success: true,
      message: 'Oura authentication successful',
      // Don't send tokens in response for security
    });
  } catch (error) {
    next(error);
  }
});

// Get daily data
router.get('/daily', [
  protect,
  query('start_date').isISO8601().withMessage('Start date must be in ISO format'),
  query('end_date').isISO8601().withMessage('End date must be in ISO format'),
], async (req, res, next) => {
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
], async (req, res, next) => {
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
], async (req, res, next) => {
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
router.get('/profile', protect, async (req, res, next) => {
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
], async (req, res, next) => {
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

// Get today's summary
router.get('/today', protect, async (req, res, next) => {
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