import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and CSRF protection
api.interceptors.request.use(
  async (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CSRF disabled for production compatibility
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });

          const { accessToken } = response.data;
          Cookies.set('accessToken', accessToken, { 
            expires: 1/24,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('userData');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data).then(res => res.data),
  login: (credentials) => api.post('/auth/login', credentials).then(res => res.data),
  setupMFA: (userId) => api.post('/auth/setup-mfa', { userId }).then(res => res.data),
  verifyMFA: (userId, token) => api.post('/auth/verify-mfa', { userId, token }).then(res => res.data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then(res => res.data),
  changePassword: (data) => api.post('/auth/change-password', data).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
};

// Branches API
export const branchesAPI = {
  getPublic: () => api.get('/branches/public').then(res => res.data),
  getAll: () => api.get('/branches').then(res => res.data),
  getById: (id) => api.get(`/branches/${id}`).then(res => res.data),
  create: (data) => api.post('/branches', data).then(res => res.data),
  update: (id, data) => api.put(`/branches/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/branches/${id}`).then(res => res.data),
};

// Stock API - using data routes
export const stockAPI = {
  getAll: () => api.get('/data/Stock').then(res => res.data),
  getByBranch: (branchId) => api.get('/data/Stock').then(res => {
    const stock = res.data || [];
    return stock.filter(item => item.branch_id && item.branch_id.includes(branchId));
  }),
  addStock: (branchId, data) => api.post('/data/Stock', { ...data, branch_id: [branchId] }).then(res => res.data),
  addQuantity: (stockId, quantity) => api.get(`/data/Stock/${stockId}`).then(stock => 
    api.put(`/data/Stock/${stockId}`, { 
      ...stock.data, 
      quantity_available: (stock.data.quantity_available || 0) + quantity 
    })
  ).then(res => res.data),
  transfer: (data) => api.post('/data/Stock_Movements', data).then(res => res.data),
  getPendingTransfers: (branchId) => api.get('/data/Stock_Movements').then(res => {
    const movements = res.data || [];
    return movements.filter(m => m.to_branch_id && m.to_branch_id.includes(branchId) && m.status === 'pending');
  }),
  approveTransfer: (transferId) => api.put(`/data/Stock_Movements/${transferId}`, { status: 'approved' }).then(res => res.data),
  rejectTransfer: (transferId) => api.put(`/data/Stock_Movements/${transferId}`, { status: 'rejected' }).then(res => res.data),
  updateStock: (stockId, data) => api.put(`/data/Stock/${stockId}`, data).then(res => res.data),
  deleteStock: (stockId) => api.delete(`/data/Stock/${stockId}`).then(res => res.data),
};

// Sales API - using data routes
export const salesAPI = {
  getByBranch: (branchId, params) => api.get('/data/Sales').then(res => {
    const sales = res.data || [];
    return sales.filter(sale => sale.branch_id && sale.branch_id.includes(branchId));
  }),
  createSale: (branchId, data) => api.post('/data/Sales', { ...data, branch_id: [branchId] }).then(res => res.data),
  getDailySummary: (branchId, date) => salesAPI.getByBranch(branchId).then(sales => {
    const dailySales = sales.filter(sale => sale.sale_date === date);
    return {
      totalSales: dailySales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0),
      salesCount: dailySales.length,
      sales: dailySales
    };
  }),
  recordExpense: (branchId, data) => api.post('/data/Expenses', { ...data, branch_id: [branchId] }).then(res => res.data),
  getExpenses: (branchId, params) => expensesAPI.getAll({ branchId, ...params }),
  getFundsTracking: (branchId, date) => Promise.all([
    salesAPI.getDailySummary(branchId, date),
    expensesAPI.getAll({ branchId, startDate: date, endDate: date })
  ]).then(([sales, expenses]) => ({
    revenue: sales.totalSales,
    expenses: expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0),
    profit: sales.totalSales - expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
  })),
  updateSale: (saleId, data) => api.put(`/data/Sales/${saleId}`, data).then(res => res.data),
};

// Logistics API
export const logisticsAPI = {
  getVehicles: () => api.get('/logistics/vehicles').then(res => res.data),
  createVehicle: (data) => api.post('/logistics/vehicles', data).then(res => res.data),
  updateVehicle: (id, data) => api.put(`/logistics/vehicles/${id}`, data).then(res => res.data),
  deleteVehicle: (id) => api.delete(`/logistics/vehicles/${id}`).then(res => res.data),
  getTrips: (params) => api.get('/logistics/trips', { params }).then(res => res.data),
  createTrip: (data) => api.post('/logistics/trips', data).then(res => res.data),
  updateTrip: (id, data) => api.put(`/logistics/trips/${id}`, data).then(res => res.data),
  getAllMaintenance: () => api.get('/logistics/maintenance').then(res => res.data),
  getMaintenance: (vehicleId) => api.get(`/logistics/maintenance/${vehicleId}`).then(res => res.data),
  createMaintenance: (data) => api.post('/logistics/maintenance', data).then(res => res.data),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }).then(res => res.data),
  create: (data) => api.post('/orders', data).then(res => res.data),
  update: (id, data) => api.put(`/orders/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/orders/${id}`).then(res => res.data),
  recordPayment: (id, data) => {
    if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return Promise.reject(new Error('Invalid order ID'));
    }
    return api.post(`/orders/${encodeURIComponent(id)}/payment`, data).then(res => res.data);
  },
  markDelivered: (id, data) => api.post(`/orders/${id}/delivery`, data).then(res => res.data),
  completeOrder: (id, data) => api.post(`/orders/${id}/complete`, data).then(res => res.data),
};

// HR API
export const hrAPI = {
  getEmployees: (params) => api.get('/hr/employees', { params }).then(res => res.data),
  createEmployee: (data) => api.post('/hr/employees', data).then(res => res.data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}`, data).then(res => res.data),
  deleteEmployee: (id) => api.delete(`/hr/employees/${id}`).then(res => res.data),
  generatePayroll: (data) => api.post('/hr/payroll/generate', data).then(res => res.data),
  getPayroll: (params) => api.get('/hr/payroll', { params }).then(res => res.data),
  sendPayslips: (payrollIds) => api.post('/hr/payroll/send-payslips', { payroll_ids: payrollIds }).then(res => res.data),
  bulkUpdatePayroll: (payrollIds, status) => api.patch('/hr/payroll/bulk-update', { payroll_ids: payrollIds, status }).then(res => res.data),
  getDriverStats: () => api.get('/hr/drivers/stats').then(res => res.data),
};

// Boss API
export const bossAPI = {
  getDashboard: () => api.get('/boss/dashboard').then(res => res.data),
  getBranchExpenses: (branchId, params) => api.get(`/boss/expenses/branch/${branchId}`, { params }).then(res => res.data),
  getROTAnalysis: (params) => api.get('/boss/rot-analysis', { params }).then(res => res.data),
  getReports: (params) => api.get('/boss/reports', { params }).then(res => res.data),
  exportReport: (type, params) => {
    const allowedTypes = ['pdf', 'excel', 'csv'];
    if (!allowedTypes.includes(type)) {
      return Promise.reject(new Error('Invalid export type'));
    }
    return api.get(`/boss/reports/export/${type}`, { params, responseType: 'blob' }).then(res => res.data);
  },
};

// Manager API
export const managerAPI = {
  getDashboard: (branchId) => api.get(`/manager/dashboard/${branchId}`).then(res => res.data),
};

// Admin API
export const adminAPI = {
  getOverview: () => api.get('/admin/overview').then(res => res.data),
  getProducts: () => api.get('/admin/products').then(res => res.data),
  createProduct: (data) => api.post('/admin/products', data).then(res => res.data),
};

export const accountingAPI = {
  getSettings: () => api.get('/accounting/settings').then(res => res.data),
  saveSettings: (data) => api.post('/accounting/settings', data).then(res => res.data),
  syncEtims: (data) => api.post('/accounting/sync-etims', data).then(res => res.data),
  bulkSyncEtims: (data) => api.post('/accounting/bulk-sync-etims', data).then(res => res.data),
  generateReport: (params) => api.get('/accounting/audit-report', { params }).then(res => res.data)
};

export const reportsAPI = {
  getSalesReport: (params) => api.get('/reports/sales', { params }).then(res => res.data),
  getExpensesReport: (params) => api.get('/reports/expenses', { params }).then(res => res.data),
  getPayrollReport: (params) => api.get('/reports/payroll', { params }).then(res => res.data)
};

export const documentsAPI = {
  getDocuments: (params) => api.get('/documents', { params }).then(res => res.data),
  uploadDocument: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  downloadDocument: (documentId) => api.get(`/documents/download/${documentId}`).then(res => res.data),
  deleteDocument: (documentId) => api.delete(`/documents/${documentId}`).then(res => res.data)
};

// Expenses API - using data routes for compatibility
export const expensesAPI = {
  getAll: (params) => {
    return api.get('/data/Expenses').then(res => {
      let expenses = res.data || [];
      
      // Filter by branch if provided
      if (params?.branchId) {
        expenses = expenses.filter(expense => 
          expense.branch_id && expense.branch_id.includes(params.branchId)
        );
      }
      
      // Filter by date range if provided
      if (params?.startDate && params?.endDate) {
        expenses = expenses.filter(expense => {
          if (!expense.expense_date) return false;
          const expenseDate = new Date(expense.expense_date);
          const start = new Date(params.startDate);
          const end = new Date(params.endDate);
          return expenseDate >= start && expenseDate <= end;
        });
      }
      
      // Filter by category if provided
      if (params?.category) {
        expenses = expenses.filter(expense => expense.category === params.category);
      }
      
      return expenses;
    });
  },
  create: (data) => api.post('/data/Expenses', data).then(res => res.data),
  update: (id, data) => api.put(`/data/Expenses/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/data/Expenses/${id}`).then(res => res.data),
  getCategories: () => Promise.resolve([
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'travel', label: 'Travel' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' }
  ]),
  getSummary: (params) => {
    return expensesAPI.getAll(params).then(expenses => {
      const summary = expenses.reduce((acc, expense) => {
        const category = expense.category || 'other';
        const amount = parseFloat(expense.amount) || 0;
        
        if (!acc[category]) {
          acc[category] = {
            category,
            total_amount: 0,
            count: 0,
            expenses: []
          };
        }
        
        acc[category].total_amount += amount;
        acc[category].count += 1;
        acc[category].expenses.push({
          id: expense.id,
          expense_date: expense.expense_date,
          amount: expense.amount,
          description: expense.description
        });
        
        return acc;
      }, {});
      
      const totalAmount = Object.values(summary).reduce((sum, cat) => sum + cat.total_amount, 0);
      
      return {
        summary: Object.values(summary),
        total_amount: totalAmount,
        total_expenses: expenses.length,
        period: { startDate: params?.startDate, endDate: params?.endDate }
      };
    });
  },
};

// Enhanced Stock API with more endpoints
export const stockAPIEnhanced = {
  ...stockAPI,
  getAll: () => api.get('/stock').then(res => res.data),
  getLowStock: (branchId) => api.get(`/stock/low-stock/${branchId}`).then(res => res.data),
  getMovements: (branchId, params) => api.get(`/stock/movements/${branchId}`, { params }).then(res => res.data),
};

// Update stockAPI to include missing methods
stockAPI.getPendingTransfers = (branchId) => api.get(`/stock/transfers/pending/${branchId}`).then(res => res.data);
stockAPI.transfer = (data) => api.post('/stock/transfer', data).then(res => res.data);
stockAPI.approveTransfer = (transferId) => api.patch(`/stock/transfers/${transferId}/approve`).then(res => res.data);
stockAPI.rejectTransfer = (transferId) => api.patch(`/stock/transfers/${transferId}/reject`).then(res => res.data);

// Finance API
export const financeAPI = {
  getAnalytics: (params) => api.get('/finance/analytics', { params }).then(res => res.data),
  getProductCosts: () => api.get('/finance/product-costs').then(res => res.data),
};

// Enhanced Sales API
export const salesAPIEnhanced = {
  ...salesAPI,
  getAll: (params) => api.get('/sales', { params }).then(res => res.data),
  getSaleItems: (saleId) => api.get(`/sales/${saleId}/items`).then(res => res.data),
  getAnalytics: (branchId, params) => api.get(`/sales/analytics/${branchId}`, { params }).then(res => res.data),
};

// Generic data API for all tables
export const genericDataAPI = {
  getAll: (tableName, params) => api.get(`/data/${tableName}`, { params }).then(res => res.data),
  getById: (tableName, id) => api.get(`/data/${tableName}/${id}`).then(res => res.data),
  create: (tableName, data) => api.post(`/data/${tableName}`, data).then(res => res.data),
  update: (tableName, id, data) => api.put(`/data/${tableName}/${id}`, data).then(res => res.data),
  delete: (tableName, id) => api.delete(`/data/${tableName}/${id}`).then(res => res.data),
  bulkOperation: (tableName, operation, records) => 
    api.post(`/data/${tableName}/bulk`, { operation, records }).then(res => res.data)
};

// Comprehensive data fetching utilities
export const dataAPI = {
  // Get all data for a specific page
  getPageData: async (page, params = {}) => {
    const branchId = params.branchId;
    try {
      switch (page) {
        case 'admin':
          const queryString = new URLSearchParams(params).toString();
          const adminUrl = `/data/page/admin${queryString ? `?${queryString}` : ''}`;
          return api.get(adminUrl).then(res => res.data);

        case 'manager':
          if (!branchId) throw new Error('Branch ID required for manager page');
          const [branch, managerStock, branchEmployees] = await Promise.all([
            branchesAPI.getById(branchId),
            api.get(`/stock/branch/${branchId}`).then(res => res.data),
            hrAPI.getEmployees().then(emps => emps.filter(e => e.branch_id && e.branch_id.includes(branchId)))
          ]);
          const lowStockItems = managerStock.filter(item => item.quantity_available <= item.reorder_level);
          return {
            branch,
            summary: {
              totalEmployees: branchEmployees.length,
              totalStock: managerStock.length,
              lowStockAlerts: lowStockItems.length,
              todayRevenue: 0,
              totalRevenue: 0,
              todaySalesCount: 0
            },
            employees: branchEmployees,
            stock: managerStock,
            sales: [],
            lowStockItems,
            weeklyData: []
          };

        case 'sales':
          const salesParams = new URLSearchParams(params).toString();
          const url = `/data/page/sales${salesParams ? `?${salesParams}` : ''}`;
          return api.get(url).then(res => res.data);

        case 'stock':
          if (!branchId) throw new Error('Branch ID required for stock page');
          const stockData = await api.get(`/stock/branch/${branchId}`).then(res => res.data);
          return { stock: stockData, transfers: [], movements: [] };

        case 'logistics':
          const [vehicles, trips, maintenance] = await Promise.all([
            logisticsAPI.getVehicles().catch(() => []),
            logisticsAPI.getTrips(params).catch(() => []),
            logisticsAPI.getAllMaintenance().catch(() => [])
          ]);
          return { vehicles, trips, maintenance };

        case 'orders':
          return await ordersAPI.getAll(params).catch(() => []);

        case 'hr':
          const [employeesData, payrollData] = await Promise.all([
            hrAPI.getEmployees(params).catch(() => []),
            hrAPI.getPayroll(params).catch(() => [])
          ]);
          return { employees: employeesData, payroll: payrollData };

        case 'boss':
          const [bossBranches, bossEmployees, bossStock, bossSales] = await Promise.all([
            branchesAPI.getAll(),
            hrAPI.getEmployees(),
            api.get('/stock/debug').then(res => res.data.stock),
            api.get('/stock/debug').then(res => res.data.sales || [])
          ]);
          const dashboard = {
            totalBranches: bossBranches.length,
            totalEmployees: bossEmployees.length,
            totalStock: bossStock.length,
            totalRevenue: bossSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
          };
          const rotAnalysis = { averageROT: 15.5 };
          return { dashboard, rotAnalysis };

        default:
          throw new Error(`Unknown page: ${page}`);
      }
    } catch (error) {
      console.error(`Error fetching data for ${page}:`, error);
      throw error;
    }
  },

  // Refresh specific data types
  refreshData: {
    stock: (branchId) => stockAPI.getByBranch(branchId),
    sales: (branchId, params) => salesAPI.getByBranch(branchId, params),
    employees: (params) => hrAPI.getEmployees(params),
    vehicles: () => logisticsAPI.getVehicles(),
    orders: (params) => ordersAPI.getAll(params),
    branches: () => branchesAPI.getAll()
  }
};

export default api;