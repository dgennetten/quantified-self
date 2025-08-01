import axios from 'axios';
import { logger } from '../utils/logger';

export interface OuraTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface OuraDailyData {
  day: string;
  hrv: number;
  sleep_score: number;
  activity_score: number;
  readiness_score: number;
  deep_sleep_duration: number;
  rem_sleep_duration: number;
  light_sleep_duration: number;
  total_sleep_duration: number;
  sleep_efficiency: number;
  resting_heart_rate: number;
  temperature_delta: number;
  steps: number;
  calories_active: number;
  calories_total: number;
  average_heart_rate: number;
  max_heart_rate: number;
  activity_class_5min: string[];
  sleep_algorithm_version: string;
}

export interface OuraWeeklyData {
  week: string;
  hrv_avg: number;
  sleep_score_avg: number;
  activity_score_avg: number;
  readiness_score_avg: number;
  deep_sleep_avg: number;
  rem_sleep_avg: number;
  light_sleep_avg: number;
  total_sleep_avg: number;
  sleep_efficiency_avg: number;
  resting_heart_rate_avg: number;
  steps_avg: number;
  calories_active_avg: number;
  calories_total_avg: number;
}

class OuraService {
  private baseURL = 'https://api.ouraring.com/v2';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  
  // In-memory token storage (in production, use a database)
  private static tokens: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  } = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };

  async exchangeCodeForToken(code: string): Promise<OuraTokenResponse> {
    try {
      logger.info('Attempting to exchange OAuth code for token...');
      logger.info(`Client ID: ${process.env.OURA_CLIENT_ID ? 'SET' : 'NOT SET'}`);
      logger.info(`Client Secret: ${process.env.OURA_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
      logger.info(`Redirect URI: ${process.env.OURA_REDIRECT_URI}`);
      logger.info(`Code: ${code.substring(0, 10)}...`);

      // Oura API expects form-urlencoded data, not JSON
      const formData = new URLSearchParams();
      formData.append('grant_type', 'authorization_code');
      formData.append('code', code);
      formData.append('client_id', process.env.OURA_CLIENT_ID || '');
      formData.append('client_secret', process.env.OURA_CLIENT_SECRET || '');
      formData.append('redirect_uri', process.env.OURA_REDIRECT_URI || '');

      const response = await axios.post('https://api.ouraring.com/oauth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      logger.info('OAuth token exchange response received');
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Store tokens in static storage
      OuraService.tokens.accessToken = access_token;
      OuraService.tokens.refreshToken = refresh_token;
      OuraService.tokens.expiresAt = Date.now() + (expires_in * 1000);
      
      // Also store in instance for backward compatibility
      this.accessToken = access_token;
      this.refreshToken = refresh_token;

      logger.info('Successfully obtained Oura access token');
      return { access_token, refresh_token, expires_in };
    } catch (error: any) {
      logger.error('Error exchanging code for token:', error);
      if (error.response) {
        logger.error('OAuth error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw new Error(`Failed to obtain Oura access token: ${error.message}`);
    }
  }

  async refreshAccessToken(): Promise<string> {
    const refreshToken = this.refreshToken || OuraService.tokens.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Oura API expects form-urlencoded data, not JSON
      const formData = new URLSearchParams();
      formData.append('grant_type', 'refresh_token');
      formData.append('refresh_token', refreshToken);
      formData.append('client_id', process.env.OURA_CLIENT_ID || '');
      formData.append('client_secret', process.env.OURA_CLIENT_SECRET || '');

      const response = await axios.post('https://api.ouraring.com/oauth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token } = response.data;
      
      // Update stored tokens
      OuraService.tokens.accessToken = access_token;
      OuraService.tokens.refreshToken = refresh_token;
      OuraService.tokens.expiresAt = Date.now() + (3600 * 1000); // Assume 1 hour
      
      // Also update instance tokens
      this.accessToken = access_token;
      this.refreshToken = refresh_token;

      logger.info('Successfully refreshed Oura access token');
      return access_token;
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh Oura access token');
    }
  }

  private async makeAuthenticatedRequest(endpoint: string): Promise<any> {
    // Check if token is expired
    if (OuraService.tokens.expiresAt && Date.now() > OuraService.tokens.expiresAt) {
      logger.info('Oura access token expired, refreshing...');
      await this.refreshAccessToken();
    }
    
    const accessToken = this.accessToken || OuraService.tokens.accessToken;
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        await this.refreshAccessToken();
        return this.makeAuthenticatedRequest(endpoint);
      }
      throw error;
    }
  }

  async getDailyData(startDate: string, endDate: string): Promise<OuraDailyData[]> {
    try {
      logger.info(`Fetching daily data from ${startDate} to ${endDate}`);
      
      // Get daily readiness data (contains scores)
      let readinessData = { data: [] };
      try {
        readinessData = await this.makeAuthenticatedRequest(`/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`);
        logger.info('Successfully fetched readiness data from v2 endpoint');
      } catch (error) {
        logger.info('Trying legacy readiness endpoint...');
        try {
          readinessData = await this.makeAuthenticatedRequest(`/daily_readiness?start_date=${startDate}&end_date=${endDate}`);
          logger.info('Successfully fetched readiness data from legacy endpoint');
        } catch (legacyError) {
          logger.warn('Both readiness endpoints failed, using empty data');
          readinessData = { data: [] };
        }
      }
      
      // Get daily activity data (contains steps, calories, etc.)
      let activityData = { data: [] };
      try {
        activityData = await this.makeAuthenticatedRequest(`/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`);
      } catch (error) {
        logger.info('Trying legacy activity endpoint...');
        try {
          activityData = await this.makeAuthenticatedRequest(`/daily_activity?start_date=${startDate}&end_date=${endDate}`);
        } catch (legacyError) {
          logger.warn('Both activity endpoints failed, using empty data');
          activityData = { data: [] };
        }
      }
      
      // Get sleep data (might contain sleep scores)
      let sleepData = { data: [] };
      try {
        sleepData = await this.makeAuthenticatedRequest(`/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`);
        logger.info('Successfully fetched sleep data');
      } catch (error) {
        logger.info('Trying legacy sleep endpoint...');
        try {
          sleepData = await this.makeAuthenticatedRequest(`/daily_sleep?start_date=${startDate}&end_date=${endDate}`);
          logger.info('Successfully fetched sleep data from legacy endpoint');
        } catch (legacyError) {
          logger.warn('Both sleep endpoints failed, using empty data');
          sleepData = { data: [] };
        }
      }
      
      // Get HRV data (try different endpoints)
      let hrvData = { data: [] };
      try {
        hrvData = await this.makeAuthenticatedRequest(`/usercollection/daily_hrv?start_date=${startDate}&end_date=${endDate}`);
        logger.info('Successfully fetched HRV data from v2 endpoint');
      } catch (error) {
        logger.info('Trying legacy HRV endpoint...');
        try {
          hrvData = await this.makeAuthenticatedRequest(`/daily_hrv?start_date=${startDate}&end_date=${endDate}`);
          logger.info('Successfully fetched HRV data from legacy endpoint');
        } catch (legacyError) {
          logger.info('Trying heart rate endpoint for HRV...');
          try {
            hrvData = await this.makeAuthenticatedRequest(`/usercollection/heartrate?start_date=${startDate}&end_date=${endDate}`);
            logger.info('Successfully fetched HRV data from heart rate endpoint');
          } catch (heartRateError) {
            logger.info('Trying legacy heart rate endpoint...');
            try {
              hrvData = await this.makeAuthenticatedRequest(`/heartrate?start_date=${startDate}&end_date=${endDate}`);
              logger.info('Successfully fetched HRV data from legacy heart rate endpoint');
            } catch (finalError) {
              logger.warn('All HRV endpoints failed, using empty data');
              hrvData = { data: [] };
            }
          }
        }
      }
      
      // Process readiness data
      let readinessArray: any[] = readinessData.data || [];
      if (!readinessArray.length && Array.isArray(readinessData)) {
        readinessArray = readinessData as any[];
      }
      
      // Process activity data
      let activityArray: any[] = activityData.data || [];
      if (!activityArray.length && Array.isArray(activityData)) {
        activityArray = activityData as any[];
      }
      
      // Process sleep data
      let sleepArray: any[] = sleepData.data || [];
      if (!sleepArray.length && Array.isArray(sleepData)) {
        sleepArray = sleepData as any[];
      }
      
      // Process HRV data
      let hrvArray: any[] = hrvData.data || [];
      if (!hrvArray.length && Array.isArray(hrvData)) {
        hrvArray = hrvData as any[];
      }
      
      // Combine the data by day
      let combinedData: any[] = readinessArray.map((readinessDay: any) => {
        const activityDay = activityArray.find((activity: any) => activity.day === readinessDay.day);
        const sleepDay = sleepArray.find((sleep: any) => sleep.day === readinessDay.day);
        const hrvDay = hrvArray.find((hrv: any) => hrv.day === readinessDay.day);
        
        // The readiness score is the overall score, individual scores might need to be calculated
        const readinessScore = readinessDay.score || readinessDay.readiness_score || readinessDay.readinessScore || 0;
        
        return {
          ...readinessDay,
          ...(activityDay || {}),
          ...(sleepDay || {}),
          ...(hrvDay || {}),
          // Use the actual scores from readiness data
          sleep_score: sleepDay?.sleep_score || sleepDay?.score || readinessDay.sleep_score || readinessDay.sleepScore || Math.round(readinessScore * 0.8), // Estimate
          activity_score: readinessDay.activity_score || readinessDay.activityScore || Math.round(readinessScore * 0.6), // Estimate
          readiness_score: readinessScore,
          hrv: hrvDay?.hrv || hrvDay?.hrv_balance || readinessDay.hrv || readinessDay.hrv_balance || readinessDay.contributors?.hrv_balance || 0,
          steps: activityDay?.steps || 0,
          calories_total: activityDay?.total_calories || activityDay?.calories_total || 0,
          calories_active: activityDay?.active_calories || activityDay?.calories_active || 0,
        };
      });
      
      // If no readiness data, use activity data as fallback
      if (combinedData.length === 0 && activityArray.length > 0) {
        combinedData = activityArray.map((activityDay: any) => ({
          ...activityDay,
          sleep_score: 0,
          activity_score: 0,
          readiness_score: 0,
          hrv: 0,
          steps: activityDay.steps || 0,
          calories_total: activityDay.total_calories || activityDay.calories_total || 0,
          calories_active: activityDay.active_calories || activityDay.calories_active || 0,
        }));
      }
      
      logger.info(`Combined data:`, { 
        readinessLength: readinessArray.length,
        activityLength: activityArray.length,
        combinedLength: combinedData.length,
        sampleCombined: combinedData[0] || 'No data'
      });
      
      // Debug: Log what's in the readiness data
      if (readinessArray.length > 0) {
        logger.info('Sample readiness data:', {
          day: readinessArray[0].day,
          score: readinessArray[0].score,
          sleep_score: readinessArray[0].sleep_score,
          activity_score: readinessArray[0].activity_score,
          readiness_score: readinessArray[0].readiness_score,
          hrv: readinessArray[0].hrv,
          contributors: readinessArray[0].contributors,
          allFields: Object.keys(readinessArray[0])
        });
      }
      
      // Debug: Log what's in the HRV data
      if (hrvArray.length > 0) {
        logger.info('Sample HRV data:', {
          day: hrvArray[0].day,
          hrv: hrvArray[0].hrv,
          hrv_balance: hrvArray[0].hrv_balance,
          allFields: Object.keys(hrvArray[0])
        });
      }
      
      return combinedData;
    } catch (error) {
      logger.error('Error fetching daily Oura data:', error);
      throw new Error('Failed to fetch daily Oura data');
    }
  }

  async getSleepData(startDate: string, endDate: string): Promise<any[]> {
    try {
      const data = await this.makeAuthenticatedRequest(`/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`);
      return data.data || [];
    } catch (error) {
      logger.error('Error fetching sleep Oura data:', error);
      throw new Error('Failed to fetch sleep Oura data');
    }
  }

  async getHeartRateData(startDate: string, endDate: string): Promise<any[]> {
    try {
      const data = await this.makeAuthenticatedRequest(`/usercollection/heartrate?start_date=${startDate}&end_date=${endDate}`);
      return data.data || [];
    } catch (error) {
      logger.error('Error fetching heart rate Oura data:', error);
      throw new Error('Failed to fetch heart rate Oura data');
    }
  }

  async getPersonalInfo(): Promise<any> {
    try {
      const data = await this.makeAuthenticatedRequest('/userinfo');
      return data;
    } catch (error) {
      logger.error('Error fetching Oura personal info:', error);
      throw new Error('Failed to fetch Oura personal info');
    }
  }

  // Check if we have valid tokens
  hasValidTokens(): boolean {
    return !!(OuraService.tokens.accessToken && OuraService.tokens.refreshToken);
  }

  // Helper method to calculate weekly averages
  calculateWeeklyAverages(dailyData: OuraDailyData[]): OuraWeeklyData[] {
    const weeklyMap = new Map<string, OuraDailyData[]>();

    // Group data by week
    dailyData.forEach(day => {
      const date = new Date(day.day);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, []);
      }
      weeklyMap.get(weekKey)!.push(day);
    });

    // Calculate averages for each week
    return Array.from(weeklyMap.entries()).map(([week, days]) => {
      const count = days.length;
      return {
        week,
        hrv_avg: days.reduce((sum, day) => sum + (day.hrv || 0), 0) / count,
        sleep_score_avg: days.reduce((sum, day) => sum + (day.sleep_score || 0), 0) / count,
        activity_score_avg: days.reduce((sum, day) => sum + (day.activity_score || 0), 0) / count,
        readiness_score_avg: days.reduce((sum, day) => sum + (day.readiness_score || 0), 0) / count,
        deep_sleep_avg: days.reduce((sum, day) => sum + (day.deep_sleep_duration || 0), 0) / count,
        rem_sleep_avg: days.reduce((sum, day) => sum + (day.rem_sleep_duration || 0), 0) / count,
        light_sleep_avg: days.reduce((sum, day) => sum + (day.light_sleep_duration || 0), 0) / count,
        total_sleep_avg: days.reduce((sum, day) => sum + (day.total_sleep_duration || 0), 0) / count,
        sleep_efficiency_avg: days.reduce((sum, day) => sum + (day.sleep_efficiency || 0), 0) / count,
        resting_heart_rate_avg: days.reduce((sum, day) => sum + (day.resting_heart_rate || 0), 0) / count,
        steps_avg: days.reduce((sum, day) => sum + (day.steps || 0), 0) / count,
        calories_active_avg: days.reduce((sum, day) => sum + (day.calories_active || 0), 0) / count,
        calories_total_avg: days.reduce((sum, day) => sum + (day.calories_total || 0), 0) / count,
      };
    });
  }
}

export const ouraService = new OuraService(); 