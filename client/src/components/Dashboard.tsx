import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  FitnessCenter,
  Bed,
  Speed,
  Favorite,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import OuraConnection from './OuraConnection';

interface DashboardData {
  today: any;
  weeklyAverages: any[];
  insights: any;
  trendData: any[];
  threeMonthTrendData: any[];
  ouraConnected?: boolean;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendTab, setTrendTab] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/dashboard/overview');
      setData(response.data.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp color="success" />;
      case 'declining':
        return <TrendingDown color="error" />;
      default:
        return <Remove color="action" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const COLORS = ['#00d4aa', '#ff6b6b', '#4ecdc4', '#45b7d1'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Today's Overview
        </Typography>
        <OuraConnection />
        <Alert severity="info">
          No data available. Please connect your Oura ring to see your health metrics.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Today's Overview
      </Typography>

      {/* Oura Connection Component - only show if not connected */}
      {!data.ouraConnected && <OuraConnection />}

      {/* Today's Scores - More Condensed Layout */}
      
      {!data.ouraConnected ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Connect your Oura Ring to see your health metrics and scores.
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Bed color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" color="primary" gutterBottom>
                {data.today?.sleep_score || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Sleep Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.today?.sleep_score || 0}
                color={getScoreColor(data.today?.sleep_score || 0)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <FitnessCenter color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" color="primary" gutterBottom>
                {data.today?.activity_score || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Activity Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.today?.activity_score || 0}
                color={getScoreColor(data.today?.activity_score || 0)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Speed color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" color="primary" gutterBottom>
                {data.today?.readiness_score || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Readiness Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.today?.readiness_score || 0}
                color={getScoreColor(data.today?.readiness_score || 0)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Favorite color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" color="primary" gutterBottom>
                {data.today?.hrv || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                HRV (ms)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* Trends and Insights - Condensed with Tabs */}
      {data.ouraConnected && (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={trendTab} onChange={(e, newValue) => setTrendTab(newValue)}>
                  <Tab label="7-Day Trend" />
                  <Tab label="3-Month Trend" />
                </Tabs>
              </Box>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendTab === 0 ? data.trendData : data.threeMonthTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return trendTab === 0 
                        ? date.toLocaleDateString('en-US', { weekday: 'short' })
                        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sleep_score"
                    stroke="#00d4aa"
                    strokeWidth={2}
                    name="Sleep Score"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="activity_score"
                    stroke="#ff6b6b"
                    strokeWidth={2}
                    name="Activity Score"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="readiness_score"
                    stroke="#4ecdc4"
                    strokeWidth={2}
                    name="Readiness Score"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Weekly Averages
              </Typography>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="textSecondary">
                  Sleep Score
                </Typography>
                <Typography variant="h6" color="primary">
                  {data.weeklyAverages[data.weeklyAverages.length - 1]?.sleep_score_avg?.toFixed(1) || 0}
                </Typography>
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="textSecondary">
                  Activity Score
                </Typography>
                <Typography variant="h6" color="primary">
                  {data.weeklyAverages[data.weeklyAverages.length - 1]?.activity_score_avg?.toFixed(1) || 0}
                </Typography>
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="textSecondary">
                  Readiness Score
                </Typography>
                <Typography variant="h6" color="primary">
                  {data.weeklyAverages[data.weeklyAverages.length - 1]?.readiness_score_avg?.toFixed(1) || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  HRV Average
                </Typography>
                <Typography variant="h6" color="primary">
                  {data.weeklyAverages[data.weeklyAverages.length - 1]?.hrv_avg?.toFixed(1) || 0} ms
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* Insights - More Condensed */}
      {data.ouraConnected && data.insights && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Insights
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(data.insights).map(([key, insight]: [string, any]) => (
                    <Grid item xs={6} sm={3} key={key}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Box display="flex" alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                          {getTrendIcon(insight.trend)}
                        </Box>
                        <Typography variant="h6" gutterBottom>
                          {insight.current}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Avg: {insight.average?.toFixed(1)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard; 