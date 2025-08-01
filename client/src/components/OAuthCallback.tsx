import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const ouraConnected = searchParams.get('oura_connected');
      const ouraError = searchParams.get('oura_error');
      const tempToken = searchParams.get('temp_token');

      if (ouraError) {
        setError('Failed to connect Oura Ring. Please try again.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (ouraConnected && tempToken) {
        try {
          // Handle the OAuth token authentication
          await handleOAuthToken(tempToken);
          navigate('/');
        } catch (error) {
          console.error('OAuth callback error:', error);
          setError('Authentication failed. Please try logging in again.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        // No OAuth parameters, just go to dashboard
        navigate('/');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, handleOAuthToken]);

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Redirecting...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.primary">
        Connecting Oura Ring...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we complete the connection.
      </Typography>
    </Box>
  );
};

export default OAuthCallback; 