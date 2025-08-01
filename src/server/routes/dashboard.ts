import express from 'express';
import { protect } from '../middleware/auth';
import { ouraService } from '../services/ouraService';

const router = express.Router();

// Get dashboard overview
router.get('/overview', protect, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get today's data
    const todayData = await ouraService.getDailyData(today, today);
    const todaySummary = todayData[0] || null;

    // Get 30-day trend data
    const trendData = await ouraService.getDailyData(thirtyDaysAgo, today);
    const weeklyAverages = ouraService.calculateWeeklyAverages(trendData);

    // Calculate insights
    const insights = calculateInsights(trendData, todaySummary);

    res.json({
      success: true,
      data: {
        today: todaySummary,
        weeklyAverages: weeklyAverages.slice(-4), // Last 4 weeks
        insights,
        trendData: trendData.slice(-7), // Last 7 days
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get sleep analysis
router.get('/sleep-analysis', protect, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    const sleepData = await ouraService.getSleepData(thirtyDaysAgo, today);
    const dailyData = await ouraService.getDailyData(thirtyDaysAgo, today);

    // Combine sleep and daily data
    const combinedData = dailyData.map(day => {
      const sleep = sleepData.find(s => s.day === day.day);
      return {
        ...day,
        sleep_data: sleep,
      };
    });

    const sleepInsights = calculateSleepInsights(combinedData);

    res.json({
      success: true,
      data: {
        sleepData: combinedData,
        insights: sleepInsights,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get activity analysis
router.get('/activity-analysis', protect, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    const dailyData = await ouraService.getDailyData(thirtyDaysAgo, today);
    const activityInsights = calculateActivityInsights(dailyData);

    res.json({
      success: true,
      data: {
        activityData: dailyData,
        insights: activityInsights,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions for calculating insights
function calculateInsights(trendData: any[], todayData: any) {
  if (!trendData.length) return {};

  const recentData = trendData.slice(-7); // Last 7 days
  const avgHRV = recentData.reduce((sum, day) => sum + (day.hrv || 0), 0) / recentData.length;
  const avgSleepScore = recentData.reduce((sum, day) => sum + (day.sleep_score || 0), 0) / recentData.length;
  const avgActivityScore = recentData.reduce((sum, day) => sum + (day.activity_score || 0), 0) / recentData.length;
  const avgReadinessScore = recentData.reduce((sum, day) => sum + (day.readiness_score || 0), 0) / recentData.length;

  const insights = {
    hrv: {
      current: todayData?.hrv || 0,
      average: avgHRV,
      trend: todayData?.hrv > avgHRV ? 'improving' : 'declining',
    },
    sleepScore: {
      current: todayData?.sleep_score || 0,
      average: avgSleepScore,
      trend: todayData?.sleep_score > avgSleepScore ? 'improving' : 'declining',
    },
    activityScore: {
      current: todayData?.activity_score || 0,
      average: avgActivityScore,
      trend: todayData?.activity_score > avgActivityScore ? 'improving' : 'declining',
    },
    readinessScore: {
      current: todayData?.readiness_score || 0,
      average: avgReadinessScore,
      trend: todayData?.readiness_score > avgReadinessScore ? 'improving' : 'declining',
    },
  };

  return insights;
}

function calculateSleepInsights(combinedData: any[]) {
  if (!combinedData.length) return {};

  const recentData = combinedData.slice(-7);
  const avgDeepSleep = recentData.reduce((sum, day) => sum + (day.deep_sleep_duration || 0), 0) / recentData.length;
  const avgRemSleep = recentData.reduce((sum, day) => sum + (day.rem_sleep_duration || 0), 0) / recentData.length;
  const avgTotalSleep = recentData.reduce((sum, day) => sum + (day.total_sleep_duration || 0), 0) / recentData.length;
  const avgEfficiency = recentData.reduce((sum, day) => sum + (day.sleep_efficiency || 0), 0) / recentData.length;

  return {
    deepSleep: {
      average: avgDeepSleep,
      recommendation: avgDeepSleep < 60 ? 'Try to increase deep sleep duration' : 'Good deep sleep duration',
    },
    remSleep: {
      average: avgRemSleep,
      recommendation: avgRemSleep < 90 ? 'Consider improving REM sleep' : 'Good REM sleep duration',
    },
    totalSleep: {
      average: avgTotalSleep,
      recommendation: avgTotalSleep < 420 ? 'Consider getting more sleep' : 'Good sleep duration',
    },
    efficiency: {
      average: avgEfficiency,
      recommendation: avgEfficiency < 85 ? 'Work on improving sleep efficiency' : 'Good sleep efficiency',
    },
  };
}

function calculateActivityInsights(dailyData: any[]) {
  if (!dailyData.length) return {};

  const recentData = dailyData.slice(-7);
  const avgSteps = recentData.reduce((sum, day) => sum + (day.steps || 0), 0) / recentData.length;
  const avgCalories = recentData.reduce((sum, day) => sum + (day.calories_active || 0), 0) / recentData.length;
  const avgHeartRate = recentData.reduce((sum, day) => sum + (day.average_heart_rate || 0), 0) / recentData.length;

  return {
    steps: {
      average: avgSteps,
      recommendation: avgSteps < 8000 ? 'Try to increase daily steps' : 'Good step count',
    },
    calories: {
      average: avgCalories,
      recommendation: avgCalories < 300 ? 'Consider more active activities' : 'Good calorie burn',
    },
    heartRate: {
      average: avgHeartRate,
      recommendation: avgHeartRate > 100 ? 'Monitor heart rate trends' : 'Normal heart rate range',
    },
  };
}

export default router; 