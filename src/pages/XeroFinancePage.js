import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,

  LinearProgress,
  Menu
} from '@mui/material';

import { useQuery } from 'react-query';
import { formatCurrency } from '../theme';
import { genericDataAPI, expensesAPI } from '../services/api';
import { verifyFinanceDataLinkage, formatVerificationReport } from '../utils/financeDataVerification';
import XeroProfitLossReport from '../components/XeroProfitLossReport';
import XeroBalanceSheet from '../components/XeroBalanceSheet';

const XeroFinancePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Print functionality
  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Financial Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric { border: 1px solid #ddd; padding: 15px; text-align: center; }
            .metric h3 { margin: 0; color: #333; }
            .metric p { margin: 5px 0 0 0; font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4caf50; color: white; }
            .positive { color: #4caf50; }
            .negative { color: #f44336; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Financial Management Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="metrics">
            <div class="metric">
              <h3>Total Revenue</h3>
              <p>${formatCurrency(monthlyRevenue)}</p>
            </div>
            <div class="metric">
              <h3>Total Expenses</h3>
              <p>${formatCurrency(monthlyExpenses)}</p>
            </div>
            <div class="metric">
              <h3>Net Profit</h3>
              <p class="${netProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(netProfit)}</p>
            </div>
            <div class="metric">
              <h3>Fueling Expenses</h3>
              <p>${formatCurrency(fuelingExpenses)}</p>
            </div>
          </div>
          <h2>Financial Breakdown</h2>
          <table>
            <tr><th>Category</th><th>Amount</th></tr>
            <tr><td>Total Revenue</td><td>${formatCurrency(monthlyRevenue)}</td></tr>
            <tr><td>Operating Expenses</td><td>${formatCurrency(monthlyExpenses)}</td></tr>
            <tr><td>Payroll Expenses</td><td>${formatCurrency(payrollExpenses)}</td></tr>
            <tr><td>Fueling Expenses</td><td>${formatCurrency(fuelingExpenses)}</td></tr>
            <tr><td>Maintenance Expenses</td><td>${formatCurrency(maintenanceExpenses)}</td></tr>
            <tr><td><strong>Net Profit</strong></td><td class="${netProfit >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(netProfit)}</strong></td></tr>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Export functionality
  const handleExport = () => {

    // Create CSV content
    const csvContent = [
      ['Financial Report', new Date().toLocaleDateString()],
      [''],
      ['Summary'],
      ['Total Revenue', monthlyRevenue],
      ['Total Expenses', monthlyExpenses + payrollExpenses],
      ['Net Profit', netProfit],
      ['Fueling Expenses', fuelingExpenses],
      ['Profit Margin %', profitMargin.toFixed(2)],
      [''],
      ['Expense Breakdown'],
      ['Operating Expenses', monthlyExpenses],
      ['Payroll Expenses', payrollExpenses],
      ['Fueling Expenses', fuelingExpenses],
      ['Maintenance Expenses', maintenanceExpenses]
    ].map(row => row.join(',')).join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      alert('Please fill in amount and description');
      return;
    }

    try {
      const data = {
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category: newTransaction.category || 'General',
        expense_date: newTransaction.date,
        created_at: new Date().toISOString()
      };

      await expensesAPI.create(data);
      alert('Expense added successfully!');
      setShowNewTransaction(false);
      setNewTransaction({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      window.location.reload();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    }
  };


  // Fetch all financial tables using authenticated API
  const { data: sales = [], isLoading: salesLoading } = useQuery(
    'finance-sales',
    () => genericDataAPI.getAll('Sales').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: expenses = [] } = useQuery(
    'finance-expenses', 
    () => genericDataAPI.getAll('Expenses').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: payroll = [] } = useQuery(
    'finance-payroll',
    () => genericDataAPI.getAll('Payroll').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: orders = [] } = useQuery(
    'finance-orders',
    () => genericDataAPI.getAll('Orders').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: employees = [] } = useQuery(
    'finance-employees',
    () => genericDataAPI.getAll('Employees').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: invoices = [] } = useQuery(
    'finance-invoices',
    () => genericDataAPI.getAll('Invoices').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: stock = [] } = useQuery(
    'finance-stock',
    () => genericDataAPI.getAll('Stock').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: vehicles = [] } = useQuery(
    'finance-vehicles',
    () => genericDataAPI.getAll('Vehicles').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: trips = [] } = useQuery(
    'finance-trips',
    () => genericDataAPI.getAll('Trips').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: branches = [] } = useQuery(
    'finance-branches',
    () => genericDataAPI.getAll('Branches').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: saleItems = [] } = useQuery(
    'finance-sale-items',
    () => genericDataAPI.getAll('Sale_Items').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: orderItems = [] } = useQuery(
    'finance-order-items',
    () => genericDataAPI.getAll('Order_Items').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: stockMovements = [] } = useQuery(
    'finance-stock-movements',
    () => genericDataAPI.getAll('Stock_Movements').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: bankAccounts = [] } = useQuery(
    'finance-bank-accounts',
    () => genericDataAPI.getAll('Bank_Accounts').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: chartOfAccounts = [] } = useQuery(
    'finance-chart-accounts',
    () => genericDataAPI.getAll('Chart_of_Accounts').catch(() => []),
    { refetchInterval: 30000, retry: false }
  );



  // Real financial calculations from database
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Revenue from sales only
  const monthlyRevenue = sales
    .filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    })
    .reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);

  // All expenses from expenses table including fueling and maintenance
  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.expense_date || expense.created_at);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  // Fueling expenses from expenses table
  const fuelingExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.expense_date || expense.created_at);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear &&
             (expense.category?.toLowerCase().includes('fuel') || expense.category?.toLowerCase().includes('gas'));
    })
    .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  // Maintenance expenses from expenses table
  const maintenanceExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.expense_date || expense.created_at);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear &&
             expense.category?.toLowerCase().includes('maintenance');
    })
    .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  // Payroll expenses
  const payrollExpenses = payroll
    .filter(pay => {
      const payDate = new Date(pay.period_start || pay.created_at);
      return payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear;
    })
    .reduce((sum, pay) => sum + (parseFloat(pay.net_salary) || 0), 0);

  // Simple profit calculation
  const netProfit = monthlyRevenue - monthlyExpenses - payrollExpenses;
  const profitMargin = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0;
  const cashFlow = monthlyRevenue - monthlyExpenses - payrollExpenses;

  const isLoading = salesLoading;

  // Verify database linkages when data is loaded
  React.useEffect(() => {
    if (!isLoading && sales.length > 0) {
      const allData = {
        sales, expenses, payroll, orders, employees, invoices,
        stock, vehicles, trips, branches, saleItems, orderItems,
        stockMovements, bankAccounts, chartOfAccounts
      };
      const verification = verifyFinanceDataLinkage(allData);
      formatVerificationReport(verification);
    }
  }, [isLoading, sales, expenses, payroll, orders, employees, invoices, stock, vehicles, trips, branches, saleItems, orderItems, stockMovements, bankAccounts, chartOfAccounts]);

  // Simple dashboard cards
  const DashboardCard = ({ title, amount }) => (
    <Card sx={{ height: '100%', bgcolor: '#f9fafb' }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px' }}>
          {formatCurrency(amount)}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 1, sm: 2 }, mb: 2, px: { xs: 2, sm: 1 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '20px' }}>
            Financial Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
            Complete business financial overview
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" size="small" onClick={() => setShowNewTransaction(true)}>
            Add
          </Button>
          <Button variant="outlined" size="small" onClick={handlePrint}>
            Print
          </Button>
          <Button variant="outlined" size="small" onClick={handleExport}>
            Export
          </Button>
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Dashboard" sx={{ fontSize: '14px' }} />
          <Tab label="Reports" sx={{ fontSize: '14px' }} />
          <Tab label="Transactions" sx={{ fontSize: '14px' }} />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Key Metrics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={6} md={3}>
              <DashboardCard
                title="Total Revenue"
                amount={monthlyRevenue}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <DashboardCard
                title="Total Expenses"
                amount={monthlyExpenses + payrollExpenses}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <DashboardCard
                title="Net Profit"
                amount={netProfit}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <DashboardCard
                title="Cash Flow"
                amount={cashFlow}
              />
            </Grid>
          </Grid>

          {/* Logistics Summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ fontSize: '16px', fontWeight: 600, mb: 2 }}>
                    Financial Breakdown
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Total Revenue</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(monthlyRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Operating Expenses</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(monthlyExpenses)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Payroll</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(payrollExpenses)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Fueling Expenses</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(fuelingExpenses)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Maintenance</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(maintenanceExpenses)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600 }}>Net Profit</Typography>
                    <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, color: netProfit >= 0 ? 'success.main' : 'error.main' }}>
                      {formatCurrency(netProfit)} ({profitMargin.toFixed(1)}%)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ fontSize: '16px', fontWeight: 600, mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Button variant="outlined" size="small" fullWidth sx={{ mb: 1, fontSize: '12px' }} onClick={() => setShowNewTransaction(true)}>
                    Add Transaction
                  </Button>
                  <Button variant="outlined" size="small" fullWidth sx={{ mb: 1, fontSize: '12px' }} onClick={() => setActiveTab(1)}>
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>


        </Box>
      )}

      {/* Reports Tab */}
      {activeTab === 1 && (
        <Box>
          {/* Report Selection */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Profit & Loss</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Revenue and expense breakdown
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    View Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Balance Sheet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Assets, liabilities, and equity
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    View Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Cash Flow</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Money in and out over time
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    View Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Reports */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <XeroProfitLossReport 
                sales={sales} 
                expenses={expenses}
                invoices={invoices}
                trips={trips}
                employees={employees}
                payroll={payroll}
                orders={orders}
                saleItems={saleItems}
                orderItems={orderItems}
                stockMovements={stockMovements}
                period="Current Month"
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <XeroBalanceSheet 
                sales={sales}
                expenses={expenses}
                orders={orders}
                employees={employees}
                vehicles={vehicles}
                invoices={invoices}
                stock={stock}
                trips={trips}
                payroll={payroll}
                branches={branches}
                bankAccounts={bankAccounts}
                chartOfAccounts={chartOfAccounts}
                stockMovements={stockMovements}
                period="Current Month"
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Transactions Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ fontSize: '16px', fontWeight: 600 }}>Transactions</Typography>
              <Button variant="contained" size="small" onClick={() => setShowNewTransaction(true)}>
                Add
              </Button>
            </Box>
            
            {/* Transaction Summary */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>Total Income</Typography>
                    <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {formatCurrency(monthlyRevenue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>Total Expenses</Typography>
                    <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {formatCurrency(monthlyExpenses)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>Net Profit</Typography>
                    <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {formatCurrency(netProfit)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>Cash Flow</Typography>
                    <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {formatCurrency(cashFlow)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <TableContainer component={Paper}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #e0e0e0' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell align="right" sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.slice(0, 20).map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.expense_date || expense.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>Expense</TableCell>
                      <TableCell>{expense.description || 'Expense'}</TableCell>
                      <TableCell align="right">
                        <Typography color="error.main">
                          {formatCurrency(expense.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>{expense.category || 'General'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}



      {/* New Transaction Dialog */}
      <Dialog open={showNewTransaction} onClose={() => setShowNewTransaction(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  label="Category"
                >
                  <MenuItem value="Office Supplies">Office Supplies</MenuItem>
                  <MenuItem value="Travel">Travel</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="Utilities">Utilities</MenuItem>
                  <MenuItem value="Rent">Rent</MenuItem>
                  <MenuItem value="Insurance">Insurance</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Fuel">Fuel</MenuItem>
                  <MenuItem value="Equipment">Equipment</MenuItem>
                  <MenuItem value="Professional Services">Professional Services</MenuItem>
                  <MenuItem value="Training">Training</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewTransaction(false)}>Cancel</Button>
          <Button onClick={handleAddTransaction} variant="contained">Add Transaction</Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          Print Report
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          Export Data
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          Settings
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default XeroFinancePage;