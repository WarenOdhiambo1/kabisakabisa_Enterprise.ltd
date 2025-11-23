import React, { useState } from 'react';
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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { Add, Edit, Delete, SwapHoriz, Inventory, History } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';

import { formatCurrency } from '../theme';
import StockForm from '../components/forms/StockForm';
import { stockAPI, branchesAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';

const StockPage = () => {
  const { branchId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [showHistoricalData, setShowHistoricalData] = useState(false);

  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: registerTransfer, handleSubmit: handleTransferSubmit, reset: resetTransfer } = useForm();

  // Queries - Use authenticated API services with error handling
  const { data: stock = [], isLoading: stockLoading } = useQuery(
    ['stock', branchId],
    () => branchId ? stockAPI.getByBranch(branchId).catch(() => []) : stockAPI.getAll().catch(() => []),
    { enabled: !!branchId, refetchInterval: 3600000, retry: false }
  );

  const { data: stockMovements = [], isLoading: movementsLoading } = useQuery(
    ['stockMovements', branchId],
    () => branchId ? api.get(`/stock/movements/${branchId}`).then(res => res.data).catch(() => []) : [],
    { enabled: !!branchId, refetchInterval: 3600000, retry: false }
  );

  // Filter pending transfers from stock movements
  const pendingTransfers = stockMovements.filter(transfer => transfer.status === 'pending');

  const { data: branches = [] } = useQuery(
    'branches',
    () => branchesAPI.getAll(),
    { retry: false }
  );

  const isLoading = stockLoading || movementsLoading;
  const error = null;

  // Mutations - Use authenticated API services
  const addStockMutation = useMutation(
    (data) => stockAPI.addStock(branchId, data),
    {
      onSuccess: () => {
        toast.success('Product added successfully!');
        setShowAddStock(false);
        reset();
        queryClient.invalidateQueries(['stock', branchId]);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to add product';
        toast.error(message);
        console.error('Add stock error:', error);
      }
    }
  );

  const updateStockMutation = useMutation(
    ({ id, data }) => stockAPI.updateStock(id, data),
    {
      onSuccess: () => {
        toast.success('Product updated successfully!');
        setEditingStock(null);
        setShowAddStock(false);
        reset();
        queryClient.invalidateQueries(['stock', branchId]);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to update product';
        toast.error(message);
        console.error('Update stock error:', error);
      }
    }
  );

  const deleteStockMutation = useMutation(
    (id) => stockAPI.deleteStock(id),
    {
      onSuccess: () => {
        toast.success('Product deleted successfully!');
        queryClient.invalidateQueries(['stock', branchId]);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to delete product';
        toast.error(message);
        console.error('Delete stock error:', error);
      }
    }
  );

  const transferStockMutation = useMutation(
    (data) => stockAPI.transfer(data),
    {
      onSuccess: () => {
        toast.success('Stock transfer initiated successfully!');
        setShowTransfer(false);
        resetTransfer();
        queryClient.invalidateQueries(['stockMovements', branchId]);
      },
      onError: (error) => {
        console.error('=== TRANSFER MUTATION ERROR ===');
        console.error('Error object:', error);
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Request config:', error.config);
        console.error('================================');
        
        const message = error.response?.data?.message || error.response?.data?.error || 'Failed to initiate transfer';
        toast.error(`Transfer failed: ${message}`);
      }
    }
  );

  const approveTransferMutation = useMutation(
    (transferId) => stockAPI.approveTransfer(transferId),
    {
      onSuccess: () => {
        toast.success('Transfer approved successfully!');
        queryClient.invalidateQueries(['stockMovements', branchId]);
        queryClient.invalidateQueries(['stock', branchId]);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to approve transfer';
        toast.error(message);
        console.error('Approve transfer error:', error);
      }
    }
  );

  const rejectTransferMutation = useMutation(
    (transferId) => stockAPI.rejectTransfer(transferId),
    {
      onSuccess: () => {
        toast.success('Transfer rejected successfully!');
        queryClient.invalidateQueries(['stockMovements', branchId]);
        queryClient.invalidateQueries(['stock', branchId]);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to reject transfer';
        toast.error(message);
        console.error('Reject transfer error:', error);
      }
    }
  );

  const onSubmit = (data) => {
    // Enhanced validation with sanitization
    if (!data.product_name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (data.quantity_available === undefined || data.quantity_available === null || data.quantity_available === '') {
      toast.error('Quantity is required');
      return;
    }
    if (!data.unit_price || isNaN(parseFloat(data.unit_price))) {
      toast.error('Valid unit price is required');
      return;
    }

    // Sanitize and validate numeric inputs
    const quantity = parseInt(data.quantity_available);
    const price = parseFloat(data.unit_price);
    const reorderLevel = parseInt(data.reorder_level) || 10;

    if (quantity < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }
    if (price <= 0) {
      toast.error('Unit price must be greater than 0');
      return;
    }
    if (reorderLevel < 0) {
      toast.error('Reorder level cannot be negative');
      return;
    }

    const cleanData = {
      product_name: data.product_name.trim().toLowerCase(),
      quantity_available: quantity,
      unit_price: price,
      reorder_level: reorderLevel
    };
    
    // Optional fields with sanitization
    if (data.product_id?.trim()) {
      cleanData.product_id = data.product_id.trim().toUpperCase();
    }

    if (editingStock) {
      updateStockMutation.mutate({ id: editingStock.id, data: cleanData });
    } else {
      addStockMutation.mutate(cleanData);
    }
  };

  const onSubmitTransfer = (data) => {
    // Enhanced validation with sanitization
    if (!data.product_id?.trim()) {
      toast.error('Please select a product to transfer');
      return;
    }
    if (!data.to_branch_id?.trim()) {
      toast.error('Please select destination branch');
      return;
    }
    
    const quantity = parseInt(data.quantity);
    if (!quantity || quantity <= 0 || isNaN(quantity)) {
      toast.error('Please enter a valid quantity (must be a positive number)');
      return;
    }

    // Check stock availability with enhanced validation
    const stockItem = stock.find(s => s.product_id === data.product_id.trim());
    if (!stockItem) {
      toast.error('Selected product not found in current branch stock');
      return;
    }
    if (stockItem.quantity_available < quantity) {
      toast.error(`Insufficient stock: Only ${stockItem.quantity_available} units available for transfer`);
      return;
    }
    if (data.to_branch_id === branchId) {
      toast.error('Cannot transfer to the same branch');
      return;
    }

    const transferData = {
      product_id: data.product_id.trim(),
      to_branch_id: data.to_branch_id.trim(),
      from_branch_id: branchId,
      quantity: quantity,
      reason: data.reason?.trim() || 'Stock transfer'
    };

    console.log('Submitting transfer data:', transferData);
    transferStockMutation.mutate(transferData);
  };

  const handleEdit = (stockItem) => {
    setEditingStock(stockItem);
    setValue('product_name', stockItem.product_name);
    setValue('product_id', stockItem.product_id);
    setValue('quantity_available', stockItem.quantity_available);
    setValue('unit_price', stockItem.unit_price);
    setValue('reorder_level', stockItem.reorder_level);
    setShowAddStock(true);
  };

  const handleCloseDialog = () => {
    setShowAddStock(false);
    setEditingStock(null);
    reset();
  };

  const lowStockItems = stock.filter(item => item.quantity_available <= item.reorder_level);
  const totalStockValue = stock.reduce((total, item) => total + (item.quantity_available * (item.unit_price || 0)), 0);

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
        <Typography color="error">Error loading stock data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 1, md: 4 }, mb: { xs: 1, md: 4 }, px: { xs: 0.5, sm: 1, md: 2 } }}>
      <Typography variant="h4" gutterBottom>
        Stock Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Inventory sx={{ fontSize: { xs: 30, md: 40 }, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Items
                  </Typography>
                  <Typography variant="h6">
                    {stock.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#ffe5d9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Stock Value
              </Typography>
              <Typography variant="h6">
                {formatCurrency(totalStockValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Low Stock Items
              </Typography>
              <Typography variant="h6" color="warning.main">
                {lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#ffe5d9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Pending Transfers
              </Typography>
              <Typography variant="h5" color="info.main">
                {pendingTransfers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowAddStock(true)}
        >
          Add Stock
        </Button>
        <Button
          variant="outlined"
          startIcon={<SwapHoriz />}
          onClick={() => setShowTransfer(true)}
        >
          Transfer Stock
        </Button>
        <Button
          variant="outlined"
          startIcon={<History />}
          onClick={() => setShowHistoricalData(true)}
          color="info"
        >
          Historical Data
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Current Stock" />
          <Tab label="Low Stock Alerts" />
          <Tab label="Pending Transfers" />
        </Tabs>
      </Box>

      {/* Current Stock Tab */}
      {activeTab === 0 && (
        <Card sx={{ backgroundColor: '#f6f4d2' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Stock
            </Typography>
            <TableContainer component={Paper} sx={{ overflowX: 'auto', '& .MuiTable-root': { minWidth: 650 } }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid rgba(224, 224, 224, 1)' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product ID</TableCell>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Reorder Level</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_id}</TableCell>
                      <TableCell>{(item.product_name || '').toLowerCase()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.quantity_available}
                          color={item.quantity_available <= item.reorder_level ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.unit_price ? formatCurrency(item.quantity_available * item.unit_price) : 'N/A'}</TableCell>
                      <TableCell>{item.reorder_level}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.quantity_available <= item.reorder_level ? 'Low Stock' : 'In Stock'}
                          color={item.quantity_available <= item.reorder_level ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(item)} size="small">
                          <Edit />
                        </IconButton>
                        <IconButton 
                          onClick={() => deleteStockMutation.mutate(item.id)} 
                          size="small" 
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Tab */}
      {activeTab === 1 && (
        <Card sx={{ backgroundColor: '#ffe5d9' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Low Stock Alerts
            </Typography>
            <TableContainer component={Paper} sx={{ overflowX: 'auto', '& .MuiTable-root': { minWidth: 400 } }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid rgba(224, 224, 224, 1)' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Reorder Level</TableCell>
                    <TableCell>Shortage</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{(item.product_name || '').toLowerCase()}</TableCell>
                      <TableCell>
                        <Chip label={item.quantity_available} color="error" size="small" />
                      </TableCell>
                      <TableCell>{item.reorder_level}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.reorder_level - item.quantity_available} 
                          color="warning" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleEdit(item)}
                        >
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Pending Transfers Tab */}
      {activeTab === 2 && (
        <Card sx={{ backgroundColor: '#f6f4d2' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Transfers
            </Typography>
            <TableContainer component={Paper} sx={{ overflowX: 'auto', '& .MuiTable-root': { minWidth: 500 } }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid rgba(224, 224, 224, 1)' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>From Branch</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Requested By</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>{transfer.product_name}</TableCell>
                      <TableCell>{transfer.from_branch_name}</TableCell>
                      <TableCell>{transfer.quantity}</TableCell>
                      <TableCell>{transfer.requested_by_name}</TableCell>
                      <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          onClick={() => approveTransferMutation.mutate(transfer.id)}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          onClick={() => rejectTransferMutation.mutate(transfer.id)}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Stock Dialog */}
      <Dialog open={showAddStock} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStock ? 'Edit Stock' : 'Add New Stock'}
        </DialogTitle>
        <DialogContent>
          <StockForm register={register} errors={{}} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={addStockMutation.isLoading || updateStockMutation.isLoading}
          >
            {addStockMutation.isLoading || updateStockMutation.isLoading ? 'Processing...' : (editingStock ? 'Update' : 'Add') + ' Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Stock Dialog */}
      <Dialog open={showTransfer} onClose={() => setShowTransfer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Stock</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Product *</InputLabel>
              <Select
                {...registerTransfer('product_id', { required: true })}
                label="Product"
              >
                {stock.map((item) => (
                  <MenuItem key={item.product_id} value={item.product_id}>
                    {(item.product_name || '').toLowerCase()} (Available: {item.quantity_available})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>To Branch *</InputLabel>
              <Select
                {...registerTransfer('to_branch_id', { required: true })}
                label="To Branch"
              >
                {branches.filter(b => b.id !== branchId).map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Quantity *"
              type="number"
              margin="normal"
              {...registerTransfer('quantity', { required: true, min: 1 })}
            />
            <TextField
              fullWidth
              label="Reason"
              multiline
              rows={3}
              margin="normal"
              {...registerTransfer('reason')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransfer(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              console.log('Transfer button clicked');
              try {
                handleTransferSubmit(onSubmitTransfer)();
              } catch (err) {
                console.error('Transfer submit error:', err);
              }
            }}
            variant="contained"
            disabled={transferStockMutation.isLoading}
          >
            Initiate Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Historical Data Viewer */}
      <Dialog 
        open={showHistoricalData}
        onClose={() => setShowHistoricalData(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Stock Historical Data</DialogTitle>
        <DialogContent>
          <Typography>Historical data not available</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistoricalData(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StockPage;