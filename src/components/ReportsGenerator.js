import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Assessment, Download, Print } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../theme';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ReportsGenerator = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('sales');
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (user.branchId && user.role !== 'boss') {
        params.branchId = user.branchId;
      }

      let response;
      if (reportType === 'sales') {
        response = await reportsAPI.getSalesReport(params);
      } else if (reportType === 'expenses') {
        response = await reportsAPI.getExpensesReport(params);
      } else if (reportType === 'payroll') {
        response = await reportsAPI.getPayrollReport(params);
      }
      setReportData(response);
      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const printReport = () => {
    if (!reportData) return;
    
    const printContent = `
      <h2>${reportType.toUpperCase()} REPORT</h2>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      <p>Period: ${period}</p>
      ${reportData.summary ? `
        <h3>Summary</h3>
        <ul>
          ${Object.entries(reportData.summary).map(([key, value]) => 
            `<li>${key}: ${typeof value === 'number' && key.includes('Amount') ? 'KSH ' + value : value}</li>`
          ).join('')}
        </ul>
      ` : ''}
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Report</title></head><body>${printContent}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Reports Generator
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="sales">Sales Report</MenuItem>
                  {['boss', 'manager', 'admin'].includes(user?.role) && (
                    <MenuItem value="expenses">Expenses Report</MenuItem>
                  )}
                  {['boss', 'hr'].includes(user?.role) && (
                    <MenuItem value="payroll">Payroll Report</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {period === 'custom' && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Assessment />}
              onClick={generateReport}
              disabled={loading}
            >
              Generate Report
            </Button>
            {reportData && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={exportReport}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={printReport}
                >
                  Print
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Report Results
            </Typography>

            {reportData.summary && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Summary</Typography>
                <Grid container spacing={2}>
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <Grid item xs={6} md={3} key={key}>
                      <Typography variant="body2" color="text.secondary">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Typography>
                      <Typography variant="h6">
                        {typeof value === 'number' && key.toLowerCase().includes('amount') 
                          ? formatCurrency(value) 
                          : value}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {reportType === 'sales' && (
                      <>
                        <TableCell>Date</TableCell>
                        <TableCell>Branch</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Payment</TableCell>
                      </>
                    )}
                    {reportType === 'expenses' && (
                      <>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Category</TableCell>
                      </>
                    )}
                    {reportType === 'payroll' && (
                      <>
                        <TableCell>Employee</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Gross</TableCell>
                        <TableCell>Net</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.sales || reportData.expenses || reportData.payroll || []).map((row, index) => (
                    <TableRow key={index}>
                      {reportType === 'sales' && (
                        <>
                          <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                          <TableCell>{row.branch}</TableCell>
                          <TableCell>{formatCurrency(row.total)}</TableCell>
                          <TableCell>{row.payment_method}</TableCell>
                        </>
                      )}
                      {reportType === 'expenses' && (
                        <>
                          <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell>{formatCurrency(row.amount)}</TableCell>
                          <TableCell>{row.category}</TableCell>
                        </>
                      )}
                      {reportType === 'payroll' && (
                        <>
                          <TableCell>{row.employee_name}</TableCell>
                          <TableCell>{row.period_start} - {row.period_end}</TableCell>
                          <TableCell>{formatCurrency(row.gross_salary)}</TableCell>
                          <TableCell>{formatCurrency(row.net_salary)}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReportsGenerator;