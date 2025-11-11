import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
import {
  AccountBalance,
  Assessment,
  TrendingUp,
  Receipt,
  PieChart,
  BarChart,
  Timeline,
  Help,
  ExpandMore,
  PlayArrow,
  CheckCircle,
  Info,
  Warning
} from '@mui/icons-material';
import FinancialDashboard from '../components/FinancialDashboard';
import { useAuth } from '../contexts/AuthContext';

const FinancePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const userGuide = [
    {
      title: "Getting Started with Financial Analytics",
      icon: <PlayArrow color="primary" />,
      content: [
        "Select your branch or view all branches for comprehensive analysis",
        "Set date ranges to analyze specific periods (daily, weekly, monthly, yearly)",
        "Use the summary cards to get quick insights into revenue, profit, and margins",
        "Navigate between different analysis tabs for detailed breakdowns"
      ]
    },
    {
      title: "Understanding Financial Metrics",
      icon: <Assessment color="info" />,
      content: [
        "Total Revenue: Sum of all sales across selected branches and date range",
        "Gross Profit: Revenue minus Cost of Goods Sold (COGS)",
        "Net Profit: Gross profit minus operating expenses and payroll",
        "Profit Margin: Net profit as a percentage of total revenue"
      ]
    },
    {
      title: "Branch Performance Analysis",
      icon: <BarChart color="success" />,
      content: [
        "Compare revenue, expenses, and profitability across all branches",
        "Identify top-performing and underperforming locations",
        "Use profit margin percentages to assess efficiency",
        "Monitor branch-specific trends and patterns"
      ]
    },
    {
      title: "Product Profitability Insights",
      icon: <PieChart color="warning" />,
      content: [
        "Analyze profit margins for individual products",
        "Compare average purchase vs selling prices",
        "Identify most and least profitable products",
        "Make informed decisions about pricing and inventory"
      ]
    },
    {
      title: "Cost Structure Analysis",
      icon: <Timeline color="error" />,
      content: [
        "Break down costs into categories: COGS, Operating Expenses, Payroll",
        "Monitor expense trends over time",
        "Identify areas for cost optimization",
        "Track expense ratios relative to revenue"
      ]
    },
    {
      title: "Xero Integration",
      icon: <AccountBalance color="primary" />,
      content: [
        "One-click access to Xero accounting platform",
        "Sync financial data for comprehensive reporting",
        "Generate invoices and manage accounts receivable",
        "Export data for tax preparation and compliance"
      ]
    }
  ];

  const features = [
    {
      title: "Real-time Analytics",
      description: "Live financial data updates across all 16 database tables",
      icon: <TrendingUp color="success" />
    },
    {
      title: "Multi-branch Comparison",
      description: "Compare performance across all company locations",
      icon: <BarChart color="primary" />
    },
    {
      title: "Profit/Loss Analysis",
      description: "Comprehensive P&L statements with detailed breakdowns",
      icon: <Assessment color="info" />
    },
    {
      title: "Product Profitability",
      description: "Individual product margin analysis and optimization",
      icon: <PieChart color="warning" />
    },
    {
      title: "Expense Tracking",
      description: "Categorized expense monitoring and cost control",
      icon: <Receipt color="error" />
    },
    {
      title: "Xero Integration",
      description: "Seamless connection to professional accounting software",
      icon: <AccountBalance color="secondary" />
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', m: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalance />
          Financial Management System
        </Typography>
        <Button
          variant="contained"
          startIcon={<AccountBalance />}
          onClick={() => window.open('https://xero.com', '_blank')}
          sx={{ bgcolor: '#13B5EA', '&:hover': { bgcolor: '#0F9BD7' } }}
        >
          Open Xero
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Welcome to the Financial Management System!</strong> This comprehensive platform provides real-time financial analytics, 
          profit/loss analysis, and business intelligence across all company operations. Use the tabs below to navigate between 
          analytics and user guidance.
        </Typography>
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Financial Analytics" icon={<Assessment />} />
          <Tab label="User Guide" icon={<Help />} />
          <Tab label="System Features" icon={<Info />} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          <FinancialDashboard userRole={user?.role} />
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Help color="primary" />
            How to Use the Financial Management System
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Financial data is calculated from Sales, Expenses, Orders, Payroll, and Stock tables. 
                  Ensure all transactions are properly recorded for accurate analytics.
                </Typography>
              </Alert>
            </Grid>

            {userGuide.map((section, index) => (
              <Grid item xs={12} key={index}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {section.icon}
                      <Typography variant="h6">{section.title}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {section.content.map((item, itemIndex) => (
                        <ListItem key={itemIndex}>
                          <ListItemIcon>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Card sx={{ mt: 3, bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Quick Tips for Better Financial Management
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Daily Operations:</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Record all sales transactions immediately" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Log expenses with proper categorization" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Update stock levels after sales/purchases" />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Analysis Best Practices:</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Review daily reports for immediate insights" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Compare monthly trends for strategic planning" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Monitor product profitability regularly" />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Info color="primary" />
            System Features & Capabilities
          </Typography>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {feature.icon}
                      <Typography variant="h6">{feature.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Data Sources & Integration
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="subtitle1" gutterBottom>Revenue Sources:</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Sales table - All transaction records" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Sale_Items table - Product-level sales data" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Stock table - Product pricing information" />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="subtitle1" gutterBottom>Cost Sources:</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Expenses table - Operating costs" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Orders table - Purchase costs (COGS)" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Payroll table - Employee compensation" />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>System Status:</strong> All financial modules are operational and integrated. 
              Data is synchronized across all 16 database tables for comprehensive analysis.
            </Typography>
          </Alert>
        </Box>
      )}
    </Container>
  );
};

export default FinancePage;