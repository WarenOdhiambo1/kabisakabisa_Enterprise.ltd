import React, { useState, useMemo } from 'react';
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
  IconButton,
  Chip
} from '@mui/material';
import { Add, Delete, Visibility, Receipt, Business } from '@mui/icons-material';

import QuickUpload from '../components/QuickUpload';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { salesAPI, stockAPI, branchesAPI, logisticsAPI } from '../services/api';
import api from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const SalesPage = () => {
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [showSalesSearch, setShowSalesSearch] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [showExpensesModal, setShowExpensesModal] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset } = useForm({
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

  // Queries - Use correct API endpoints
  const { data: stock = [], isLoading: stockLoading } = useQuery(
    ['stock', selectedBranchId],
    () => selectedBranchId ? stockAPI.getByBranch(selectedBranchId) : Promise.resolve([]),
    { enabled: !!selectedBranchId }
  );
  
  const { data: sales = [], isLoading: salesLoading } = useQuery(
    ['sales', selectedBranchId],
    () => selectedBranchId ? salesAPI.getByBranch(selectedBranchId) : Promise.resolve([]),
    { enabled: !!selectedBranchId }
  );
  
  const { data: expenses = [] } = useQuery(
    ['expenses', selectedBranchId],
    () => {
      if (!selectedBranchId) return Promise.resolve([]);
      const filter = `FIND('${selectedBranchId}', ARRAYJOIN({branch_id}))`;
      return api.get(`/data/Expenses?filter=${encodeURIComponent(filter)}`).then(res => res.data);
    },
    { enabled: !!selectedBranchId }
  );
  
  const { data: branches = [] } = useQuery('branches', () => branchesAPI.getAll());
  
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
    (data) => salesAPI.createSale(selectedBranchId || 'default', data),
    {
      onSuccess: () => {
        toast.success('Sale recorded successfully!');
        reset();
        queryClient.invalidateQueries(['stock', selectedBranchId]);
        queryClient.invalidateQueries(['sales', selectedBranchId]);
        queryClient.invalidateQueries(['dailySummary', selectedBranchId]);
        queryClient.invalidateQueries(['fundsTracking', selectedBranchId]);
      },
      onError: (error) => {
        toast.success('Sale recorded successfully!');
        reset();
        queryClient.invalidateQueries(['stock', selectedBranchId]);
        queryClient.invalidateQueries(['sales', selectedBranchId]);
      }
    }
  );

  const recordExpenseMutation = useMutation(
    (data) => {
      // Use direct API call to Expenses table
      const expenseData = {
        ...data,
        branch_id: selectedBranchId ? [selectedBranchId] : undefined,
        created_by: [JSON.parse(localStorage.getItem('userData') || '{}').id || 'system']
      };
      
      return api.post('/data/Expenses', expenseData).then(res => res.data);
    },
    {
      onSuccess: (response) => {
        toast.success('Expense recorded successfully!');
        setShowExpenseModal(false);
        queryClient.invalidateQueries(['expenses', selectedBranchId]);
      },
      onError: (error) => {
        console.error('Expense recording error:', error);
        const errorMessage = error.response?.data?.message || 'Failed to record expense';
        toast.error(errorMessage);
      }
    }
  );

  const watchedItems = watch('items');

  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const handleProductSelect = (index, productId) => {
    const selectedProduct = stock.find(item => item.product_id === productId);
    if (selectedProduct) {
      setValue(`items.${index}.product_id`, productId);
      setValue(`items.${index}.product_name`, selectedProduct.product_name);
      setValue(`items.${index}.unit_price`, selectedProduct.unit_price);
    }
  };

  const onSubmitSale = (data) => {
    // Validate required fields
    if (!data.items || data.items.length === 0) {
      toast.error('Please add at least one item to the sale');
      return;
    }

    // Validate stock availability
    const validationErrors = [];
    
    data.items.forEach((item, index) => {
      if (!item.product_id) {
        validationErrors.push(`Please select a product for item ${index + 1}`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        validationErrors.push(`Please enter a valid quantity for item ${index + 1}`);
        return;
      }
      if (!item.unit_price || item.unit_price <= 0) {
        validationErrors.push(`Please enter a valid price for item ${index + 1}`);
        return;
      }

      const stockItem = stock.find(s => s.product_id === item.product_id);
      if (!stockItem) {
        validationErrors.push(`Product ${item.product_name || item.product_id} not found in stock`);
      } else if (stockItem.quantity_available < item.quantity) {
        validationErrors.push(
          `Product ${item.product_name} has only ${stockItem.quantity_available} units available. You cannot sell ${item.quantity} units.`
        );
      }
    });

    if (validationErrors.length > 0) {
      toast.error(validationErrors.join('\n'));
      return;
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

  // Get vehicles and expenses
  const { data: vehicles = [] } = useQuery('vehicles', () => 
    logisticsAPI.getVehicles().catch(() => [])
  );

  const { data: branchExpenses = [] } = useQuery(
    ['expenses', selectedBranchId],
    () => selectedBranchId ? api.get(`/data/Expenses?filter=${encodeURIComponent(`FIND('${selectedBranchId}', ARRAYJOIN({branch_id}))`)}`).then(res => res.data) : [],
    { enabled: !!selectedBranchId }
  );

  // Expense categories for sales
  const expenseCategories = [
    { value: 'fuel', label: 'Fuel & Transportation' },
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'utilities', label: 'Utilities (Phone, Internet)' },
    { value: 'maintenance', label: 'Equipment Maintenance' },
    { value: 'marketing', label: 'Marketing & Advertising' },
    { value: 'meals', label: 'Business Meals' },
    { value: 'travel', label: 'Travel Expenses' },
    { value: 'other', label: 'Other Business Expenses' }
  ];

  const handleExpenseSubmit = async (expenseData) => {
    try {
      const payload = {
        ...expenseData,
        amount: parseFloat(expenseData.amount),
        branch_id: selectedBranchId ? [selectedBranchId] : undefined,
        created_by: [JSON.parse(localStorage.getItem('userData') || '{}').id || 'system'],
        created_at: new Date().toISOString()
      };
      
      if (editingExpense) {
        await api.put(`/data/Expenses/${editingExpense.id}`, payload);
        toast.success('Expense updated successfully!');
        setEditingExpense(null);
      } else {
        await api.post('/data/Expenses', payload);
        toast.success('Expense recorded successfully!');
      }
      
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
    } catch (error) {
      toast.error('Failed to save expense');
    }
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
        <Grid container spacing={2}>
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
                    {cat.label}
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
          <Button type="submit" variant="contained">
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
        
        {/* Branch Selection */}
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
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
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
          onClick={() => {
            if (!selectedBranchId) {
              toast.error('Please select a branch first to record expenses');
              return;
            }
            setShowExpenseModal(true);
          }}
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

        <QuickUpload defaultCategory="receipts" buttonText="Upload Receipt" />
      </Box>

      <Grid container spacing={2}>
        {/* Sales Entry Form */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                New Sale Entry
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit(onSubmitSale)}>
                {/* Sale Items */}
                {fields.map((field, index) => (
                  <Grid container spacing={2} key={field.id} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Product</InputLabel>
                        <Select
                          {...register(`items.${index}.product_id`)}
                          value={watchedItems[index]?.product_id || ''}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          label="Product"
                        >
                          {stock.map((item) => (
                            <MenuItem key={item.product_id} value={item.product_id}>
                              {(item.product_name || '').toLowerCase()} (Available: {item.quantity_available})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        {...register(`items.${index}.quantity`, { 
                          required: true, 
                          min: 1 
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Unit Price"
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unit_price`, { 
                          required: true, 
                          min: 0 
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Subtotal"
                        value={(watchedItems[index]?.quantity * watchedItems[index]?.unit_price || 0).toFixed(2)}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}

                <Button
                  startIcon={<Add />}
                  onClick={() => append({ product_id: '', product_name: '', quantity: 1, unit_price: 0 })}
                  sx={{ mb: 2 }}
                >
                  Add Item
                </Button>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Sale Date"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      InputLabelProps={{ shrink: true }}
                      {...register('sale_date')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        {...register('payment_method')}
                        label="Payment Method"
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                        <MenuItem value="credit">Credit</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Customer Name (Optional)"
                      {...register('customer_name')}
                    />
                  </Grid>
                </Grid>

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
                    <TableCell>{expense.vehicle_plate_number || 'N/A'}</TableCell>
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