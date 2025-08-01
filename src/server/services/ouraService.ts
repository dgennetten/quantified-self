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

  async exchangeCodeForToken(code: string): Promise<OuraTokenResponse> {
    try {
      const response = await axios.post('https://api.ouraring.com/oauth/token', {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.OURA_CLIENT_ID,
        client_secret: process.env.OURA_CLIENT_SECRET,
        redirect_uri: process.env.OURA_REDIRECT_URI,
      });

      const { access_token, refresh_token, expires_in } = response.data;
      this.accessToken = access_token;
      this.refreshToken = refresh_token;

      logger.info('Successfully obtained Oura access token');
      return { access_token, refresh_token, expires_in };
    } catch (error) {
      logger.error('Error exchanging code for token:', error);
      throw new Error('Failed to obtain Oura access token');
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('https://api.ouraring.com/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: process.env.OURA_CLIENT_ID,
        client_secret: process.env.OURA_CLIENT_SECRET,
      });

      const { access_token, refresh_token } = response.data;
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
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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
      const data = await this.makeAuthenticatedRequest(`/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`);
      return data.data || [];
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