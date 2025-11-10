import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  TrendingUp, 
  Business, 
  People, 
  Assessment,
  GetApp,
  History,
  AccountBalance
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import QuickUpload from '../components/QuickUpload';
import HistoricalDataViewer from '../components/HistoricalDataViewer';
import { branchesAPI, hrAPI, dataAPI } from '../services/api';
import { formatCurrency } from '../theme';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const BossPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showHistoricalData, setShowHistoricalData] = useState(false);

  // Queries
  const { data: pageData, isLoading, error } = useQuery(
    ['bossPageData', selectedPeriod],
    () => {
      console.log('Fetching boss page data for period:', selectedPeriod);
      return dataAPI.getPageData('boss', null, { period: selectedPeriod });
    }
  );

  const dashboard = pageData?.dashboard;
  const rotAnalysis = pageData?.rotAnalysis;
  
  console.log('Boss page data:', { dashboard, rotAnalysis });
  
  const { data: branches = [] } = useQuery('branches', () => branchesAPI.getAll());
  const { data: employees = [] } = useQuery('employees', () => hrAPI.getEmployees());

  // Sample data for charts (replace with real data from API)
  const salesData = [
    { name: 'Jan', revenue: 45000, profit: 12000 },
    { name: 'Feb', revenue: 52000, profit: 15000 },
    { name: 'Mar', revenue: 48000, profit: 13500 },
    { name: 'Apr', revenue: 61000, profit: 18000 },
    { name: 'May', revenue: 55000, profit: 16500 },
    { name: 'Jun', revenue: 67000, profit: 20000 },
  ];

  const branchPerformance = branches.map(branch => ({
    name: branch.branch_name,
    sales: Math.floor(Math.random() * 50000) + 20000,
    profit: Math.floor(Math.random() * 15000) + 5000,
    employees: employees.filter(emp => emp.branch_id === branch.id).length
  }));

  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleExportReport = (type) => {
    // Implement export functionality
    console.log(`Exporting ${type} report`);
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
        <Typography color="error">Error loading dashboard data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Executive Dashboard
        </Typography>
        <QuickUpload defaultCategory="financial_reports" buttonText="Upload Report" />
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: { xs: 30, md: 40 }, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(dashboard?.totalRevenue || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ fontSize: { xs: 30, md: 40 }, color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Branches
                  </Typography>
                  <Typography variant="h6">
                    {branches.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: { xs: 30, md: 40 }, color: 'info.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Employees
                  </Typography>
                  <Typography variant="h6">
                    {employees.filter(emp => emp.is_active).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    ROT Analysis
                  </Typography>
                  <Typography variant="h5">
                    {rotAnalysis?.averageROT ? `${rotAnalysis.averageROT.toFixed(1)}%` : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={() => handleExportReport('pdf')}
        >
          Export PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={() => handleExportReport('excel')}
        >
          Export Excel
        </Button>
        <Button
          variant="contained"
          startIcon={<AccountBalance />}
          onClick={() => window.open('https://go.xero.com/Dashboard/', '_blank')}
          sx={{ bgcolor: '#13B5EA', '&:hover': { bgcolor: '#0F9BD7' } }}
        >
          Xero Dashboard
        </Button>
        <Button
          variant="outlined"
          startIcon={<History />}
          onClick={() => setShowHistoricalData(true)}
          color="info"
        >
          Historical Data
        </Button>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            label="Period"
          >
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Branch Performance" />
          <Tab label="Financial Analysis" />
          <Tab label="ROT Analysis" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue & Profit Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Branch Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={branchPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                    >
                      {branchPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Branch Performance Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Branch Performance Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={branchPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                    <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Branch Details
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Branch Name</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Employees</TableCell>
                        <TableCell>Monthly Sales</TableCell>
                        <TableCell>Monthly Profit</TableCell>
                        <TableCell>Profit Margin</TableCell>
                        <TableCell>Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {branches.map((branch) => {
                        const performance = branchPerformance.find(p => p.name === branch.branch_name);
                        const profitMargin = performance ? ((performance.profit / performance.sales) * 100).toFixed(1) : 0;
                        return (
                          <TableRow key={branch.id}>
                            <TableCell>{branch.branch_name}</TableCell>
                            <TableCell>{branch.location_address}</TableCell>
                            <TableCell>{performance?.employees || 0}</TableCell>
                            <TableCell>{formatCurrency(performance?.sales || 0)}</TableCell>
                            <TableCell>{formatCurrency(performance?.profit || 0)}</TableCell>
                            <TableCell>{profitMargin}%</TableCell>
                            <TableCell>
                              <Chip 
                                label={profitMargin > 25 ? 'Excellent' : profitMargin > 15 ? 'Good' : 'Needs Improvement'}
                                color={profitMargin > 25 ? 'success' : profitMargin > 15 ? 'primary' : 'warning'}
                                size="small"
                              />
                            </TableCell>
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

      {/* Financial Analysis Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Financial Summary
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue: {formatCurrency(salesData.reduce((sum, item) => sum + item.revenue, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Profit: {formatCurrency(salesData.reduce((sum, item) => sum + item.profit, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Profit Margin: {((salesData.reduce((sum, item) => sum + item.profit, 0) / salesData.reduce((sum, item) => sum + item.revenue, 0)) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Growth Rate: +12.5%
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AccountBalance />}
                    onClick={() => window.open('https://go.xero.com/Reports/', '_blank')}
                    sx={{ mt: 2, color: '#13B5EA', borderColor: '#13B5EA' }}
                    size="small"
                  >
                    View in Xero
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cost Analysis
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Salary Expense: {formatCurrency(employees.reduce((sum, emp) => sum + (parseFloat(emp.salary) || 0), 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Operational Costs: {formatCurrency(45000)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vehicle Maintenance: {formatCurrency(8500)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Other Expenses: {formatCurrency(12000)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Financial Breakdown
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell>Costs</TableCell>
                        <TableCell>Gross Profit</TableCell>
                        <TableCell>Net Profit</TableCell>
                        <TableCell>Profit Margin</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.map((month) => {
                        const costs = month.revenue - month.profit;
                        const profitMargin = ((month.profit / month.revenue) * 100).toFixed(1);
                        return (
                          <TableRow key={month.name}>
                            <TableCell>{month.name}</TableCell>
                            <TableCell>{formatCurrency(month.revenue)}</TableCell>
                            <TableCell>{formatCurrency(costs)}</TableCell>
                            <TableCell>{formatCurrency(month.profit)}</TableCell>
                            <TableCell>{formatCurrency(month.profit * 0.85)}</TableCell>
                            <TableCell>{profitMargin}%</TableCell>
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

      {/* ROT Analysis Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Return on Turnover (ROT) Analysis
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current ROT: {rotAnalysis?.averageROT ? `${rotAnalysis.averageROT.toFixed(1)}%` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Industry Average: 18.5%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Target ROT: 25.0%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Performance: {rotAnalysis?.averageROT > 18.5 ? 'Above Average' : 'Below Average'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ROT Improvement Recommendations
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Optimize inventory turnover rates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Reduce operational costs by 5-8%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Improve sales conversion rates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Focus on high-margin products
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Branch ROT Comparison
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Branch</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell>Profit</TableCell>
                        <TableCell>ROT %</TableCell>
                        <TableCell>vs Target</TableCell>
                        <TableCell>Rating</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {branchPerformance.map((branch) => {
                        const rot = ((branch.profit / branch.sales) * 100);
                        const vsTarget = rot - 25;
                        return (
                          <TableRow key={branch.name}>
                            <TableCell>{branch.name}</TableCell>
                            <TableCell>{formatCurrency(branch.sales)}</TableCell>
                            <TableCell>{formatCurrency(branch.profit)}</TableCell>
                            <TableCell>{rot.toFixed(1)}%</TableCell>
                            <TableCell>
                              <Typography 
                                color={vsTarget >= 0 ? 'success.main' : 'error.main'}
                                variant="body2"
                              >
                                {vsTarget >= 0 ? '+' : ''}{vsTarget.toFixed(1)}%
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={rot >= 25 ? 'Excellent' : rot >= 18.5 ? 'Good' : 'Poor'}
                                color={rot >= 25 ? 'success' : rot >= 18.5 ? 'primary' : 'error'}
                                size="small"
                              />
                            </TableCell>
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

      {/* Historical Data Viewer */}
      <HistoricalDataViewer 
        open={showHistoricalData}
        onClose={() => setShowHistoricalData(false)}
        title="Executive Historical Data"
      />
    </Container>
  );
};

export default BossPage;