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
  Tab,
  InputAdornment,
  Divider,
  Alert,
  Tooltip
} from '@mui/material';
import { 
  Edit, Delete, People, History, Search, Send, Add,
  DirectionsCar, AccountBalance, LocalShipping,
  ManageAccounts, PersonAdd, Assessment
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';

import QuickUpload from '../components/QuickUpload';
import HistoricalDataViewer from '../components/HistoricalDataViewer';
import { useForm } from 'react-hook-form';
import { hrAPI, branchesAPI } from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const HRPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showGeneratePayroll, setShowGeneratePayroll] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [payrollPeriod, setPayrollPeriod] = useState('');
  const [selectedPayrollIds, setSelectedPayrollIds] = useState([]);

  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: registerPayroll, handleSubmit: handlePayrollSubmit, reset: resetPayroll } = useForm();

  // Queries - Load employees and branches with real-time data
  const { data: allEmployees = [], isLoading: employeesLoading } = useQuery(
    'employees',
    () => hrAPI.getEmployees(),
    { refetchInterval: 30000, retry: false }
  );

  const { data: allPayroll = [], isLoading: payrollLoading } = useQuery(
    'payroll',
    () => hrAPI.getPayroll(),
    { refetchInterval: 30000, retry: false }
  );
  
  const { data: branches = [], isLoading: branchesLoading } = useQuery(
    'branches',
    () => branchesAPI.getAll(),
    { retry: false }
  );

  const isLoading = employeesLoading || payrollLoading || branchesLoading;

  // Filter employees based on search and filters (show all employees with status)
  const employees = useMemo(() => {
    let filtered = [...allEmployees];
    
    if (employeeSearch) {
      filtered = filtered.filter(emp => 
        emp.full_name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.email?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.phone?.includes(employeeSearch)
      );
    }
    
    if (selectedRole) {
      filtered = filtered.filter(emp => emp.role === selectedRole);
    }
    
    if (selectedBranch) {
      filtered = filtered.filter(emp => {
        const branchId = Array.isArray(emp.branch_id) ? emp.branch_id[0] : emp.branch_id;
        return branchId === selectedBranch;
      });
    }
    
    return filtered.sort((a, b) => a.full_name?.localeCompare(b.full_name));
  }, [allEmployees, employeeSearch, selectedRole, selectedBranch]);

  // Filter payroll based on period
  const payroll = useMemo(() => {
    let filtered = [...allPayroll];
    
    if (payrollPeriod) {
      const [year, month] = payrollPeriod.split('-');
      filtered = filtered.filter(p => {
        const periodStart = new Date(p.period_start);
        return periodStart.getFullYear() === parseInt(year) && 
               periodStart.getMonth() === parseInt(month) - 1;
      });
    }
    
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [allPayroll, payrollPeriod]);

  // Calculate payroll totals with auto-calculations
  const payrollTotals = useMemo(() => {
    const selectedPayroll = payroll.filter(p => selectedPayrollIds.includes(p.id));
    const totalGross = selectedPayroll.reduce((sum, p) => sum + (parseFloat(p.gross_salary) || 0), 0);
    const totalDeductions = selectedPayroll.reduce((sum, p) => sum + (parseFloat(p.deductions) || 0), 0);
    const totalNet = selectedPayroll.reduce((sum, p) => sum + (parseFloat(p.net_salary) || 0), 0);
    
    return { totalGross, totalDeductions, totalNet, count: selectedPayroll.length };
  }, [payroll, selectedPayrollIds]);

  // Get drivers for logistics integration
  const drivers = employees.filter(emp => emp.role === 'logistics');
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.is_active).length;

  // Mutations
  const createEmployeeMutation = useMutation(
    (data) => hrAPI.createEmployee(data),
    {
      onSuccess: (response) => {
        toast.success(`Employee ${response.full_name || 'created'} successfully!`);
        setShowAddEmployee(false);
        reset();
        queryClient.invalidateQueries('employees');
      },
      onError: () => {
        toast.error('Failed to create employee');
      }
    }
  );

  const updateEmployeeMutation = useMutation(
    ({ id, data }) => hrAPI.updateEmployee(id, data),
    {
      onSuccess: (response) => {
        toast.success(`Employee updated successfully!`);
        setEditingEmployee(null);
        setShowAddEmployee(false);
        reset();
        queryClient.invalidateQueries('employees');
      },
      onError: () => {
        toast.error('Failed to update employee');
      }
    }
  );

  const deleteEmployeeMutation = useMutation(
    (employee) => hrAPI.deleteEmployee(employee.id),
    {
      onSuccess: (_, employee) => {
        toast.success(`Employee ${employee.full_name} deactivated successfully!`);
        queryClient.invalidateQueries('employees');
      },
      onError: (error, employee) => {
        toast.error(`Failed to deactivate ${employee.full_name}`);
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
        queryClient.invalidateQueries('payroll');
      },
      onError: () => {
        toast.error('Failed to generate payroll');
      }
    }
  );

  const sendPayslipsMutation = useMutation(
    (payrollIds) => hrAPI.sendPayslips(payrollIds),
    {
      onSuccess: () => {
        toast.success('Payslips sent successfully!');
        queryClient.invalidateQueries('payroll');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send payslips');
      }
    }
  );

  const onSubmitEmployee = (data) => {
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
    
    // Password validation for new employees
    if (!editingEmployee) {
      if (!data.password?.trim()) {
        toast.error('Password is required for new employees');
        return;
      }
      if (data.password.trim().length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }
    }

    const cleanData = {
      full_name: data.full_name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() || null,
      role: data.role,
      branch_id: data.branch_id || null,
      salary: data.salary ? parseFloat(data.salary) : null,
      hire_date: data.hire_date || new Date().toISOString().split('T')[0],
      is_active: data.is_active !== false
    };
    
    // Add password for new employees or password change for existing
    if (!editingEmployee && data.password?.trim()) {
      cleanData.password = data.password.trim();
    } else if (editingEmployee && data.new_password?.trim()) {
      if (data.new_password.trim().length < 8) {
        toast.error('New password must be at least 8 characters long');
        return;
      }
      cleanData.new_password = data.new_password.trim();
    }

    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data: cleanData });
    } else {
      createEmployeeMutation.mutate(cleanData);
    }
  };

  const onSubmitPayroll = (data) => {
    generatePayrollMutation.mutate(data);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setValue('full_name', employee.full_name || '');
    setValue('email', employee.email || '');
    setValue('phone', employee.phone || '');
    setValue('role', employee.role || '');
    setValue('branch_id', Array.isArray(employee.branch_id) ? employee.branch_id[0] : employee.branch_id || '');
    setValue('salary', employee.salary || '');
    setValue('hire_date', employee.hire_date || '');
    setValue('is_active', employee.is_active !== false);
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
  const totalEmployees = allEmployees.length;
  const activeEmployees = allEmployees.filter(emp => emp.is_active).length;
  const totalSalaryExpense = allEmployees
    .filter(emp => emp.is_active && emp.salary)
    .reduce((sum, emp) => sum + parseFloat(emp.salary || 0), 0);
  const pendingPayroll = allPayroll.filter(p => p.payment_status === 'pending').length;
  const averageSalary = activeEmployees > 0 ? totalSalaryExpense / activeEmployees : 0;

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <div>Loading HR data...</div>
      </Container>
    );
  }

  console.log('HR Page Data:', { 
    employees: allEmployees.length, 
    branches: branches.length,
    branchesData: branches
  });

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ManageAccounts sx={{ fontSize: 40, color: '#1976d2' }} />
          <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', m: 0 }}>
            kabisakabisa enterprise - HR Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DirectionsCar />}
          onClick={() => navigate('/logistics')}
          sx={{ 
            bgcolor: '#4caf50', 
            color: 'white',
            '&:hover': { bgcolor: '#45a049' }
          }}
        >
          View Logistics
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: { xs: 30, md: 40 }, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Employees
                  </Typography>
                  <Typography variant="h6">
                    {totalEmployees}
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
                Active Employees
              </Typography>
              <Typography variant="h6" color="success.main">
                {activeEmployees}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Monthly Salary Expense
              </Typography>
              <Typography variant="h6">
                {formatCurrency(totalSalaryExpense)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFF3E0', border: '1px solid #FF6B35' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalShipping sx={{ fontSize: { xs: 30, md: 40 }, color: '#FF6B35', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Drivers
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#FF6B35' }}>
                    {activeDrivers}/{totalDrivers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setShowAddEmployee(true)}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Add Employee
        </Button>
        <Button
          variant="contained"
          startIcon={<AccountBalance />}
          onClick={() => setShowGeneratePayroll(true)}
          sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
        >
          Generate Payroll
        </Button>
        <Button
          variant="contained"
          startIcon={<Assessment />}
          onClick={() => {
            if (selectedPayrollIds.length > 0) {
              toast.success(`Selected ${selectedPayrollIds.length} payroll records for calculation`);
            } else {
              toast.info('Select payroll records to calculate totals');
            }
          }}
          sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
        >
          Calculate Selected
        </Button>
        <Button
          variant="outlined"
          startIcon={<History />}
          onClick={() => setShowHistoricalData(true)}
          color="info"
        >
          Historical Data
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ color: '#FF6B35' }}>
                Employee Management ({employees.length} employees)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search employees..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    )
                  }}
                  sx={{ minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    label="Role"
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="boss">Boss</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="hr">HR</MenuItem>
                    <MenuItem value="sales">Sales</MenuItem>
                    <MenuItem value="logistics">Logistics/Driver</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Branch</InputLabel>
                  <Select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    label="Branch"
                    displayEmpty
                  >
                    <MenuItem value="">All Branches</MenuItem>
                    {branches.length > 0 ? branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name || branch.branch_name || `Branch ${branch.id}`}
                      </MenuItem>
                    )) : (
                      <MenuItem disabled>No branches available</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  onClick={() => {
                    setEmployeeSearch('');
                    setSelectedRole('');
                    setSelectedBranch('');
                  }}
                  variant="outlined"
                >
                  Clear
                </Button>
              </Box>
            </Box>
            
            {/* Driver Statistics Alert */}
            {selectedRole === 'logistics' && (
              <Alert severity="info" sx={{ mb: 2, bgcolor: '#FFF3E0', color: '#FF6B35' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    Drivers/Logistics Staff: {drivers.length} total, {activeDrivers} active
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/logistics')}
                    sx={{ color: '#FF6B35' }}
                  >
                    View in Logistics
                  </Button>
                </Box>
              </Alert>
            )}
            
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#1976d2' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Branch</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Salary</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Hire Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => {
                    const branchId = Array.isArray(employee.branch_id) ? employee.branch_id[0] : employee.branch_id;
                    const employeeBranch = branches.find(b => b.id === branchId);
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>{(employee.full_name || '').toLowerCase()}</TableCell>
                        <TableCell>{(employee.email || '').toLowerCase()}</TableCell>
                        <TableCell>{employee.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={employee.role === 'logistics' ? 'DRIVER' : (employee.role || '').toUpperCase()}
                            color={getRoleColor(employee.role)}
                            size="small"
                            icon={employee.role === 'logistics' ? <LocalShipping /> : undefined}
                          />
                        </TableCell>
                        <TableCell>{(employeeBranch?.name || employeeBranch?.branch_name || 'no branch').toLowerCase()}</TableCell>
                        <TableCell>{employee.salary ? formatCurrency(employee.salary) : 'N/A'}</TableCell>
                        <TableCell>{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={employee.is_active !== false ? 'Active' : 'Inactive'}
                            color={employee.is_active !== false ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditEmployee(employee)} size="small">
                            <Edit />
                          </IconButton>
                          {employee.is_active !== false ? (
                            <IconButton 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to deactivate ${employee.full_name}?`)) {
                                  deleteEmployeeMutation.mutate(employee);
                                }
                              }}
                              size="small" 
                              color="error"
                              disabled={deleteEmployeeMutation.isLoading}
                              title="Deactivate Employee"
                            >
                              <Delete />
                            </IconButton>
                          ) : (
                            <IconButton 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to reactivate ${employee.full_name}?`)) {
                                  updateEmployeeMutation.mutate({ id: employee.id, data: { is_active: true } });
                                }
                              }}
                              size="small" 
                              color="success"
                              disabled={updateEmployeeMutation.isLoading}
                              title="Reactivate Employee"
                            >
                              <Add />
                            </IconButton>
                          )}
                          {employee.role === 'logistics' && (
                            <Tooltip title="View in Logistics">
                              <IconButton 
                                onClick={() => navigate('/logistics')}
                                size="small"
                                sx={{ color: '#FF6B35' }}
                              >
                                <LocalShipping />
                              </IconButton>
                            </Tooltip>
                          )}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ color: '#FF6B35' }}>
                Payroll Management ({payroll.length} records)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  label="Period (YYYY-MM)"
                  placeholder="2024-01"
                  value={payrollPeriod}
                  onChange={(e) => setPayrollPeriod(e.target.value)}
                  sx={{ minWidth: 150 }}
                />
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={() => {
                    const pendingIds = payroll
                      .filter(p => p.payment_status === 'pending')
                      .map(p => p.id);
                    if (pendingIds.length > 0) {
                      sendPayslipsMutation.mutate(pendingIds);
                      toast.success(`Sending payslips to ${pendingIds.length} employees`);
                    } else {
                      toast.info('No pending payroll to send');
                    }
                  }}
                  disabled={pendingPayroll === 0 || sendPayslipsMutation.isLoading}
                  sx={{ bgcolor: '#FF6B35', '&:hover': { bgcolor: '#E55A2B' } }}
                >
                  📱 Send All Payslips ({pendingPayroll})
                </Button>
              </Box>
            </Box>
            
            {/* Auto-calculation Summary */}
            {selectedPayrollIds.length > 0 && (
              <Alert severity="success" sx={{ mb: 2, bgcolor: '#E8F5E8' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#FF6B35' }}>
                  Selected Payroll Calculation
                </Typography>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Records Selected</Typography>
                    <Typography variant="h6" sx={{ color: '#FF6B35' }}>
                      {payrollTotals.count}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Total Gross Salary</Typography>
                    <Typography variant="h6" sx={{ color: '#FF6B35' }}>
                      {formatCurrency(payrollTotals.totalGross)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                    <Typography variant="h6" sx={{ color: '#FF6B35' }}>
                      {formatCurrency(payrollTotals.totalDeductions)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Total Net Salary</Typography>
                    <Typography variant="h6" sx={{ color: '#FF6B35' }}>
                      {formatCurrency(payrollTotals.totalNet)}
                    </Typography>
                  </Grid>
                </Grid>
              </Alert>
            )}
            
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#4caf50' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Select</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employee</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Period</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Gross Salary</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Deductions (%)</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Net Salary</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Generated Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payroll.map((record) => {
                    const grossSalary = parseFloat(record.gross_salary) || 0;
                    const deductions = parseFloat(record.deductions) || 0;
                    const deductionPercentage = grossSalary > 0 ? ((deductions / grossSalary) * 100).toFixed(1) : 0;
                    const netSalary = grossSalary - deductions;
                    const isSelected = selectedPayrollIds.includes(record.id);
                    
                    return (
                      <TableRow 
                        key={record.id}
                        sx={{ 
                          bgcolor: isSelected ? '#FFF3E0' : 'inherit',
                          '&:hover': { bgcolor: '#F5F5F5' }
                        }}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPayrollIds(prev => [...prev, record.id]);
                              } else {
                                setSelectedPayrollIds(prev => prev.filter(id => id !== record.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {record.employee_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {record.employee_email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(record.period_start).toLocaleDateString()} - {new Date(record.period_end).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#FF6B35' }}>
                            {formatCurrency(grossSalary)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" color="error.main">
                              {formatCurrency(deductions)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({deductionPercentage}%)
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: 'success.main' }}>
                            {formatCurrency(netSalary)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={record.payment_status.toUpperCase()}
                            color={record.payment_status === 'paid' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(record.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {payroll.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">
                          No payroll records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
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
                    Total Employees: <strong>{totalEmployees}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Employees: <strong style={{ color: '#4CAF50' }}>{activeEmployees}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inactive Employees: <strong style={{ color: '#F44336' }}>{totalEmployees - activeEmployees}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Salary: <strong style={{ color: '#ff9800' }}>{formatCurrency(averageSalary)}</strong>
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Drivers: <strong style={{ color: '#9c27b0' }}>{totalDrivers}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Drivers: <strong style={{ color: '#4CAF50' }}>{activeDrivers}</strong>
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
                        const count = allEmployees.filter(emp => emp.role === role).length;
                        const percentage = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : 0;
                        return (
                          <TableRow key={role}>
                            <TableCell>
                              <Chip 
                                label={role === 'logistics' ? 'DRIVER' : role.toUpperCase()}
                                color={getRoleColor(role)}
                                size="small"
                                icon={role === 'logistics' ? <LocalShipping /> : undefined}
                              />
                            </TableCell>
                            <TableCell><strong>{count}</strong></TableCell>
                            <TableCell><strong>{percentage}%</strong></TableCell>
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
                <MenuItem value="sales">Sales Staff</MenuItem>
                <MenuItem value="logistics">Driver/Logistics</MenuItem>
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
                    {branch.name || branch.branch_name || 'Unknown Branch'}
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
            {editingEmployee && (
              <>
                <TextField
                  fullWidth
                  label="New Password (Optional)"
                  type="password"
                  margin="normal"
                  helperText="Leave blank to keep current password. Minimum 8 characters if changing."
                  {...register('new_password', { minLength: 8 })}
                />
                <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2">
                    Only fill the password field if you want to change the employee's password.
                  </Typography>
                </Alert>
              </>
            )}
            {!editingEmployee && (
              <>
                <TextField
                  fullWidth
                  label="Password *"
                  type="password"
                  margin="normal"
                  helperText="Minimum 8 characters required"
                  {...register('password', { required: true, minLength: 8 })}
                />
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Security Notice:</strong> Please set a secure password for the new employee.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {branches.length === 0 && 'Note: No branches available for assignment. '}
                    Driver accounts will have logistics role and can be viewed in Logistics page
                  </Typography>
                </Alert>
              </>
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
            {createEmployeeMutation.isLoading || updateEmployeeMutation.isLoading 
              ? (editingEmployee ? 'Updating...' : 'Creating...') 
              : (editingEmployee ? 'Update' : 'Create')} Employee
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

      {/* Historical Data Viewer */}
      <HistoricalDataViewer 
        open={showHistoricalData}
        onClose={() => setShowHistoricalData(false)}
        title="HR Historical Data"
      />
    </Container>
  );
};

export default HRPage;