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
  Chip,
  LinearProgress,
  Menu
} from '@mui/material';
import {
  Receipt,
  TrendingUp,
  AccountBalance,
  Settings,
  Add,
  FileDownload,
  Print,
  Visibility,
  MonetizationOn,
  PieChart,
  BarChart,
  Timeline
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { formatCurrency } from '../theme';
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

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      alert('Please fill in amount and description');
      return;
    }

    try {
      const endpoint = newTransaction.type === 'expense' ? 'Expenses' : 'Sales';
      const data = newTransaction.type === 'expense' ? {
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category: newTransaction.category || 'General',
        expense_date: newTransaction.date
      } : {
        total_amount: parseFloat(newTransaction.amount),
        customer_name: 'Manual Entry',
        sale_date: newTransaction.date,
        payment_method: 'cash'
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert(`${newTransaction.type} added successfully!`);
        setShowNewTransaction(false);
        setNewTransaction({
          type: 'expense',
          amount: '',
          description: '',
          category: '',
          date: new Date().toISOString().split('T')[0]
        });
        // Refresh data
        window.location.reload();
      } else {
        alert(`Failed to add ${newTransaction.type}`);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Error adding transaction');
    }
  };


  // Fetch all financial tables from database
  const { data: sales = [], isLoading: salesLoading } = useQuery(
    'finance-sales',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Sales`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: expenses = [] } = useQuery(
    'finance-expenses',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Expenses`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: payroll = [] } = useQuery(
    'finance-payroll',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Payroll`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: orders = [] } = useQuery(
    'finance-orders',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Orders`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );





  const { data: employees = [] } = useQuery(
    'xero-employees',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Employees`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );



  const { data: invoices = [] } = useQuery(
    'xero-invoices',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Invoices`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );



  const { data: stock = [] } = useQuery(
    'xero-stock',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: vehicles = [] } = useQuery(
    'xero-vehicles',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Vehicles`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: trips = [] } = useQuery(
    'xero-trips',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Trips`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );



  // Financial calculations from real data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate logistics revenue from trips first
  const logisticsRevenue = trips
    .filter(trip => {
      const tripDate = new Date(trip.trip_date || trip.created_at);
      return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
    })
    .reduce((sum, trip) => sum + (parseFloat(trip.amount_charged) || 0), 0);

  // Calculate total monthly revenue from all sources
  const salesRevenue = sales
    .filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    })
    .reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);

  const invoiceRevenue = invoices
    .filter(invoice => {
      const invoiceDate = new Date(invoice.invoice_date || invoice.created_at);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear && invoice.status === 'paid';
    })
    .reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0);

  const monthlyRevenue = salesRevenue + invoiceRevenue + logisticsRevenue;

  // Calculate all expenses including payroll
  const regularExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.expense_date || expense.created_at);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  const payrollExpenses = payroll
    .filter(pay => {
      const payDate = new Date(pay.pay_date || pay.created_at);
      return payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear;
    })
    .reduce((sum, pay) => sum + (parseFloat(pay.net_pay) || 0), 0);

  const monthlyExpenses = regularExpenses + payrollExpenses;

  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  // Calculate receivables from both sales and invoices
  const salesReceivables = sales
    .filter(sale => sale.payment_method === 'credit')
    .reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
  
  const invoiceReceivables = invoices
    .filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled')
    .reduce((sum, invoice) => sum + (parseFloat(invoice.balance_due) || 0), 0);
  
  const totalReceivables = salesReceivables + invoiceReceivables;

  const totalPayables = orders
    .filter(order => order.status !== 'completed' && order.status !== 'paid')
    .reduce((sum, order) => sum + ((parseFloat(order.total_amount) || 0) - (parseFloat(order.amount_paid) || 0)), 0);



  const cashFlow = monthlyRevenue - monthlyExpenses;

  const isLoading = salesLoading;

  // Simple dashboard cards
  const DashboardCard = ({ title, amount, icon }) => (
    <Card sx={{ height: '100%', bgcolor: '#f9fafb' }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon}
          <Typography variant="body2" sx={{ ml: 1, fontSize: '14px', fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
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
          <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setShowNewTransaction(true)}>
            Add
          </Button>
          <Button variant="outlined" size="small" startIcon={<FileDownload />}>
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
                icon={<MonetizationOn sx={{ fontSize: 20 }} />}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <DashboardCard
                title="Total Expenses"
                amount={monthlyExpenses}
                icon={<Receipt sx={{ fontSize: 20 }} />}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <DashboardCard
                title="Net Profit"
                amount={monthlyProfit}
                icon={<TrendingUp sx={{ fontSize: 20 }} />}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <DashboardCard
                title="Cash Flow"
                amount={cashFlow}
                icon={<AccountBalance sx={{ fontSize: 20 }} />}
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
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Sales</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(salesRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Logistics</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(logisticsRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Invoices</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(invoiceRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Expenses</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(regularExpenses)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>Payroll</Typography>
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                          {formatCurrency(payrollExpenses)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="body1" sx={{ fontSize: '14px' }}>Net Position</Typography>
                    <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                      {formatCurrency(monthlyProfit)}
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

          {/* Outstanding Amounts */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: '#f9fafb' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>
                    Receivables
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 600 }}>
                    {formatCurrency(totalReceivables)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '12px' }} color="text.secondary">
                    Outstanding payments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: '#f9fafb' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>
                    Payables
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 600 }}>
                    {formatCurrency(totalPayables)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '12px' }} color="text.secondary">
                    Outstanding supplier payments
                  </Typography>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PieChart sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Profit & Loss</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Revenue and expense breakdown
                  </Typography>
                  <Button variant="outlined" fullWidth startIcon={<Visibility />}>
                    View Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BarChart sx={{ mr: 2, color: 'success.main' }} />
                    <Typography variant="h6">Balance Sheet</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Assets, liabilities, and equity
                  </Typography>
                  <Button variant="outlined" fullWidth startIcon={<Visibility />}>
                    View Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Timeline sx={{ mr: 2, color: 'info.main' }} />
                    <Typography variant="h6">Cash Flow</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Money in and out over time
                  </Typography>
                  <Button variant="outlined" fullWidth startIcon={<Visibility />}>
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
              <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setShowNewTransaction(true)}>
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
                      {formatCurrency(monthlyProfit)}
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...sales.slice(0, 10).map(sale => ({
                    id: sale.id,
                    date: sale.sale_date || sale.created_at,
                    type: 'Income',
                    description: `Sale - ${sale.customer_name || 'Walk-in'}`,
                    amount: sale.total_amount,
                    category: 'Sales Revenue'
                  })), ...expenses.slice(0, 10).map(expense => ({
                    id: expense.id,
                    date: expense.expense_date || expense.created_at,
                    type: 'Expense',
                    description: expense.description || 'Expense',
                    amount: expense.amount,
                    category: expense.category || 'General'
                  }))].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.type} 
                          color={transaction.type === 'Income' ? 'success' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell align="right">
                        <Typography color={transaction.type === 'Income' ? 'success.main' : 'error.main'}>
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Transaction Type"
                value={newTransaction.type}
                onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                SelectProps={{ native: true }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </TextField>
            </Grid>
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
            {newTransaction.type === 'expense' && (
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
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewTransaction(false)}>Cancel</Button>
          <Button onClick={handleAddTransaction} variant="contained">Add Transaction</Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Print sx={{ mr: 1 }} /> Print Report
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <FileDownload sx={{ mr: 1 }} /> Export Data
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Settings sx={{ mr: 1 }} /> Settings
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default XeroFinancePage;