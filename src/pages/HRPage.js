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
import { Add, Edit, Delete, Payment, Email, People } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import QuickUpload from '../components/QuickUpload';
import { useForm } from 'react-hook-form';
import { hrAPI, branchesAPI, dataAPI } from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const HRPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showGeneratePayroll, setShowGeneratePayroll] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: registerPayroll, handleSubmit: handlePayrollSubmit, reset: resetPayroll } = useForm();

  // Queries
  const { data: pageData, isLoading, error } = useQuery(
    'hrPageData',
    () => dataAPI.getPageData('hr')
  );

  const employees = pageData?.employees || [];
  const payroll = pageData?.payroll || [];
  
  const { data: branches = [] } = useQuery('branches', () => branchesAPI.getAll());

  // Mutations
  const createEmployeeMutation = useMutation(
    (data) => hrAPI.createEmployee(data),
    {
      onSuccess: () => {
        toast.success('Employee created successfully!');
        setShowAddEmployee(false);
        reset();
        queryClient.invalidateQueries('hrPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create employee');
      }
    }
  );

  const updateEmployeeMutation = useMutation(
    ({ id, data }) => hrAPI.updateEmployee(id, data),
    {
      onSuccess: () => {
        toast.success('Employee updated successfully!');
        setEditingEmployee(null);
        setShowAddEmployee(false);
        reset();
        queryClient.invalidateQueries('hrPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update employee');
      }
    }
  );

  const deleteEmployeeMutation = useMutation(
    (id) => hrAPI.deleteEmployee(id),
    {
      onSuccess: () => {
        toast.success('Employee deactivated successfully!');
        queryClient.invalidateQueries('hrPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to deactivate employee');
      }
    }
  );

  const generatePayrollMutation = useMutation(
    (data) => hrAPI.generatePayroll(data),
    {
      onSuccess: () => {
        toast.success('Payroll generated successfully!');
        setShowGeneratePayroll(false);
        resetPayroll();
        queryClient.invalidateQueries('hrPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate payroll');
      }
    }
  );

  const sendPayslipsMutation = useMutation(
    (payrollIds) => hrAPI.sendPayslips(payrollIds),
    {
      onSuccess: () => {
        toast.success('Payslips sent successfully!');
        queryClient.invalidateQueries('hrPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send payslips');
      }
    }
  );

  const onSubmitEmployee = (data) => {
    const cleanData = {
      full_name: data.full_name?.trim(),
      email: data.email?.toLowerCase().trim(),
      phone: data.phone?.trim() || null,
      role: data.role,
      branch_id: data.branch_id || null,
      salary: data.salary ? parseFloat(data.salary) : null,
      hire_date: data.hire_date || null,
      is_active: data.is_active !== false
    };

    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data: cleanData });
    } else {
      cleanData.password = `${data.role}password123`;
      createEmployeeMutation.mutate(cleanData);
    }
  };

  const onSubmitPayroll = (data) => {
    generatePayrollMutation.mutate(data);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setValue('full_name', employee.full_name);
    setValue('email', employee.email);
    setValue('phone', employee.phone);
    setValue('role', employee.role);
    setValue('branch_id', employee.branch_id);
    setValue('salary', employee.salary);
    setValue('hire_date', employee.hire_date);
    setValue('is_active', employee.is_active);
    setShowAddEmployee(true);
  };

  const handleCloseEmployeeDialog = () => {
    setShowAddEmployee(false);
    setEditingEmployee(null);
    reset();
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

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.is_active).length;
  const totalSalaryExpense = employees
    .filter(emp => emp.is_active && emp.salary)
    .reduce((sum, emp) => sum + parseFloat(emp.salary || 0), 0);
  const pendingPayroll = payroll.filter(p => p.payment_status === 'pending').length;

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
        <Typography color="error">Error loading HR data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Human Resources Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Employees
                  </Typography>
                  <Typography variant="h5">
                    {totalEmployees}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Active Employees
              </Typography>
              <Typography variant="h5" color="success.main">
                {activeEmployees}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Monthly Salary Expense
              </Typography>
              <Typography variant="h5">
                {formatCurrency(totalSalaryExpense)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Pending Payroll
              </Typography>
              <Typography variant="h5" color="warning.main">
                {pendingPayroll}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowAddEmployee(true)}
        >
          Add Employee
        </Button>
        <Button
          variant="outlined"
          startIcon={<Payment />}
          onClick={() => setShowGeneratePayroll(true)}
        >
          Generate Payroll
        </Button>
        <QuickUpload defaultCategory="employee_documents" buttonText="Upload Employee Doc" />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Employees" />
          <Tab label="Payroll" />
          <Tab label="Reports" />
        </Tabs>
      </Box>

      {/* Employees Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Employee Management
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Salary</TableCell>
                    <TableCell>Hire Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => {
                    const employeeBranch = branches.find(b => b.id === employee.branch_id);
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.full_name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={employee.role.toUpperCase()}
                            color={getRoleColor(employee.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{employeeBranch?.branch_name || 'No Branch'}</TableCell>
                        <TableCell>{employee.salary ? formatCurrency(employee.salary) : 'N/A'}</TableCell>
                        <TableCell>{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={employee.is_active ? 'Active' : 'Inactive'}
                            color={employee.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditEmployee(employee)} size="small">
                            <Edit />
                          </IconButton>
                          <IconButton 
                            onClick={() => deleteEmployeeMutation.mutate(employee.id)}
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
      )}

      {/* Payroll Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Payroll Records
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Email />}
                onClick={() => {
                  const pendingIds = payroll
                    .filter(p => p.payment_status === 'pending')
                    .map(p => p.id);
                  if (pendingIds.length > 0) {
                    sendPayslipsMutation.mutate(pendingIds);
                  } else {
                    toast.info('No pending payroll to send');
                  }
                }}
                disabled={pendingPayroll === 0}
              >
                Send Payslips
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Gross Salary</TableCell>
                    <TableCell>Deductions</TableCell>
                    <TableCell>Net Salary</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Generated Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payroll.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.employee_name}</TableCell>
                      <TableCell>
                        {new Date(record.period_start).toLocaleDateString()} - {new Date(record.period_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{formatCurrency(record.gross_salary)}</TableCell>
                      <TableCell>{formatCurrency(record.deductions)}</TableCell>
                      <TableCell>{formatCurrency(record.net_salary)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={record.payment_status.toUpperCase()}
                          color={record.payment_status === 'paid' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Reports Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Employee Statistics
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees: {totalEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Employees: {activeEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inactive Employees: {totalEmployees - activeEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Salary: {formatCurrency(activeEmployees > 0 ? totalSalaryExpense / activeEmployees : 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Role Distribution
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Role</TableCell>
                        <TableCell>Count</TableCell>
                        <TableCell>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['admin', 'boss', 'manager', 'hr', 'sales', 'logistics'].map(role => {
                        const count = employees.filter(emp => emp.role === role).length;
                        const percentage = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : 0;
                        return (
                          <TableRow key={role}>
                            <TableCell>
                              <Chip 
                                label={role.toUpperCase()}
                                color={getRoleColor(role)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{count}</TableCell>
                            <TableCell>{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add/Edit Employee Dialog */}
      <Dialog open={showAddEmployee} onClose={handleCloseEmployeeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Full Name *"
              margin="normal"
              {...register('full_name', { required: true })}
            />
            <TextField
              fullWidth
              label="Email *"
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
              <InputLabel>Role *</InputLabel>
              <Select
                {...register('role', { required: true })}
                label="Role"
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
            {!editingEmployee && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Default password will be: [role]password123
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmployeeDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmitEmployee)}
            variant="contained"
            disabled={createEmployeeMutation.isLoading || updateEmployeeMutation.isLoading}
          >
            {editingEmployee ? 'Update' : 'Create'} Employee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Payroll Dialog */}
      <Dialog open={showGeneratePayroll} onClose={() => setShowGeneratePayroll(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Payroll</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Period Start *"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              {...registerPayroll('period_start', { required: true })}
            />
            <TextField
              fullWidth
              label="Period End *"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              {...registerPayroll('period_end', { required: true })}
            />
            <TextField
              fullWidth
              label="Deductions Percentage"
              type="number"
              step="0.01"
              margin="normal"
              defaultValue={15}
              helperText="Default: 15% (taxes, insurance, etc.)"
              {...registerPayroll('deductions_percentage')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGeneratePayroll(false)}>Cancel</Button>
          <Button 
            onClick={handlePayrollSubmit(onSubmitPayroll)}
            variant="contained"
            disabled={generatePayrollMutation.isLoading}
          >
            Generate Payroll
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HRPage;