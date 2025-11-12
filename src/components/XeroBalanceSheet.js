import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  Grid
} from '@mui/material';
import { FileDownload, Print } from '@mui/icons-material';
import { formatCurrency } from '../theme';

const XeroBalanceSheet = ({ 
  sales = [], 
  expenses = [], 
  orders = [], 
  employees = [],
  vehicles = [],
  period = 'Current Month' 
}) => {
  // Assets Calculations
  const cashFromSales = sales
    .filter(sale => sale.payment_method !== 'credit')
    .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  
  const accountsReceivable = sales
    .filter(sale => sale.payment_method === 'credit')
    .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  const vehicleAssets = vehicles.length * 50000; // Estimated vehicle value
  const totalCurrentAssets = cashFromSales + accountsReceivable;
  const totalFixedAssets = vehicleAssets;
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  // Liabilities Calculations
  const accountsPayable = orders
    .filter(order => order.status !== 'completed')
    .reduce((sum, order) => sum + ((order.total_amount || 0) - (order.amount_paid || 0)), 0);

  const payrollLiabilities = employees
    .filter(emp => emp.is_active !== false)
    .reduce((sum, emp) => sum + (emp.salary || 0), 0) * 0.3; // Estimated payroll taxes

  const totalCurrentLiabilities = accountsPayable + payrollLiabilities;
  const totalLiabilities = totalCurrentLiabilities;

  // Equity Calculations
  const retainedEarnings = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) - 
                          expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalEquity = retainedEarnings;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Balance Sheet
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              As of {new Date().toLocaleDateString()} • kabisakabisa enterprise
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Print />} variant="outlined" size="small">
              Print
            </Button>
            <Button startIcon={<FileDownload />} variant="outlined" size="small">
              Export
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Account</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* ASSETS */}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.dark' }}>
                  ASSETS
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'primary.light' }}></TableCell>
              </TableRow>

              {/* Current Assets */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, pl: 2 }}>Current Assets</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 4 }}>Cash and Cash Equivalents</TableCell>
                <TableCell align="right">{formatCurrency(cashFromSales)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 4 }}>Accounts Receivable</TableCell>
                <TableCell align="right">{formatCurrency(accountsReceivable)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, pl: 2, borderTop: 1, borderColor: 'divider' }}>
                  Total Current Assets
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, borderTop: 1, borderColor: 'divider' }}>
                  {formatCurrency(totalCurrentAssets)}
                </TableCell>
              </TableRow>

              {/* Fixed Assets */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, pl: 2, pt: 2 }}>Fixed Assets</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 4 }}>Vehicles and Equipment</TableCell>
                <TableCell align="right">{formatCurrency(vehicleAssets)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, pl: 2, borderTop: 1, borderColor: 'divider' }}>
                  Total Fixed Assets
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, borderTop: 1, borderColor: 'divider' }}>
                  {formatCurrency(totalFixedAssets)}
                </TableCell>
              </TableRow>

              {/* Total Assets */}
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  borderTop: 2, 
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}>
                  TOTAL ASSETS
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  borderTop: 2, 
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}>
                  {formatCurrency(totalAssets)}
                </TableCell>
              </TableRow>

              {/* Spacer */}
              <TableRow>
                <TableCell sx={{ py: 2 }}></TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* LIABILITIES */}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'error.light', color: 'error.dark' }}>
                  LIABILITIES
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'error.light' }}></TableCell>
              </TableRow>

              {/* Current Liabilities */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, pl: 2 }}>Current Liabilities</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 4 }}>Accounts Payable</TableCell>
                <TableCell align="right">{formatCurrency(accountsPayable)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 4 }}>Payroll Liabilities</TableCell>
                <TableCell align="right">{formatCurrency(payrollLiabilities)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, pl: 2, borderTop: 1, borderColor: 'divider' }}>
                  Total Current Liabilities
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, borderTop: 1, borderColor: 'divider' }}>
                  {formatCurrency(totalCurrentLiabilities)}
                </TableCell>
              </TableRow>

              {/* Total Liabilities */}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>
                  TOTAL LIABILITIES
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {formatCurrency(totalLiabilities)}
                </TableCell>
              </TableRow>

              {/* EQUITY */}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'success.light', color: 'success.dark', pt: 2 }}>
                  EQUITY
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'success.light', pt: 2 }}></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 4 }}>Retained Earnings</TableCell>
                <TableCell align="right">{formatCurrency(retainedEarnings)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                  TOTAL EQUITY
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(totalEquity)}
                </TableCell>
              </TableRow>

              {/* Total Liabilities and Equity */}
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  borderTop: 2, 
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}>
                  TOTAL LIABILITIES AND EQUITY
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  borderTop: 2, 
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}>
                  {formatCurrency(totalLiabilitiesAndEquity)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Balance Check */}
        <Box sx={{ mt: 3, p: 2, bgcolor: totalAssets === totalLiabilitiesAndEquity ? 'success.light' : 'error.light', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ 
            color: totalAssets === totalLiabilitiesAndEquity ? 'success.dark' : 'error.dark',
            fontWeight: 600
          }}>
            Balance Check: {totalAssets === totalLiabilitiesAndEquity ? '✓ Balanced' : '⚠ Not Balanced'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Assets must equal Liabilities + Equity
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default XeroBalanceSheet;