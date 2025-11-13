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
import HistoricalDataViewer from '../components/HistoricalDataViewer';
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

  // Queries - Fetch from both Stock and Stock_Movements tables
  const { data: stock = [], isLoading: stockLoading } = useQuery(
    ['stock', branchId],
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock`)
      .then(res => res.ok ? res.json() : []).catch(() => [])
      .then(data => branchId ? data.filter(item => {
        const itemBranchId = Array.isArray(item.branch_id) ? item.branch_id[0] : item.branch_id;
        return itemBranchId === branchId;
      }) : data),
    { enabled: !!branchId, refetchInterval: 30000, retry: false }
  );

  const { data: stockMovements = [], isLoading: movementsLoading } = useQuery(
    ['stockMovements', branchId],
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock_Movements`)
      .then(res => res.ok ? res.json() : []).catch(() => [])
      .then(data => branchId ? data.filter(movement => {
        const fromBranchId = Array.isArray(movement.from_branch_id) ? movement.from_branch_id[0] : movement.from_branch_id;
        const toBranchId = Array.isArray(movement.to_branch_id) ? movement.to_branch_id[0] : movement.to_branch_id;
        return fromBranchId === branchId || toBranchId === branchId;
      }) : data),
    { enabled: !!branchId, refetchInterval: 30000, retry: false }
  );

  // Filter pending transfers from stock movements
  const pendingTransfers = stockMovements.filter(transfer => transfer.status === 'pending');

  const { data: branches = [] } = useQuery(
    'branches',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Branches`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  const isLoading = stockLoading || movementsLoading;
  const error = null;

  // Mutations
  const addStockMutation = useMutation(
    (data) => {
      return fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/stock/branch/${branchId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(data)
      }).then(res => res.json());
    },
    {
      onSuccess: () => {
        toast.success('Stock added successfully!');
        setShowAddStock(false);
        reset();
        queryClient.invalidateQueries(['stock', branchId]);
      },
      onError: () => {
        toast.error('Failed to add stock');
      }
    }
  );

  const updateStockMutation = useMutation(
    ({ id, data }) => {
      const updateData = {
        ...data,
        last_updated: new Date().toISOString()
      };
      return fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      }).then(res => res.json());
    },
    {
      onSuccess: () => {
        toast.success('Stock updated successfully!');
        setEditingStock(null);
        setShowAddStock(false);
        reset();
        queryClient.invalidateQueries(['stock', branchId]);
      },
      onError: () => {
        toast.error('Failed to update stock');
      }
    }
  );

  const deleteStockMutation = useMutation(
    (id) => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock/${id}`, {
      method: 'DELETE'
    }),
    {
      onSuccess: () => {
        toast.success('Stock deleted successfully!');
        queryClient.invalidateQueries(['stock', branchId]);
      },
      onError: () => {
        toast.error('Failed to delete stock');
      }
    }
  );

  const transferStockMutation = useMutation(
    (data) => {
      const transferData = {
        ...data,
        movement_type: 'transfer',
        movement_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      };
      return fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock_Movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      }).then(res => res.json());
    },
    {
      onSuccess: () => {
        toast.success('Stock transfer initiated successfully!');
        setShowTransfer(false);
        resetTransfer();
        queryClient.invalidateQueries(['transfers', branchId]);
      },
      onError: () => {
        toast.error('Failed to initiate transfer');
      }
    }
  );

  const approveTransferMutation = useMutation(
    (transferId) => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock_Movements/${transferId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    }).then(res => res.json()),
    {
      onSuccess: () => {
        toast.success('Transfer approved successfully!');
        queryClient.invalidateQueries(['transfers', branchId]);
      },
      onError: () => {
        toast.error('Failed to approve transfer');
      }
    }
  );

  const rejectTransferMutation = useMutation(
    (transferId) => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock_Movements/${transferId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    }).then(res => res.json()),
    {
      onSuccess: () => {
        toast.success('Transfer rejected successfully!');
        queryClient.invalidateQueries(['transfers', branchId]);
      },
      onError: () => {
        toast.error('Failed to reject transfer');
      }
    }
  );

  const onSubmit = (data) => {
    // Validate required fields
    if (!data.product_name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!data.quantity_available || data.quantity_available < 0) {
      toast.error('Valid quantity is required');
      return;
    }
    if (!data.unit_price || data.unit_price <= 0) {
      toast.error('Unit price is required and must be greater than 0');
      return;
    }

    const cleanData = {
      product_name: data.product_name.trim(),
      product_id: data.product_id?.trim(),
      quantity_available: parseInt(data.quantity_available),
      unit_price: parseFloat(data.unit_price),
      reorder_level: parseInt(data.reorder_level) || 10
    };

    if (editingStock) {
      updateStockMutation.mutate({ id: editingStock.id, data: cleanData });
    } else {
      addStockMutation.mutate(cleanData);
    }
  };

  const onSubmitTransfer = (data) => {
    // Validate transfer data
    if (!data.product_id) {
      toast.error('Please select a product to transfer');
      return;
    }
    if (!data.to_branch_id) {
      toast.error('Please select destination branch');
      return;
    }
    if (!data.quantity || data.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    // Check stock availability
    const stockItem = stock.find(s => s.product_id === data.product_id);
    if (!stockItem) {
      toast.error('Selected product not found in stock');
      return;
    }
    if (stockItem.quantity_available < data.quantity) {
      toast.error(`Only ${stockItem.quantity_available} units available for transfer`);
      return;
    }

    transferStockMutation.mutate({
      ...data,
      from_branch_id: branchId,
      quantity: parseInt(data.quantity)
    });
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
          <Card>
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
          <Card>
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
          <Card>
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
          <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Product ID"
              margin="normal"
              {...register('product_id')}
              placeholder="Auto-generated if empty"
            />
            <TextField
              fullWidth
              label="Product Name *"
              margin="normal"
              {...register('product_name', { required: true })}
            />
            <TextField
              fullWidth
              label="Quantity Available *"
              type="number"
              margin="normal"
              {...register('quantity_available', { required: true, min: 0 })}
            />
            <TextField
              fullWidth
              label="Unit Price *"
              type="number"
              step="0.01"
              margin="normal"
              {...register('unit_price', { required: true, min: 0 })}
            />
            <TextField
              fullWidth
              label="Reorder Level"
              type="number"
              margin="normal"
              defaultValue={10}
              {...register('reorder_level')}
            />
          </Box>
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
            onClick={handleTransferSubmit(onSubmitTransfer)}
            variant="contained"
            disabled={transferStockMutation.isLoading}
          >
            Initiate Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Historical Data Viewer */}
      <HistoricalDataViewer 
        open={showHistoricalData}
        onClose={() => setShowHistoricalData(false)}
        title="Stock Historical Data"
      />
    </Container>
  );
};

export default StockPage;