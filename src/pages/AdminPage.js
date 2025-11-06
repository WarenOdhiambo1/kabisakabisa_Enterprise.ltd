import React, { useState } from 'react';
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
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { Add, Edit, Delete, Business, Inventory, AccountBalance } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import AccountingIntegration from '../components/AccountingIntegration';
import ReceiptCustomizer from '../components/ReceiptCustomizer';
import ReportsGenerator from '../components/ReportsGenerator';
import DocumentManager from '../components/DocumentManager';
import { useForm } from 'react-hook-form';
import { hrAPI, branchesAPI, stockAPI, adminAPI, dataAPI } from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
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

  // Queries
  const { data: pageData, isLoading, error } = useQuery(
    'adminPageData',
    () => {
      console.log('Fetching admin page data');
      return dataAPI.getPageData('admin');
    }
  );

  const employees = pageData?.employees || [];
  const branches = pageData?.branches || [];
  const products = pageData?.products || [];
  const overview = pageData?.overview || {};
  
  console.log('Admin page data:', { employees: employees.length, branches: branches.length, products: products.length });

  // Mutations
  const createUserMutation = useMutation(
    (data) => {
      console.log('Creating user with data:', data);
      return hrAPI.createEmployee(data);
    },
    {
      onSuccess: (response) => {
        console.log('User created successfully:', response);
        toast.success('User created successfully!');
        setShowAddUser(false);
        reset();
        queryClient.invalidateQueries('adminPageData');
      },
      onError: (error) => {
        console.error('Create user error:', error);
        const message = error.response?.data?.message || error.message || 'Failed to create user';
        toast.error(message);
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
        queryClient.invalidateQueries('adminPageData');
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
        queryClient.invalidateQueries('adminPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to deactivate user');
      }
    }
  );

  // Branch mutations
  const createBranchMutation = useMutation(
    (data) => branchesAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Branch created successfully!');
        setShowAddBranch(false);
        resetBranch();
        queryClient.invalidateQueries('adminPageData');
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
        queryClient.invalidateQueries('adminPageData');
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
        queryClient.invalidateQueries('adminPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete branch');
      }
    }
  );

  // Product mutations
  const createProductMutation = useMutation(
    (data) => adminAPI.createProduct(data),
    {
      onSuccess: () => {
        toast.success('Product added successfully!');
        setShowAddProduct(false);
        resetProduct();
        queryClient.invalidateQueries('adminPageData');
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
        queryClient.invalidateQueries('adminPageData');
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
        queryClient.invalidateQueries('adminPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    }
  );

  const onSubmit = (data) => {
    console.log('Form submission data:', data);
    
    // Validate required fields
    if (!data.full_name?.trim() || !data.email?.trim() || !data.role) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Clean and validate data
    const cleanData = {
      full_name: data.full_name.trim(),
      email: data.email.toLowerCase().trim(),
      role: data.role,
      is_active: data.is_active !== false
    };
    
    // Add optional fields only if they have values
    if (data.phone?.trim()) cleanData.phone = data.phone.trim();
    if (data.branch_id && data.branch_id !== '') cleanData.branch_id = data.branch_id;
    if (data.salary && data.salary !== '' && !isNaN(data.salary)) cleanData.salary = parseFloat(data.salary);
    if (data.hire_date) cleanData.hire_date = data.hire_date;
    
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: cleanData });
    } else {
      // Add password for new users
      cleanData.password = `${data.role}password123`;
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
    const cleanData = {
      branch_name: data.branch_name?.trim(),
      location_address: data.location_address?.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.toLowerCase().trim() || null,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null
    };
    
    if (editingBranch) {
      updateBranchMutation.mutate({ id: editingBranch.id, data: cleanData });
    } else {
      createBranchMutation.mutate(cleanData);
    }
  };

  const onSubmitProduct = (data) => {
    const cleanData = {
      product_name: data.product_name?.trim(),
      unit_price: parseFloat(data.unit_price) || 0,
      reorder_level: parseInt(data.reorder_level) || 10
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
    setValueProduct('product_id', product.product_id);
    setValueProduct('quantity_available', product.quantity_available);
    setValueProduct('unit_price', product.unit_price);
    setValueProduct('reorder_level', product.reorder_level);
    setValueProduct('branch_id', product.branch_id);
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

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      boss: 'secondary',
      manager: 'primary',
      hr: 'info',
      sales: 'success',
      logistics: 'warning'
    };
    return colors[role] || 'default';
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
        <Typography color="error">Error loading admin data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Users" />
          <Tab label="Branches" />
          <Tab label="Products" />
          <Tab label="Accounting" />
          <Tab label="Receipts" />
          <Tab label="Reports" />
          <Tab label="Documents" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowAddUser(true)}
            >
              Add New User
            </Button>
          </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Users
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((user) => {
                  const userBranch = branches.find(b => b.id === user.branch_id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role.toUpperCase()} 
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {userBranch?.branch_name || 'No Branch'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.is_active ? 'Active' : 'Inactive'}
                          color={user.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleEdit(user)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          size="small"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Business />}
              onClick={() => setShowAddBranch(true)}
            >
              Add New Branch
            </Button>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Branches
              </Typography>
              
              <TableContainer component={Paper}>
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
                          <IconButton 
                            onClick={() => handleEditBranch(branch)}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton 
                            onClick={() => deleteBranchMutation.mutate(branch.id)}
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
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Inventory />}
              onClick={() => setShowAddProduct(true)}
            >
              Add New Product
            </Button>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Product ID</TableCell>
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
                          <TableCell>{product.product_id}</TableCell>
                          <TableCell>{productBranch?.branch_name || 'Unknown'}</TableCell>
                          <TableCell>{product.quantity_available}</TableCell>
                          <TableCell>{formatCurrency(product.unit_price)}</TableCell>
                          <TableCell>
                            <IconButton 
                              onClick={() => handleEditProduct(product)}
                              size="small"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton 
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              size="small"
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 3 && (
        <AccountingIntegration />
      )}

      {activeTab === 4 && (
        <ReceiptCustomizer />
      )}

      {activeTab === 5 && (
        <ReportsGenerator />
      )}

      {activeTab === 6 && (
        <DocumentManager />
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={showAddUser} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
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
            <TextField
              fullWidth
              label="Phone"
              margin="normal"
              {...register('phone')}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                {...register('role', { required: true })}
                label="Role"
                value={watch('role') || 'sales'}
              >
                <MenuItem value="boss">Boss</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
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
            <TextField
              fullWidth
              label="Salary"
              type="number"
              margin="normal"
              {...register('salary')}
            />
            <TextField
              fullWidth
              label="Hire Date"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              {...register('hire_date')}
            />
            {!editingUser && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Default password will be: {watch('role') || 'role'}password123
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
          >
            {editingUser ? 'Update' : 'Create'} User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Branch Dialog */}
      <Dialog open={showAddBranch} onClose={handleCloseBranchDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBranch ? 'Edit Branch' : 'Add New Branch'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
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
              {...registerBranch('location_address', { required: true })}
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
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              step="any"
              margin="normal"
              {...registerBranch('latitude')}
            />
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              step="any"
              margin="normal"
              {...registerBranch('longitude')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBranchDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitBranch(onSubmitBranch)}
            variant="contained"
            disabled={createBranchMutation.isLoading || updateBranchMutation.isLoading}
          >
            {editingBranch ? 'Update' : 'Create'} Branch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddProduct} onClose={handleCloseProductDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Branch *</InputLabel>
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
              label="Product ID"
              margin="normal"
              placeholder="Auto-generated if empty"
              {...registerProduct('product_id')}
            />
            <TextField
              fullWidth
              label="Product Name *"
              margin="normal"
              {...registerProduct('product_name', { required: true })}
            />
            <TextField
              fullWidth
              label="Quantity Available *"
              type="number"
              margin="normal"
              {...registerProduct('quantity_available', { required: true, min: 0 })}
            />
            <TextField
              fullWidth
              label="Unit Price *"
              type="number"
              step="0.01"
              margin="normal"
              {...registerProduct('unit_price', { required: true, min: 0 })}
            />
            <TextField
              fullWidth
              label="Reorder Level"
              type="number"
              margin="normal"
              defaultValue={10}
              {...registerProduct('reorder_level')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitProduct(onSubmitProduct)}
            variant="contained"
            disabled={createProductMutation.isLoading || updateProductMutation.isLoading}
          >
            {editingProduct ? 'Update' : 'Add'} Product
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;