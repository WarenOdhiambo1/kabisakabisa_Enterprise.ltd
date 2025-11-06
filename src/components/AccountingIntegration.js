import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

  Chip
} from '@mui/material';
import { Sync, Assessment, Settings, CloudSync } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { accountingAPI } from '../services/api';
import toast from 'react-hot-toast';

const AccountingIntegration = () => {
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  // Queries
  const { data: settings = [] } = useQuery(
    'erpSettings',
    () => accountingAPI.getSettings()
  );

  // Mutations
  const saveSettingsMutation = useMutation(
    (data) => accountingAPI.saveSettings(data),
    {
      onSuccess: () => {
        toast.success('ERP settings saved successfully!');
        setShowSettings(false);
        reset();
        queryClient.invalidateQueries('erpSettings');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save settings');
      }
    }
  );

  // const syncEtimsMutation = useMutation(
  //   (data) => accountingAPI.syncEtims(data),
  //   {
  //     onSuccess: (response) => {
  //       toast.success(`Invoice synced! Reference: ${response.data.etims_reference}`);
  //       setShowSyncDialog(false);
  //     },
  //     onError: (error) => {
  //       toast.error(error.response?.data?.message || 'Sync failed');
  //     }
  //   }
  // );

  const bulkSyncMutation = useMutation(
    (data) => accountingAPI.bulkSyncEtims(data),
    {
      onSuccess: (response) => {
        toast.success(response.data.message);
        setShowSyncDialog(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Bulk sync failed');
      }
    }
  );

  const onSubmitSettings = (data) => {
    saveSettingsMutation.mutate(data);
  };

  // const handleSyncInvoice = (invoiceId) => {
  //   syncEtimsMutation.mutate({ invoice_id: invoiceId });
  // };

  const handleBulkSync = (dateFrom, dateTo) => {
    bulkSyncMutation.mutate({ date_from: dateFrom, date_to: dateTo });
  };

  const generateReport = async (reportType, dateFrom, dateTo) => {
    try {
      const response = await accountingAPI.generateReport({
        report_type: reportType, date_from: dateFrom, date_to: dateTo
      });
      
      // Create downloadable file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report_${dateFrom}_${dateTo}.json`;
      link.click();
      
      toast.success('Report generated successfully!');
      setShowReportDialog(false);
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const currentSettings = settings[0] || {};

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Accounting/ERP Integration
      </Typography>

      {/* Integration Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">ERP Status</Typography>
              </Box>
              <Chip 
                label={currentSettings.erp_type || 'Not Configured'} 
                color={currentSettings.erp_type ? 'success' : 'default'}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Sync: {currentSettings.sync_enabled ? 'Enabled' : 'Disabled'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudSync sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">KRA eTIMS</Typography>
              </Box>
              <Chip 
                label={currentSettings.etims_enabled ? 'Connected' : 'Disconnected'} 
                color={currentSettings.etims_enabled ? 'success' : 'error'}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Auto-sync invoices to KRA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Audit Ready</Typography>
              </Box>
              <Chip 
                label={currentSettings.sync_enabled ? 'Yes' : 'No'} 
                color={currentSettings.sync_enabled ? 'success' : 'warning'}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Reports & compliance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Settings />}
          onClick={() => setShowSettings(true)}
        >
          Configure ERP
        </Button>
        <Button
          variant="outlined"
          startIcon={<Sync />}
          onClick={() => setShowSyncDialog(true)}
          disabled={!currentSettings.etims_enabled}
        >
          Sync to eTIMS
        </Button>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={() => setShowReportDialog(true)}
        >
          Generate Reports
        </Button>
      </Box>

      {/* Integration Guide */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Integration Setup Guide
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            1. ERP System Integration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            • Supported: QuickBooks Online, Xero, Sage, Custom ERP<br/>
            • Configure API credentials in settings<br/>
            • Enable auto-sync for invoices, expenses, payroll
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            2. KRA eTIMS API Setup
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            • Register with KRA for eTIMS API access<br/>
            • Get your TIN and API credentials<br/>
            • Configure environment variables:<br/>
            &nbsp;&nbsp;- ETIMS_API_KEY=your_api_key<br/>
            &nbsp;&nbsp;- ETIMS_TIN=your_tin_number<br/>
            &nbsp;&nbsp;- ETIMS_BASE_URL=https://etims-api-sbx.kra.go.ke/etims-api
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            3. Automatic Invoice Reporting
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            • All sales invoices auto-sync to KRA eTIMS<br/>
            • VAT calculations included (16% standard rate)<br/>
            • Customer TIN validation<br/>
            • Real-time compliance reporting
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            4. Audit-Ready Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Sales reports with KRA references<br/>
            • Expense tracking with tax codes<br/>
            • Payroll reports with PAYE calculations<br/>
            • Export to Excel/PDF formats
          </Typography>
        </CardContent>
      </Card>

      {/* ERP Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ERP Integration Settings</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>ERP System</InputLabel>
              <Select
                {...register('erp_type')}
                label="ERP System"
                defaultValue={currentSettings.erp_type || ''}
              >
                <MenuItem value="quickbooks">QuickBooks Online</MenuItem>
                <MenuItem value="xero">Xero</MenuItem>
                <MenuItem value="sage">Sage</MenuItem>
                <MenuItem value="custom">Custom ERP</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="API Key"
              type="password"
              margin="normal"
              defaultValue={currentSettings.api_key || ''}
              {...register('api_key')}
            />
            
            <TextField
              fullWidth
              label="Base URL"
              margin="normal"
              defaultValue={currentSettings.base_url || ''}
              {...register('base_url')}
            />
            
            <FormControlLabel
              control={
                <Switch 
                  defaultChecked={currentSettings.sync_enabled || false}
                  {...register('sync_enabled')}
                />
              }
              label="Enable Auto-Sync"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  defaultChecked={currentSettings.etims_enabled || false}
                  {...register('etims_enabled')}
                />
              }
              label="Enable KRA eTIMS Integration"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmitSettings)}
            variant="contained"
            disabled={saveSettingsMutation.isLoading}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onClose={() => setShowSyncDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sync to KRA eTIMS</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Sync invoices to KRA eTIMS for tax compliance
          </Alert>
          
          <TextField
            fullWidth
            label="Date From"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            id="dateFrom"
          />
          
          <TextField
            fullWidth
            label="Date To"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            id="dateTo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSyncDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              const dateFrom = document.getElementById('dateFrom').value;
              const dateTo = document.getElementById('dateTo').value;
              handleBulkSync(dateFrom, dateTo);
            }}
            variant="contained"
            disabled={bulkSyncMutation.isLoading}
          >
            Bulk Sync
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Audit Reports</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Report Type</InputLabel>
            <Select
              label="Report Type"
              id="reportType"
              defaultValue="full"
            >
              <MenuItem value="full">Full Audit Report</MenuItem>
              <MenuItem value="sales">Sales Report</MenuItem>
              <MenuItem value="expenses">Expenses Report</MenuItem>
              <MenuItem value="payroll">Payroll Report</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Date From"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            id="reportDateFrom"
          />
          
          <TextField
            fullWidth
            label="Date To"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            id="reportDateTo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              const reportType = document.getElementById('reportType').value;
              const dateFrom = document.getElementById('reportDateFrom').value;
              const dateTo = document.getElementById('reportDateTo').value;
              generateReport(reportType, dateFrom, dateTo);
            }}
            variant="contained"
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountingIntegration;