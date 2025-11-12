import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Grid,
  InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, Search, Business, Person } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const XeroContactsManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'customer',
    tax_number: '',
    credit_limit: 0
  });

  const queryClient = useQueryClient();

  // Fetch customers and suppliers from orders/sales
  const { data: sales = [] } = useQuery(
    'contacts-sales',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Sales`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: orders = [] } = useQuery(
    'contacts-orders',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Orders`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  // Extract unique customers and suppliers
  const customers = [...new Set(sales.map(sale => sale.customer_name).filter(Boolean))]
    .map(name => {
      const customerSales = sales.filter(sale => sale.customer_name === name);
      const totalSpent = customerSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const lastPurchase = customerSales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))[0];
      
      return {
        id: name,
        name,
        type: 'customer',
        total_spent: totalSpent,
        last_purchase: lastPurchase?.sale_date,
        transactions: customerSales.length,
        outstanding: customerSales.filter(sale => sale.payment_method === 'credit').reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
      };
    });

  const suppliers = [...new Set(orders.map(order => order.supplier_name).filter(Boolean))]
    .map(name => {
      const supplierOrders = orders.filter(order => order.supplier_name === name);
      const totalOrdered = supplierOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const lastOrder = supplierOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))[0];
      
      return {
        id: name,
        name,
        type: 'supplier',
        total_ordered: totalOrdered,
        last_order: lastOrder?.order_date,
        transactions: supplierOrders.length,
        outstanding: supplierOrders.reduce((sum, order) => sum + ((order.total_amount || 0) - (order.amount_paid || 0)), 0)
      };
    });

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddContact = () => {
    // In a real implementation, this would save to a Contacts table
    toast.success(`${newContact.type} contact would be added: ${newContact.name}`);
    setShowAddDialog(false);
    setNewContact({
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'customer',
      tax_number: '',
      credit_limit: 0
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Contacts Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Contact
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search contacts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<Person />} label={`Customers (${customers.length})`} />
        <Tab icon={<Business />} label={`Suppliers (${suppliers.length})`} />
      </Tabs>

      {/* Customers Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Directory
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer Name</TableCell>
                    <TableCell align="right">Total Spent</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell>Last Purchase</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ mr: 1, color: 'primary.main' }} />
                          {customer.name}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(customer.total_spent)}</TableCell>
                      <TableCell align="right">
                        <Typography color={customer.outstanding > 0 ? 'error.main' : 'text.primary'}>
                          {formatCurrency(customer.outstanding)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{customer.transactions}</TableCell>
                      <TableCell>
                        {customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={customer.outstanding > 0 ? 'Outstanding' : 'Good Standing'} 
                          color={customer.outstanding > 0 ? 'warning' : 'success'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => setEditingContact(customer)}>
                          <Edit />
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

      {/* Suppliers Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Supplier Directory
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Supplier Name</TableCell>
                    <TableCell align="right">Total Ordered</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell>Last Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Business sx={{ mr: 1, color: 'secondary.main' }} />
                          {supplier.name}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(supplier.total_ordered)}</TableCell>
                      <TableCell align="right">
                        <Typography color={supplier.outstanding > 0 ? 'error.main' : 'text.primary'}>
                          {formatCurrency(supplier.outstanding)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{supplier.transactions}</TableCell>
                      <TableCell>
                        {supplier.last_order ? new Date(supplier.last_order).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={supplier.outstanding > 0 ? 'Payment Due' : 'Paid Up'} 
                          color={supplier.outstanding > 0 ? 'error' : 'success'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => setEditingContact(supplier)}>
                          <Edit />
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

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Contact</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Name"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={newContact.address}
                onChange={(e) => setNewContact({...newContact, address: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tax Number"
                value={newContact.tax_number}
                onChange={(e) => setNewContact({...newContact, tax_number: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                value={newContact.credit_limit}
                onChange={(e) => setNewContact({...newContact, credit_limit: parseFloat(e.target.value) || 0})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddContact} variant="contained">Add Contact</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default XeroContactsManager;