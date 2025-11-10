import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login, setupMFA, verifyMFA, loginWithMFA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaStep, setMfaStep] = useState(null); // null, 'setup', 'verify', 'login'
  const [mfaData, setMfaData] = useState(null);
  const [userId, setUserId] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: registerMFA, handleSubmit: handleSubmitMFA } = useForm();

  const from = location.state?.from?.pathname;

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const result = await login(data);

      if (result.requiresMfaSetup) {
        setUserId(result.userId);
        setMfaStep('setup');
      } else if (result.requiresMfa) {
        setUserId(result.userId);
        setMfaStep('login');
      } else if (result.success) {
        console.log('Login successful, navigating to dashboard for role-based redirect');
        toast.success('Login successful!');
        // Always redirect to dashboard for role-based routing
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        console.log('Login result:', result);
        setError('Login failed - unexpected response');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSetup = async () => {
    try {
      const result = await setupMFA(userId);
      setMfaData(result);
      setMfaStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'MFA setup failed');
    }
  };

  const handleMfaVerification = async (data) => {
    setLoading(true);
    try {
      await verifyMFA(userId, data.token);
      toast.success('MFA setup completed successfully!');
      setMfaStep(null);
      setMfaData(null);
      setUserId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaLogin = async (data) => {
    setLoading(true);
    try {
      const loginData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        mfaToken: data.token
      };
      
      const result = await loginWithMFA(loginData);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'MFA login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            kabisakabisa enterprise Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              onClick={() => navigate('/register')}
            >
              First Time? Create Admin Account
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" align="center">
            Secure login with multi-factor authentication for privileged accounts
          </Typography>
        </Paper>
      </Box>

      {/* MFA Setup Dialog */}
      <Dialog open={mfaStep === 'setup'} maxWidth="sm" fullWidth>
        <DialogTitle>Setup Multi-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Your role requires multi-factor authentication for enhanced security.
            Please set up MFA to continue.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMfaSetup} variant="contained">
            Setup MFA
          </Button>
        </DialogActions>
      </Dialog>

      {/* MFA Verification Dialog */}
      <Dialog open={mfaStep === 'verify'} maxWidth="sm" fullWidth>
        <DialogTitle>Verify MFA Setup</DialogTitle>
        <DialogContent>
          {mfaData && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Scan this QR code with your authenticator app:
              </Typography>
              <img 
                src={mfaData.qrCode} 
                alt="MFA QR Code" 
                style={{ maxWidth: '200px', margin: '16px 0' }}
              />
              <Typography variant="body2" gutterBottom>
                Or enter this secret manually: {mfaData.secret}
              </Typography>
              
              <Box component="form" onSubmit={handleSubmitMFA(handleMfaVerification)} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Enter 6-digit code"
                  {...registerMFA('token', {
                    required: 'Token is required',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Token must be 6 digits'
                    }
                  })}
                  margin="normal"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify & Complete Setup'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MFA Login Dialog */}
      <Dialog open={mfaStep === 'login'} maxWidth="sm" fullWidth>
        <DialogTitle>Multi-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please enter the 6-digit code from your authenticator app:
          </Typography>
          
          <Box component="form" onSubmit={handleSubmitMFA(handleMfaLogin)} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Enter 6-digit code"
              {...registerMFA('token', {
                required: 'Token is required',
                pattern: {
                  value: /^\d{6}$/,
                  message: 'Token must be 6 digits'
                }
              })}
              margin="normal"
              autoFocus
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & Login'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default LoginPage;