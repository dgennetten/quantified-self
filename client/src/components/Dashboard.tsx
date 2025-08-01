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
  ouraConnected?: boolean;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      {/* Today's Scores */}
      
      {!data.ouraConnected ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Connect your Oura Ring to see your health metrics and scores.
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Sleep Score
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {data.today?.sleep_score || 0}
                  </Typography>
                </Box>
                <Bed color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={data.today?.sleep_score || 0}
                color={getScoreColor(data.today?.sleep_score || 0)}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Activity Score
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {data.today?.activity_score || 0}
                  </Typography>
                </Box>
                <FitnessCenter color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={data.today?.activity_score || 0}
                color={getScoreColor(data.today?.activity_score || 0)}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Readiness Score
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {data.today?.readiness_score || 0}
                  </Typography>
                </Box>
                <Speed color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={data.today?.readiness_score || 0}
                color={getScoreColor(data.today?.readiness_score || 0)}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    HRV
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {data.today?.hrv || 0}
                  </Typography>
                </Box>
                <Favorite color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* Trends and Insights */}
      {data.ouraConnected && (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                7-Day Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sleep_score"
                    stroke="#00d4aa"
                    strokeWidth={2}
                    name="Sleep Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="activity_score"
                    stroke="#ff6b6b"
                    strokeWidth={2}
                    name="Activity Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="readiness_score"
                    stroke="#4ecdc4"
                    strokeWidth={2}
                    name="Readiness Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Averages
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Sleep Score
                </Typography>
                <Typography variant="h5" color="primary">
                  {data.weeklyAverages[data.weeklyAverages.length - 1]?.sleep_score_avg?.toFixed(1) || 0}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Activity Score
                </Typography>
                <Typography variant="h5" color="primary">
                  {data.weeklyAverages[data.weeklyAverages.length - 1]?.activity_score_avg?.toFixed(1) || 0}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Readiness Score
                </Typography>
                <Typography variant="h5" color="primary">
                  {data.weeklyAverages[data.weeklyAverages.length - 1]?.readiness_score_avg?.toFixed(1) || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  HRV Average
                </Typography>
                <Typography variant="h5" color="primary">
                  {data.weeklyAverages[data.weeklyAverages.length - 1]?.hrv_avg?.toFixed(1) || 0} ms
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* Insights */}
      {data.ouraConnected && data.insights && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Insights
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(data.insights).map(([key, insight]: [string, any]) => (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Typography>
                        {getTrendIcon(insight.trend)}
                      </Box>
                      <Typography variant="h6">
                        {insight.current}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Avg: {insight.average?.toFixed(1)}
                      </Typography>
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