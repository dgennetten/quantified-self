// Mock API for static deployment
window.MockAPI = {
  // Mock dashboard data
  getDashboardData: async () => {
    return {
      success: true,
      data: {
        today: {
          sleep_score: 85,
          activity_score: 72,
          readiness_score: 78,
          hrv: 45
        },
        weeklyAverages: [
          { sleep_score_avg: 82, activity_score_avg: 75, readiness_score_avg: 80, hrv_avg: 43 }
        ],
        insights: {
          hrv: { current: 45, average: 43, trend: 'improving' },
          sleepScore: { current: 85, average: 82, trend: 'improving' },
          activityScore: { current: 72, average: 75, trend: 'declining' },
          readinessScore: { current: 78, average: 80, trend: 'declining' }
        },
        trendData: [
          { day: '2024-01-01', sleep_score: 85, activity_score: 72, readiness_score: 78 },
          { day: '2024-01-02', sleep_score: 88, activity_score: 75, readiness_score: 82 },
          { day: '2024-01-03', sleep_score: 82, activity_score: 70, readiness_score: 76 },
          { day: '2024-01-04', sleep_score: 90, activity_score: 78, readiness_score: 84 },
          { day: '2024-01-05', sleep_score: 87, activity_score: 73, readiness_score: 80 },
          { day: '2024-01-06', sleep_score: 83, activity_score: 71, readiness_score: 77 },
          { day: '2024-01-07', sleep_score: 85, activity_score: 72, readiness_score: 78 }
        ],
        threeMonthTrendData: [
          // Add 90 days of sample data here
        ],
        metricsChartData: [
          { day: '2024-01-01', resting_heart_rate: 58, total_sleep_hours: 7.5, calories_active: 450 },
          { day: '2024-01-02', resting_heart_rate: 56, total_sleep_hours: 8.2, calories_active: 520 },
          { day: '2024-01-03', resting_heart_rate: 59, total_sleep_hours: 7.8, calories_active: 380 },
          { day: '2024-01-04', resting_heart_rate: 55, total_sleep_hours: 8.5, calories_active: 600 },
          { day: '2024-01-05', resting_heart_rate: 57, total_sleep_hours: 7.9, calories_active: 420 },
          { day: '2024-01-06', resting_heart_rate: 58, total_sleep_hours: 8.1, calories_active: 480 },
          { day: '2024-01-07', resting_heart_rate: 56, total_sleep_hours: 7.6, calories_active: 390 }
        ],
        ouraConnected: false
      }
    };
  },

  // Mock Oura connection
  connectOura: async () => {
    return { success: true, message: 'Oura connected (demo mode)' };
  },

  // Mock authentication
  login: async (email, password) => {
    if (email === 'douglas@gennetten.com' && password.length >= 6) {
      return { success: true, requires2FA: true };
    }
    throw new Error('Invalid credentials');
  },

  verify2FA: async (email, code) => {
    if (code === '123456') {
      return { 
        success: true, 
        token: 'mock-jwt-token',
        user: { email, role: 'admin' }
      };
    }
    throw new Error('Invalid 2FA code');
  }
};
