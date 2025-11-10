import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import { Add, Edit, Delete, Business, Inventory, History } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import AccountingIntegration from '../components/AccountingIntegration';
import ReceiptCustomizer from '../components/ReceiptCustomizer';
import ReportsGenerator from '../components/ReportsGenerator';
import DocumentManager from '../components/DocumentManager';
import HistoricalDataViewer from '../components/HistoricalDataViewer';
import { useForm } from 'react-hook-form';
import { hrAPI, branchesAPI, stockAPI, adminAPI } from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const queryClient = useQueryClient();
  const [selectedBranchId] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Handle Xero callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const xeroStatus = urlParams.get('xero');
    
    if (xeroStatus === 'connected') {
      toast.success('Successfully connected to Xero!');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (xeroStatus === 'error') {
      toast.error('Failed to connect to Xero. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingBranch, setEditingBranch] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showHistoricalData, setShowHistoricalData] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      role: 'sales',
      is_active: true
    }
  });

  const { register: registerBranch, handleSubmit: handleSubmitBranch, reset: resetBranch, setValue: setValueBranch } = useForm();
  const { register: registerProduct, handleSubmit: handleSubmitProduct, reset: resetProduct, setValue: setValueProduct, watch: watchProduct } = useForm();

  const { data: pageData, isLoading } = useQuery(
    ['adminPageData', selectedBranchId],
    async () => {
      try {
        // Load data directly from APIs
        const [employeesData, branchesData] = await Promise.all([
          hrAPI.getEmployees().catch(() => []),
          branchesAPI.getAll().catch(() => [])
        ]);
        
        // Load stock data from all branches
        let allProducts = [];
        try {
          for (const branch of branchesData) {
            const branchStock = await stockAPI.getByBranch(branch.id).catch(() => []);
            allProducts = [...allProducts, ...branchStock];
          }
        } catch (err) {
          console.error('Failed to load stock data:', err);
        }
        
        return {
          employees: employeesData,
          branches: branchesData,
          products: allProducts
        };
      } catch (err) {
        console.error('Admin data loading failed:', err);
        return {
          employees: [],
          branches: [],
          products: []
        };
      }
    },
    {
      retry: false,
      staleTime: 5 * 60 * 1000
    }
  );

  const employees = pageData?.employees || [];
  const branches = pageData?.branches || [];
  const products = pageData?.products || [];

  const createUserMutation = useMutation(
    (data) => hrAPI.createEmployee(data),
    {
      onSuccess: () => {
        toast.success('User created successfully!');
        setShowAddUser(false);
        reset();
        queryClient.invalidateQueries(['adminPageData', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create user');
      }
    }
  );

  const updateUserMutation = useMutation(
    ({ id, data }) => hrAPI.updateEmployee(id, data),
    {
      onSuccess: () => {
        toast.success('User updated successfully!');
        setEditingUser(null);
        reset();
        queryClient.invalidateQueries(['adminPageData', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      }
    }
  );

  const deleteUserMutation = useMutation(
    (id) => hrAPI.deleteEmployee(id),
    {
      onSuccess: () => {
        toast.success('User deactivated successfully!');
        queryClient.invalidateQueries(['adminPageData', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to deactivate user');
      }
    }
  );

  const createBranchMutation = useMutation(
    (data) => branchesAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Branch created successfully!');
        setShowAddBranch(false);
        resetBranch();
        queryClient.invalidateQueries(['adminPageData', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create branch');
      }
    }
  );

  const updateBranchMutation = useMutation(
    ({ id, data }) => branchesAPI.update(id, data),
    {
      onSuccess: () => {
        toast.success('Branch updated successfully!');
        setEditingBranch(null);
        setShowAddBranch(false);
        resetBranch();
        queryClient.invalidateQueries(['adminPageData', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update branch');
      }
    }
  );

  const deleteBranchMutation = useMutation(
    (id) => branchesAPI.delete(id),
    {
      onSuccess: () => {
        toast.success('Branch deleted successfully!');
        queryClient.invalidateQueries(['adminPageData', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete branch');
      }
    }
  );

  const createProductMutation = useMutation(
    (data) => stockAPI.addStock(data.branch_id[0], data),
    {
      onSuccess: () => {
        toast.success('Product added successfully!');
        setShowAddProduct(false);
        resetProduct();
        queryClient.invalidateQueries(['adminPageData', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add product');
      }
    }
  );

  const updateProductMutation = useMutation(
    ({ id, data }) => stockAPI.updateStock(id, data),
    {
      onSuccess: () => {
        toast.success('Product updated successfully!');
        setEditingProduct(null);
        setShowAddProduct(false);
        resetProduct();
        queryClient.invalidateQueries(['adminPageData', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update product');
      }
    }
  );

  const deleteProductMutation = useMutation(
    (id) => stockAPI.deleteStock(id),
    {
      onSuccess: () => {
        toast.success('Product deleted successfully!');
        queryClient.invalidateQueries(['adminPageData', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    }
  );

  const onSubmit = (data) => {
    if (!data.full_name?.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!data.email?.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!data.role) {
      toast.error('Role is required');
      return;
    }
    
    const cleanData = {
      full_name: data.full_name.trim(),
      email: data.email.toLowerCase().trim(),
      role: data.role,
      is_active: data.is_active !== false
    };
    
    if (data.phone?.trim()) cleanData.phone = data.phone.trim();
    if (data.branch_id && data.branch_id !== '') cleanData.branch_id = data.branch_id;
    if (data.salary && data.salary !== '' && !isNaN(data.salary)) cleanData.salary = parseFloat(data.salary);
    if (data.hire_date) cleanData.hire_date = data.hire_date;
    
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: cleanData });
    } else {
      cleanData.password = `${data.role}Password123!`;
      createUserMutation.mutate(cleanData);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setValue('full_name', user.full_name);
    setValue('email', user.email);
    setValue('phone', user.phone);
    setValue('role', user.role);
    setValue('branch_id', user.branch_id);
    setValue('salary', user.salary);
    setValue('is_active', user.is_active);
    setShowAddUser(true);
  };

  const handleCloseDialog = () => {
    setShowAddUser(false);
    setEditingUser(null);
    reset();
  };

  const onSubmitBranch = (data) => {
    if (!data.branch_name?.trim()) {
      toast.error('Branch name is required');
      return;
    }
    
    const cleanData = {
      branch_name: data.branch_name.trim(),
      location_address: data.location_address?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || ''
    };
    
    if (editingBranch) {
      updateBranchMutation.mutate({ id: editingBranch.id, data: cleanData });
    } else {
      createBranchMutation.mutate(cleanData);
    }
  };

  const onSubmitProduct = (data) => {
    if (!data.product_name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!data.branch_id) {
      toast.error('Branch is required');
      return;
    }
    
    const cleanData = {
      product_name: data.product_name.trim(),
      unit_price: parseFloat(data.unit_price) || 0,
      quantity_available: parseInt(data.quantity_available) || 0,
      reorder_level: parseInt(data.reorder_level) || 10,
      branch_id: [data.branch_id] // Airtable link field format
    };
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: cleanData });
    } else {
      createProductMutation.mutate(cleanData);
    }
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setValueBranch('branch_name', branch.branch_name);
    setValueBranch('location_address', branch.location_address);
    setValueBranch('phone', branch.phone);
    setValueBranch('email', branch.email);
    setShowAddBranch(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setValueProduct('product_name', product.product_name);
    setValueProduct('unit_price', product.unit_price);
    setValueProduct('quantity_available', product.quantity_available);
    setValueProduct('reorder_level', product.reorder_level || 10);
    setValueProduct('branch_id', Array.isArray(product.branch_id) ? product.branch_id[0] : product.branch_id);
    setShowAddProduct(true);
  };

  const handleCloseBranchDialog = () => {
    setShowAddBranch(false);
    setEditingBranch(null);
    resetBranch();
  };

  const handleCloseProductDialog = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
    resetProduct();
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <div>Loading...</div>
      </Container>
    );
  }



  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', m: 0 }}>
          kabisakabisa enterprise - Admin Dashboard
        </Typography>
      </Box>

      {/* Quick Navigation */}
      <Card sx={{ mb: 4, bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
            System Navigation
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => window.open('/hr', '_blank')}
                sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
              >
                HR Management
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => window.open('/logistics', '_blank')}
                sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
              >
                Logistics
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => window.open('/orders', '_blank')}
                sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
              >
                Purchase Orders
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => window.open('/boss', '_blank')}
                sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
              >
                Boss Dashboard
              </Button>
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => window.location.href = 'https://www.xero.com/'}
                sx={{ color: '#13B5EA', borderColor: '#13B5EA' }}
              >
                Xero Accounting
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => window.open('/data', '_blank')}
                sx={{ color: '#607d8b', borderColor: '#607d8b' }}
              >
                Data Management
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowHistoricalData(true)}
                sx={{ color: '#795548', borderColor: '#795548' }}
              >
                Historical Data
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Users
                </Typography>
                <Typography variant="h5">
                  {employees.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {employees.filter(e => e.is_active).length} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Branches
                </Typography>
                <Typography variant="h5">
                  {branches.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Locations managed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Products
                </Typography>
                <Typography variant="h5">
                  {products.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In inventory
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  System Status
                </Typography>
                <Typography variant="h5" color="success.main">
                  Online
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All systems operational
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Users" />
          <Tab label="Branches" />
          <Tab label="Products" />
          <Tab label="Accounting" />
          <Tab label="Receipts" />
          <Tab label="Reports" />
          <Tab label="Documents" />
          <Tab label="Historical Data" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">User Management</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowAddUser(true)}
              >
                Add User
              </Button>
            </Box>
            
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.full_name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Chip label={employee.role} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.is_active ? 'Active' : 'Inactive'}
                        color={employee.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(employee)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => deleteUserMutation.mutate(employee.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Branch Management</Typography>
              <Button
                variant="contained"
                startIcon={<Business />}
                onClick={() => setShowAddBranch(true)}
              >
                Add Branch
              </Button>
            </Box>
            
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Branch Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>{branch.branch_name}</TableCell>
                    <TableCell>{branch.location_address}</TableCell>
                    <TableCell>{branch.phone}</TableCell>
                    <TableCell>{branch.email}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditBranch(branch)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => deleteBranchMutation.mutate(branch.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Product Management</Typography>
              <Button
                variant="contained"
                startIcon={<Inventory />}
                onClick={() => setShowAddProduct(true)}
              >
                Add Product
              </Button>
            </Box>
            
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const productBranch = branches.find(b => b.id === product.branch_id);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell>{productBranch?.branch_name || 'Unknown'}</TableCell>
                      <TableCell>{product.quantity_available}</TableCell>
                      <TableCell>{formatCurrency(product.unit_price)}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditProduct(product)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => deleteProductMutation.mutate(product.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && <AccountingIntegration />}
      {activeTab === 4 && <ReceiptCustomizer />}
      {activeTab === 5 && <ReportsGenerator />}
      {activeTab === 6 && <DocumentManager />}

      {activeTab === 7 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Historical Data Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<History />}
            onClick={() => setShowHistoricalData(true)}
          >
            Open Historical Data
          </Button>
        </Box>
      )}

      <Dialog open={showAddUser} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              margin="normal"
              {...register('full_name', { required: true })}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              {...register('email', { required: true })}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                {...register('role', { required: true })}
                label="Role"
                value={watch('role') || 'sales'}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="hr">HR</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="logistics">Logistics</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Branch</InputLabel>
              <Select
                {...register('branch_id')}
                label="Branch"
                value={watch('branch_id') || ''}
              >
                <MenuItem value="">No Branch</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAddBranch} onClose={handleCloseBranchDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Branch Name"
              margin="normal"
              {...registerBranch('branch_name', { required: true })}
            />
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={3}
              margin="normal"
              {...registerBranch('location_address')}
            />
            <TextField
              fullWidth
              label="Phone"
              margin="normal"
              {...registerBranch('phone')}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              {...registerBranch('email')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBranchDialog}>Cancel</Button>
          <Button onClick={handleSubmitBranch(onSubmitBranch)} variant="contained">
            {editingBranch ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAddProduct} onClose={handleCloseProductDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Branch</InputLabel>
              <Select
                {...registerProduct('branch_id', { required: true })}
                label="Branch"
                value={watchProduct('branch_id') || ''}
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Product Name"
              margin="normal"
              {...registerProduct('product_name', { required: true })}
            />
            <TextField
              fullWidth
              label="Quantity Available"
              type="number"
              margin="normal"
              {...registerProduct('quantity_available')}
            />
            <TextField
              fullWidth
              label="Unit Price"
              type="number"
              step="0.01"
              margin="normal"
              {...registerProduct('unit_price', { required: true })}
            />
            <TextField
              fullWidth
              label="Reorder Level"
              type="number"
              margin="normal"
              defaultValue={10}
              helperText="Minimum quantity before reorder alert"
              {...registerProduct('reorder_level')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog}>Cancel</Button>
          <Button onClick={handleSubmitProduct(onSubmitProduct)} variant="contained">
            {editingProduct ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <HistoricalDataViewer 
        open={showHistoricalData}
        onClose={() => setShowHistoricalData(false)}
        title="Historical Business Data"
      />
    </Container>
  );
};

export default AdminPage;