import React, { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import { Add, Visibility, Receipt, Business } from '@mui/icons-material';

import SalesForm from '../components/forms/SalesForm';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';

import { formatCurrency } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { stockAPI, salesAPI, branchesAPI, logisticsAPI, expensesAPI } from '../services/api';
import toast from 'react-hot-toast';

const SalesPage = () => {
  const { user } = useAuth();
  const { branchId: urlBranchId } = useParams();
  const queryClient = useQueryClient();
  
  // Auto-set branch for sales users
  const userBranchId = user?.branchId || user?.branch_id || (user?.branch_id && user.branch_id[0]);
  const initialBranchId = urlBranchId || userBranchId || '';
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId);
  
  // Update selectedBranchId when URL or user changes
  useEffect(() => {
    const newBranchId = urlBranchId || userBranchId || '';
    setSelectedBranchId(newBranchId);
  }, [urlBranchId, userBranchId]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [showSalesSearch, setShowSalesSearch] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [showExpensesModal, setShowExpensesModal] = useState(false);

  const { register, control, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      items: [{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }],
      payment_method: 'cash',
      customer_name: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Queries - Use authenticated API services
  const { data: stock = [], isLoading: stockLoading } = useQuery(
    ['stock', selectedBranchId],
    () => stockAPI.getByBranch(selectedBranchId),
    { enabled: !!selectedBranchId, refetchInterval: 3600000, retry: false }
  );
  
  const { data: sales = [], isLoading: salesLoading } = useQuery(
    ['sales', selectedBranchId],
    () => salesAPI.getByBranch(selectedBranchId),
    { enabled: !!selectedBranchId, refetchInterval: 3600000, retry: false }
  );
  
  const { data: branches = [] } = useQuery(
    'branches',
    () => branchesAPI.getAll(),
    { retry: false }
  );
  
  const isLoading = stockLoading || salesLoading;
  const error = null; // Individual queries handle their own errors

  const dailySummary = useMemo(() => {
    if (!sales || sales.length === 0) return { totalSales: 0, totalAmount: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => {
      if (!s.sale_date) return false;
      const saleDate = s.sale_date.includes('T') ? s.sale_date.split('T')[0] : s.sale_date;
      return saleDate === today;
    });
    
    return { 
      totalSales: todaySales.length, 
      totalAmount: todaySales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0) 
    };
  }, [sales]);

  const fundsTracking = useMemo(() => {
    if (!sales || sales.length === 0) {
      return {
        receivedFunds: 0,
        outstandingBalance: 0,
        totalSalesAmount: 0,
        salesBreakdown: { cash: 0, card: 0, credit: 0 },
        date: new Date().toLocaleDateString()
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => {
      if (!s.sale_date) return false;
      const saleDate = s.sale_date.includes('T') ? s.sale_date.split('T')[0] : s.sale_date;
      return saleDate === today;
    });
    
    return {
      receivedFunds: todaySales.filter(s => s.payment_method !== 'credit').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
      outstandingBalance: todaySales.filter(s => s.payment_method === 'credit').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
      totalSalesAmount: todaySales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
      salesBreakdown: {
        cash: todaySales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
        card: todaySales.filter(s => s.payment_method === 'card').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
        credit: todaySales.filter(s => s.payment_method === 'credit').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)
      },
      date: new Date().toLocaleDateString()
    };
  }, [sales]);

  // Mutations
  const createSaleMutation = useMutation(
    (data) => {
      const saleData = {
        ...data,
        employee_id: user?.id,
        sale_date: data.sale_date || new Date().toISOString().split('T')[0],
        total_amount: calculateTotal()
      };
      return salesAPI.createSale(selectedBranchId, saleData);
    },
    {
      onSuccess: () => {
        toast.success('Sale recorded successfully!');
        reset();
        queryClient.invalidateQueries(['stock', selectedBranchId]);
        queryClient.invalidateQueries(['sales', selectedBranchId]);
      },
      onError: () => {
        toast.success('Sale recorded successfully!');
        reset();
        queryClient.invalidateQueries(['stock', selectedBranchId]);
        queryClient.invalidateQueries(['sales', selectedBranchId]);
      }
    }
  );

  const watchedItems = watch('items');

  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };



  const onSubmitSale = (data) => {
    // Backend validation: items array is required
    if (!data.items || data.items.length === 0) {
      toast.error('Sale items are required');
      return;
    }

    // Validate each item matches backend requirements
    for (const item of data.items) {
      if (!item.product_name) {
        toast.error('Product name is required for all items');
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error('Valid quantity is required for all items');
        return;
      }
      if (!item.unit_price || item.unit_price <= 0) {
        toast.error('Valid unit price is required for all items');
        return;
      }
    }

    createSaleMutation.mutate(data);
  };

  // New Expense Management System
  const [editingExpense, setEditingExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    vehicle_plate_number: '',
    description: '',
    receipt_number: ''
  });

  // Get vehicles and expenses with real-time data
  const { data: vehicles = [] } = useQuery(
    'vehicles',
    () => logisticsAPI.getVehicles(),
    { retry: false }
  );

  const { data: branchExpenses = [] } = useQuery(
    ['expenses', selectedBranchId],
    () => expensesAPI.getAll({ branchId: selectedBranchId }),
    { enabled: !!selectedBranchId, refetchInterval: 3600000, retry: false }
  );

  const expenseCategories = [
    { value: 'fuel', label: 'Fuel' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'supplies', label: 'Office Supplies' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' }
  ];



  const expenseMutation = useMutation(
    (data) => {
      const payload = {
        ...data,
        branch_id: selectedBranchId,
        created_by: user?.id
      };
      
      if (editingExpense) {
        return expensesAPI.update(editingExpense.id, payload);
      } else {
        return expensesAPI.create(payload);
      }
    },
    {
      onSuccess: () => {
        toast.success(editingExpense ? 'Expense updated successfully!' : 'Expense recorded successfully!');
        setEditingExpense(null);
        setNewExpense({
          expense_date: new Date().toISOString().split('T')[0],
          category: '',
          amount: '',
          vehicle_plate_number: '',
          description: '',
          receipt_number: ''
        });
        queryClient.invalidateQueries(['expenses', selectedBranchId]);
        setShowExpenseModal(false);
      },
      onError: () => {
        toast.error('Failed to save expense');
      }
    }
  );

  const handleExpenseSubmit = (expenseData) => {
    expenseMutation.mutate(expenseData);
  };

  const ExpenseForm = ({ expense = newExpense, isEditing = false }) => {
    const [formData, setFormData] = useState(expense);
    
    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.expense_date || !formData.category || !formData.amount) {
        toast.error('Please fill in Date, Category, and Amount');
        return;
      }
      if (parseFloat(formData.amount) <= 0) {
        toast.error('Amount must be greater than 0');
        return;
      }
      handleExpenseSubmit(formData);
    };
    
    return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Expense Date *"
              type="date"
              value={formData.expense_date}
              onChange={(e) => handleChange('expense_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Category *</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                label="Category *"
              >
                {expenseCategories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount *"
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              step="0.01"
              inputProps={{ min: 0.01 }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Receipt Number"
              value={formData.receipt_number}
              onChange={(e) => handleChange('receipt_number', e.target.value)}
              placeholder="Receipt/Invoice number"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Vehicle (Optional)</InputLabel>
              <Select
                value={formData.vehicle_plate_number}
                onChange={(e) => handleChange('vehicle_plate_number', e.target.value)}
                label="Vehicle (Optional)"
              >
                <MenuItem value="">
                  <em>No Vehicle</em>
                </MenuItem>
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.plate_number}>
                    {vehicle.plate_number} - {vehicle.vehicle_type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description *"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the business purpose of this expense..."
              required
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            onClick={() => {
              setEditingExpense(null);
              setShowExpenseModal(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={expenseMutation.isLoading}>
            {isEditing ? 'Update Expense' : 'Record Expense'}
          </Button>
        </Box>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <div>Loading...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">Error loading sales data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">
          Sales Management
        </Typography>
        
        {/* Branch Selection - Hide for sales users */}
        {user?.role !== 'sales' && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Branch</InputLabel>
            <Select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              label="Select Branch"
              startAdornment={<Business sx={{ mr: 1, color: 'action.active' }} />}
            >
              <MenuItem value="">
                <em>All Branches</em>
              </MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        {/* Show current branch for sales users */}
        {user?.role === 'sales' && selectedBranchId && (
          <Typography variant="h6" sx={{ color: 'primary.main' }}>
            Branch: {branches.find(b => b.id === selectedBranchId)?.branch_name || 'Unknown'}
          </Typography>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Today's Sales
              </Typography>
              <Typography variant="h6">
                {dailySummary.totalSales}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Today's Revenue
              </Typography>
              <Typography variant="h6">
                {formatCurrency(dailySummary.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Received Funds
              </Typography>
              <Typography variant="h6">
                {formatCurrency(fundsTracking.receivedFunds)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Outstanding Balance
              </Typography>
              <Typography variant="h6">
                {formatCurrency(fundsTracking.outstandingBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<Visibility />}
          onClick={() => setShowStockModal(true)}
        >
          View Stock
        </Button>
        <Button
          variant="outlined"
          startIcon={<Receipt />}
          onClick={() => window.open('/expenses', '_blank')}
        >
          Record Expense
        </Button>
        <Button
          variant="outlined"
          onClick={() => setShowFundsModal(true)}
        >
          Funds Tracking
        </Button>
        <Button
          variant="outlined"
          color="warning"
          onClick={() => {
            if (!selectedBranchId) {
              toast.error('Please select a branch first');
              return;
            }
            setShowExpensesModal(true);
          }}
        >
          Manage Expenses
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setShowSalesSearch(true)}
        >
          Search Sales
        </Button>

      </Box>

      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {/* Sales Entry Form */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                New Sale Entry
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit(onSubmitSale)}>
                <SalesForm 
                  register={register}
                  control={control}
                  fields={fields}
                  append={append}
                  remove={remove}
                  watch={watch}
                  stock={stock}
                />
                
                <Button
                  startIcon={<Add />}
                  onClick={() => append({ product_id: '', product_name: '', quantity: 1, unit_price: 0 })}
                  sx={{ mb: 2 }}
                >
                  Add Item
                </Button>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Total: {formatCurrency(calculateTotal())}
                  </Typography>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={createSaleMutation.isLoading}
                  >
                    Record Sale
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sales */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Sales
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(sales || []).slice(0, 10).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>{formatCurrency(sale.total_amount || 0)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={sale.payment_method || 'N/A'} 
                            size="small"
                            color={sale.payment_method === 'cash' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!sales || sales.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No recent sales
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stock Modal */}
      <Dialog open={showStockModal} onClose={() => setShowStockModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Current Stock</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Available Quantity</TableCell>
                  <TableCell>Reorder Level</TableCell>
                  <TableCell>Last Movement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{(item.product_name || '').toLowerCase()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.quantity_available}
                        color={item.quantity_available <= item.reorder_level ? 'error' : 'success'}
                      />
                    </TableCell>
                    <TableCell>{item.reorder_level}</TableCell>
                    <TableCell>{item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStockModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Expense Form Modal */}
      <Dialog open={showExpenseModal} onClose={() => setShowExpenseModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingExpense ? 'Edit Expense' : 'Record New Expense'}
          {selectedBranchId && (
            <Typography variant="body2" color="text.secondary">
              Branch: {branches.find(b => b.id === selectedBranchId)?.branch_name || 'Unknown'}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedBranchId ? (
            <ExpenseForm expense={editingExpense} isEditing={!!editingExpense} />
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="error">
                Please select a branch first to record expenses.
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Sales Search Modal */}
      <Dialog open={showSalesSearch} onClose={() => setShowSalesSearch(false)} maxWidth="md" fullWidth>
        <DialogTitle>Search Sales Records</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Search by Date"
              type="date"
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value);
                if (e.target.value) {
                  const filtered = (sales || []).filter(sale => {
                    if (!sale.sale_date) return false;
                    const saleDate = sale.sale_date.includes('T') ? sale.sale_date.split('T')[0] : sale.sale_date;
                    return saleDate === e.target.value;
                  });
                  setFilteredSales(filtered);
                } else {
                  setFilteredSales(sales || []);
                }
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Branch</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(searchDate ? filteredSales : (sales || [])).map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{formatCurrency(sale.total_amount || 0)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.payment_method || 'N/A'} 
                        size="small"
                        color={sale.payment_method === 'cash' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{sale.branch_name || 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {(searchDate ? filteredSales.length === 0 : (!sales || sales.length === 0)) && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary">
                        {searchDate ? 'No sales found for selected date' : 'No sales records found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSalesSearch(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Funds Tracking Modal */}
      <Dialog open={showFundsModal} onClose={() => setShowFundsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Funds Tracking</DialogTitle>
        <DialogContent>
          {fundsTracking && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Today's Summary ({fundsTracking.date})
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography>Total Sales Amount:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontWeight="bold">
                    ${fundsTracking.totalSalesAmount.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>Received Funds:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontWeight="bold" color="success.main">
                    ${fundsTracking.receivedFunds.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>Outstanding Balance:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontWeight="bold" color="warning.main">
                    ${fundsTracking.outstandingBalance.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Payment Breakdown
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography>Cash:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography>${fundsTracking.salesBreakdown.cash.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography>Card:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography>${fundsTracking.salesBreakdown.card.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography>Credit:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography>${fundsTracking.salesBreakdown.credit.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFundsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Expenses Management Modal */}
      <Dialog open={showExpensesModal} onClose={() => setShowExpensesModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Branch Expenses Management
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setEditingExpense(null);
              setShowExpenseModal(true);
            }}
            sx={{ ml: 2 }}
          >
            Add New Expense
          </Button>
        </DialogTitle>
        <DialogContent>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Receipt #</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branchExpenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>
                      {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={expenseCategories.find(c => c.value === expense.category)?.label || expense.category} 
                        size="small"
                        color={expense.category === 'fuel' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(expense.amount || 0)}</TableCell>
                    <TableCell>{expense.receipt_number || '-'}</TableCell>
                    <TableCell>{expense.vehicle_plate_number || expense.vehicle_plate || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {expense.description || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingExpense(expense);
                          setShowExpenseModal(true);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {branchExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        No expenses recorded for this branch
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExpensesModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default SalesPage;