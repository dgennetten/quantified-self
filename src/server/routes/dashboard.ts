import express from 'express';
import { protect } from '../middleware/auth';
import { ouraService } from '../services/ouraService';
import { logger } from '../utils/logger';

const router = express.Router();

// Get dashboard overview
router.get('/overview', protect, async (req: any, res: any, next: any) => {
  try {
    // Check if Oura is connected
    const hasOuraConnection = ouraService.hasValidTokens();
    
    if (!hasOuraConnection) {
      // Return empty dashboard when Oura is not connected
      res.json({
        success: true,
        data: {
          today: null,
          weeklyAverages: [],
          insights: {},
          trendData: [],
          threeMonthTrendData: [],
          ouraConnected: false,
        },
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get yesterday's data (more likely to have complete data)
    const todayData = await ouraService.getDailyData(yesterday, yesterday);
    const todaySummary = todayData[0] || null;
    
    console.log('=== DASHBOARD DEBUG ===');
    console.log('Yesterday date:', yesterday);
    console.log('Today data length:', todayData.length);
    console.log('Today data:', JSON.stringify(todayData, null, 2));
    console.log('Today summary:', JSON.stringify(todaySummary, null, 2));
    console.log('=== END DEBUG ===');

    // Get 30-day trend data (ending yesterday for more complete data)
    const trendData = await ouraService.getDailyData(thirtyDaysAgo, yesterday);
    const weeklyAverages = ouraService.calculateWeeklyAverages(trendData);
    
    // Get 3-month trend data
    const threeMonthTrendData = await ouraService.getDailyData(threeMonthsAgo, yesterday);

    // Calculate insights
    const insights = calculateInsights(trendData, todaySummary);
    
    // Debug: Check what fields are available in the data
    if (todaySummary) {
      console.log('=== FIELD DEBUG ===');
      console.log('Available fields in todaySummary:', Object.keys(todaySummary));
      console.log('Sample values:', {
        sleep_score: todaySummary.sleep_score,
        activity_score: todaySummary.activity_score,
        readiness_score: todaySummary.readiness_score,
        hrv: todaySummary.hrv
      });
      console.log('=== END FIELD DEBUG ===');
    }

    const responseData = {
      success: true,
      data: {
        today: todaySummary,
        weeklyAverages: weeklyAverages.slice(-4), // Last 4 weeks
        insights,
        trendData: trendData.slice(-7), // Last 7 days
        threeMonthTrendData: threeMonthTrendData.slice(-90), // Last 90 days
        ouraConnected: true,
      },
    };
    
    console.log('=== RESPONSE DATA ===');
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    console.log('=== END RESPONSE ===');
    
    res.json(responseData);
  } catch (error) {
    logger.error('Dashboard error:', error);
    // If Oura API fails, return empty dashboard
    res.json({
      success: true,
      data: {
        today: null,
        weeklyAverages: [],
        insights: {},
        trendData: [],
        threeMonthTrendData: [],
        ouraConnected: false,
      },
    });
  }
});

// Get sleep analysis
router.get('/sleep-analysis', protect, async (req: any, res: any, next: any) => {
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
router.get('/activity-analysis', protect, async (req: any, res: any, next: any) => {
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

// Debug endpoint to check available data
router.get('/debug', protect, async (req: any, res: any, next: any) => {
  try {
    const hasOuraConnection = ouraService.hasValidTokens();
    
    if (!hasOuraConnection) {
      return res.json({ error: 'Oura not connected' });
    }

    // Try different date ranges
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayData = await ouraService.getDailyData(today, today);
    const yesterdayData = await ouraService.getDailyData(yesterday, yesterday);
    const weekData = await ouraService.getDailyData(weekAgo, today);

    res.json({
      success: true,
      debug: {
        hasConnection: hasOuraConnection,
        today,
        yesterday,
        weekAgo,
        todayData: {
          length: todayData.length,
          data: todayData
        },
        yesterdayData: {
          length: yesterdayData.length,
          data: yesterdayData
        },
        weekData: {
          length: weekData.length,
          data: weekData.slice(0, 3) // First 3 entries
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 