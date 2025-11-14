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
import { Add, Edit, Delete, Business, Inventory } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';


import { useForm } from 'react-hook-form';
import { hrAPI, branchesAPI, stockAPI, genericDataAPI } from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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


  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      role: 'sales',
      is_active: true
    }
  });

  const { register: registerBranch, handleSubmit: handleSubmitBranch, reset: resetBranch, setValue: setValueBranch } = useForm();
  const { register: registerProduct, handleSubmit: handleSubmitProduct, reset: resetProduct, setValue: setValueProduct, watch: watchProduct } = useForm();

  // Direct database queries for real-time data
  const { data: employees = [], isLoading: employeesLoading } = useQuery(
    'admin-employees',
    () => hrAPI.getEmployees(),
    { refetchInterval: 30000, retry: false }
  );

  const { data: branches = [], isLoading: branchesLoading } = useQuery(
    'admin-branches',
    () => branchesAPI.getAll(),
    { refetchInterval: 30000, retry: false }
  );

  const { data: products = [], isLoading: productsLoading } = useQuery(
    'admin-stock',
    () => stockAPI.getAll(),
    { refetchInterval: 30000, retry: false }
  );

  const { data: sales = [] } = useQuery(
    'admin-sales',
    () => genericDataAPI.getAll('Sales'),
    { refetchInterval: 30000, retry: false }
  );

  const { data: expenses = [] } = useQuery(
    'admin-expenses',
    () => genericDataAPI.getAll('Expenses'),
    { refetchInterval: 30000, retry: false }
  );



  const isLoading = employeesLoading || branchesLoading || productsLoading;

  // Calculate real-time metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const lowStockItems = products.filter(item => (parseFloat(item.quantity_available) || 0) <= (parseFloat(item.reorder_level) || 10));

  const createUserMutation = useMutation(
    (data) => hrAPI.createEmployee(data),
    {
      onSuccess: () => {
        toast.success('User created successfully!');
        setShowAddUser(false);
        reset();
        queryClient.invalidateQueries('admin-employees');
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
        queryClient.invalidateQueries('admin-employees');
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
        queryClient.invalidateQueries('admin-employees');
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
        queryClient.invalidateQueries('admin-branches');
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
        queryClient.invalidateQueries('admin-branches');
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
        queryClient.invalidateQueries('admin-branches');
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
        queryClient.invalidateQueries('admin-stock');
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
        queryClient.invalidateQueries('admin-stock');
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
        queryClient.invalidateQueries('admin-stock');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    }
  );

  const onSubmit = (data) => {
    // Enhanced admin form validation
    if (!data.full_name?.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (data.full_name.trim().length < 2) {
      toast.error('Full name must be at least 2 characters');
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
    
    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = data.email.toLowerCase().trim();
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (email.length > 254) {
      toast.error('Email address is too long');
      return;
    }
    
    // Phone validation if provided
    if (data.phone?.trim()) {
      const phoneRegex = /^[+]?[0-9\s\-()]{10,15}$/;
      if (!phoneRegex.test(data.phone.trim())) {
        toast.error('Please enter a valid phone number');
        return;
      }
    }
    
    // Salary validation
    if (data.salary && (isNaN(parseFloat(data.salary)) || parseFloat(data.salary) < 0)) {
      toast.error('Salary must be a valid positive number');
      return;
    }
    
    const cleanData = {
      full_name: data.full_name.trim().replace(/\s+/g, ' '),
      email: email,
      role: data.role,
      is_active: data.is_active !== false
    };
    
    // Add optional fields with validation
    if (data.phone?.trim()) {
      cleanData.phone = data.phone.trim().replace(/\s+/g, '');
    }
    if (data.branch_id && data.branch_id !== '') {
      cleanData.branch_id = data.branch_id;
    }
    if (data.salary && !isNaN(parseFloat(data.salary))) {
      cleanData.salary = Math.round(parseFloat(data.salary) * 100) / 100;
    }
    if (data.hire_date) {
      cleanData.hire_date = data.hire_date;
    }
    
    // Enhanced password handling
    if (data.password && data.password.trim()) {
      const password = data.password.trim();
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        return;
      }
      
      if (editingUser) {
        cleanData.new_password = password;
      } else {
        cleanData.password = password;
      }
    } else if (!editingUser && ['admin', 'boss'].includes(user?.role)) {
      toast.error('Password is required for new users');
      return;
    }
    
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: cleanData });
    } else {
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
    setValue('password', ''); // Clear password field for editing
    setShowAddUser(true);
  };

  const handleCloseDialog = () => {
    setShowAddUser(false);
    setEditingUser(null);
    reset();
  };

  const onSubmitBranch = (data) => {
    // Enhanced branch validation
    if (!data.branch_name?.trim()) {
      toast.error('Branch name is required');
      return;
    }
    if (data.branch_name.trim().length < 2) {
      toast.error('Branch name must be at least 2 characters');
      return;
    }
    
    // Email validation if provided
    if (data.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        toast.error('Please enter a valid email address');
        return;
      }
    }
    
    // Phone validation if provided
    if (data.phone?.trim()) {
      const phoneRegex = /^[+]?[0-9\s\-()]{10,15}$/;
      if (!phoneRegex.test(data.phone.trim())) {
        toast.error('Please enter a valid phone number');
        return;
      }
    }
    
    const cleanData = {
      branch_name: data.branch_name.trim().replace(/\s+/g, ' '),
      location_address: data.location_address?.trim() || '',
      phone: data.phone?.trim().replace(/\s+/g, '') || '',
      email: data.email?.trim().toLowerCase() || ''
    };
    
    if (editingBranch) {
      updateBranchMutation.mutate({ id: editingBranch.id, data: cleanData });
    } else {
      createBranchMutation.mutate(cleanData);
    }
  };

  const onSubmitProduct = (data) => {
    // Enhanced product validation
    if (!data.product_name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (data.product_name.trim().length < 2) {
      toast.error('Product name must be at least 2 characters');
      return;
    }
    if (!data.branch_id) {
      toast.error('Branch is required');
      return;
    }
    
    // Validate numeric fields
    const unitPrice = parseFloat(data.unit_price) || 0;
    const quantity = parseInt(data.quantity_available) || 0;
    const reorderLevel = parseInt(data.reorder_level) || 10;
    
    if (unitPrice < 0) {
      toast.error('Unit price cannot be negative');
      return;
    }
    if (quantity < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }
    if (reorderLevel < 0) {
      toast.error('Reorder level cannot be negative');
      return;
    }
    
    const cleanData = {
      product_name: data.product_name.trim().toLowerCase(),
      unit_price: Math.round(unitPrice * 100) / 100,
      quantity_available: quantity,
      reorder_level: reorderLevel,
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
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
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
          <Grid container spacing={{ xs: 1, sm: 2 }}>
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
                onClick={() => window.location.href = '/logistics'}
                sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
              >
                Logistics
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => window.location.href = '/orders'}
                sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
              >
                Purchase Orders
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => window.location.href = '/boss'}
                sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
              >
                Boss Dashboard
              </Button>
            </Grid>
          </Grid>
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => window.location.href = '/finance'}
                sx={{ color: '#13B5EA', borderColor: '#13B5EA' }}
              >
                Xero Accounting
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => window.location.href = '/data'}
                sx={{ color: '#607d8b', borderColor: '#607d8b' }}
              >
                Data Management
              </Button>
            </Grid>

          </Grid>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
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
                  {lowStockItems.length} low stock
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
                <Typography variant="h5" color={netProfit >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(netProfit)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Net profit this period
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
                  <TableCell>Reorder Level</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const branchId = Array.isArray(product.branch_id) ? product.branch_id[0] : product.branch_id;
                  const productBranch = branches.find(b => b.id === branchId);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell>{productBranch?.branch_name || 'No Branch'}</TableCell>
                      <TableCell>{product.quantity_available}</TableCell>
                      <TableCell>{product.reorder_level || 10}</TableCell>
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
            {/* Only show password field for admin/boss */}
            {(['admin', 'boss'].includes(user?.role)) && (
              <TextField
                fullWidth
                label={editingUser ? "New Password (leave blank to keep current)" : "Password *"}
                type="password"
                margin="normal"
                helperText={editingUser ? "Only fill if you want to change the password" : "Minimum 8 characters required"}
                {...register('password', editingUser ? {} : { required: 'Password is required for new users', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
                required={!editingUser}
              />
            )}
            {(['hr', 'admin', 'boss'].includes(user?.role)) && !editingUser && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                ℹ️ {user?.role === 'admin' || user?.role === 'boss' ? 'Admin can create users with passwords.' : 'HR can create employee records. Admin will set the password later.'}
              </Typography>
            )}
            <TextField
              fullWidth
              label="Phone"
              margin="normal"
              {...register('phone')}
            />
            <TextField
              fullWidth
              label="Salary"
              type="number"
              margin="normal"
              {...register('salary')}
            />
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


    </Container>
  );
};

export default AdminPage;