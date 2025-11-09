import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import toast from 'react-hot-toast';

const XeroCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          toast.error('Xero connection was cancelled or failed');
          navigate('/admin');
          return;
        }

        if (code) {
          // The backend will handle the token exchange
          toast.success('Successfully connected to Xero!');
          navigate('/admin?tab=3'); // Navigate to accounting tab
        } else {
          toast.error('Invalid callback from Xero');
          navigate('/admin');
        }
      } catch (error) {
        console.error('Xero callback error:', error);
        toast.error('Failed to process Xero connection');
        navigate('/admin');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 2
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6">
        Connecting to Xero...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we complete the connection
      </Typography>
    </Box>
  );
};

export default XeroCallback;