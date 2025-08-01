import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Link as LinkIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import axios from 'axios';

interface OuraStatus {
  connected: boolean;
  message: string;
}

const OuraConnection: React.FC = () => {
  const [status, setStatus] = useState<OuraStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/oura/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStatus(response.data);
    } catch (error: any) {
      console.error('Error checking Oura status:', error);
      setError('Failed to check Oura connection status');
    }
  };

  const initiateOAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('http://localhost:3001/api/oura/auth/url', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      // Open Oura OAuth page in a new window
      const authWindow = window.open(
        response.data.authUrl,
        'oura-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      // Poll for completion (in a real app, you'd use a more sophisticated approach)
      const checkCompletion = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkCompletion);
          setLoading(false);
          checkStatus(); // Recheck status after OAuth
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Error initiating Oura OAuth:', error);
      setError('Failed to initiate Oura connection');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h2">
            Oura Ring Connection
          </Typography>
          {status?.connected ? (
            <Chip
              icon={<CheckCircleIcon />}
              label="Connected"
              color="success"
              variant="outlined"
            />
          ) : (
            <Chip
              icon={<LinkIcon />}
              label="Not Connected"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {status?.message && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {status.message}
          </Typography>
        )}

        {!status?.connected && (
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={initiateOAuth}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Connecting...
              </>
            ) : (
              'Connect Oura Ring'
            )}
          </Button>
        )}

        {status?.connected && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Your Oura Ring is connected! Your health data will now appear in the dashboard.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default OuraConnection; 