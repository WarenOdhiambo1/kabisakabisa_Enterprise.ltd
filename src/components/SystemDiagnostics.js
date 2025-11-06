import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField
} from '@mui/material';
import { ExpandMore, Refresh, BugReport } from '@mui/icons-material';
import axios from 'axios';

const SystemDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loginTest, setLoginTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://enterprisebackendltd.vercel.app/api';

  const runSystemCheck = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/diagnostics/system-check`);
      setDiagnostics(response.data);
    } catch (error) {
      setDiagnostics({
        error: true,
        message: error.message,
        details: error.response?.data || 'Failed to connect to backend'
      });
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const testLogin = async () => {
    if (!testEmail) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/diagnostics/test-login`, {
        email: testEmail
      });
      setLoginTest(response.data);
    } catch (error) {
      setLoginTest({
        error: true,
        message: error.message,
        details: error.response?.data || 'Login test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSystemCheck();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
      case 'healthy':
      case 'exists':
        return 'success';
      case 'failed':
      case 'issues_detected':
      case 'missing_or_error':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <BugReport sx={{ mr: 2 }} />
          <Typography variant="h4">System Diagnostics</Typography>
          <Button
            startIcon={<Refresh />}
            onClick={runSystemCheck}
            disabled={loading}
            sx={{ ml: 'auto' }}
          >
            Refresh
          </Button>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}

        {diagnostics?.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6">Backend Connection Failed</Typography>
            <Typography>{diagnostics.message}</Typography>
            <pre>{JSON.stringify(diagnostics.details, null, 2)}</pre>
          </Alert>
        )}

        {diagnostics && !diagnostics.error && (
          <>
            <Alert 
              severity={diagnostics.system_status === 'healthy' ? 'success' : 'error'} 
              sx={{ mb: 3 }}
            >
              <Typography variant="h6">
                System Status: {diagnostics.system_status}
              </Typography>
              {diagnostics.critical_issues?.length > 0 && (
                <Box mt={1}>
                  <Typography variant="subtitle2">Critical Issues:</Typography>
                  {diagnostics.critical_issues.map((issue, index) => (
                    <Typography key={index}>• {issue}</Typography>
                  ))}
                </Box>
              )}
            </Alert>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Environment Variables</Typography>
                <Chip 
                  label={Object.values(diagnostics.checks.environment_variables).filter(v => v === true).length + '/' + (Object.keys(diagnostics.checks.environment_variables).length - 1)}
                  color={Object.values(diagnostics.checks.environment_variables).every(v => v === true || v === 'checked') ? 'success' : 'error'}
                  sx={{ ml: 2 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                <pre>{JSON.stringify(diagnostics.checks.environment_variables, null, 2)}</pre>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Airtable Connection</Typography>
                <Chip 
                  label={diagnostics.checks.airtable_connection.status}
                  color={getStatusColor(diagnostics.checks.airtable_connection.status)}
                  sx={{ ml: 2 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                <pre>{JSON.stringify(diagnostics.checks.airtable_connection, null, 2)}</pre>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Database Tables</Typography>
                <Chip 
                  label={Object.values(diagnostics.checks.database_tables).filter(t => t.status === 'exists').length + '/' + Object.keys(diagnostics.checks.database_tables).length}
                  color={Object.values(diagnostics.checks.database_tables).every(t => t.status === 'exists') ? 'success' : 'error'}
                  sx={{ ml: 2 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                <pre>{JSON.stringify(diagnostics.checks.database_tables, null, 2)}</pre>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">JWT Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre>{JSON.stringify(diagnostics.checks.jwt_config, null, 2)}</pre>
              </AccordionDetails>
            </Accordion>
          </>
        )}

        <Box mt={4}>
          <Typography variant="h5" mb={2}>Login Flow Test</Typography>
          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Test Email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="user@example.com"
              fullWidth
            />
            <Button
              variant="contained"
              onClick={testLogin}
              disabled={loading || !testEmail}
            >
              Test Login
            </Button>
          </Box>

          {loginTest && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" mb={2}>Login Test Results</Typography>
              <pre>{JSON.stringify(loginTest, null, 2)}</pre>
            </Paper>
          )}
        </Box>

        <Box mt={4}>
          <Typography variant="h6" mb={2}>Quick Fixes</Typography>
          <Alert severity="info">
            <Typography variant="subtitle2">Common Issues & Solutions:</Typography>
            <Typography>• Missing environment variables → Set in Vercel Dashboard</Typography>
            <Typography>• Airtable connection failed → Check API key and Base ID</Typography>
            <Typography>• No employees found → Create user in Airtable Employees table</Typography>
            <Typography>• JWT secrets too short → Generate 32+ character secrets</Typography>
          </Alert>
        </Box>
      </Paper>
    </Container>
  );
};

export default SystemDiagnostics;