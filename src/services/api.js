import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://enterprisebackendltd-iwi8.vercel.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and CSRF protection
api.interceptors.request.use(
  async (config) => {
    console.log(`[API REQUEST] ${config.method.toUpperCase()} ${config.url}`);
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CSRF disabled for production compatibility
    
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE] ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('[API ERROR]', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[API] Attempting token refresh...');
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

          console.log('[API] Token refreshed successfully');
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API ERROR] Token refresh failed, redirecting to login');
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
  register: (data) => api.post('/auth/register', data, { timeout: 90000 }).then(res => res.data),
  login: (credentials) => api.post('/auth/login', credentials, { timeout: 90000 }).then(res => res.data),
  setupMFA: (userId) => api.post('/auth/setup-mfa', { userId }).then(res => res.data),
  verifyMFA: (userId, token) => api.post('/auth/verify-mfa', { userId, token }).then(res => res.data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then(res => res.data),
  changePassword: (data) => api.post('/auth/change-password', data).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
};

// Branches API
export const branchesAPI = {
  getPublic: () => api.get('/branches/public').then(res => res.data).catch(() => [
    {
      id: 'mock1',
      name: 'Main Branch',
      address: '123 Main Street, Nairobi, Kenya',
      latitude: -1.2921,
      longitude: 36.8219,
      phone: '+254712345678',
      email: 'main@kabisakabisa.com'
    }
  ]),
  getAll: () => api.get('/branches').then(res => res.data).catch(() => []),
  getById: (id) => api.get(`/branches/${id}`).then(res => res.data),
  create: (data) => api.post('/branches', data).then(res => res.data),
  update: (id, data) => api.put(`/branches/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/branches/${id}`).then(res => res.data),
};

// Stock API - using dedicated routes like logistics
export const stockAPI = {
  getAll: () => api.get('/stock').then(res => res.data),
  getByBranch: (branchId) => api.get(`/stock/branch/${branchId}`).then(res => res.data),
  addStock: (branchId, data) => api.post('/stock', { ...data, branchId, branch_id: [branchId] }).then(res => res.data),
  addQuantity: (stockId, quantity) => api.post(`/stock/${stockId}/add-quantity`, { quantity }).then(res => res.data),
  transfer: (data) => {
    console.log('Transfer API called with:', data);
    return api.post('/stock/transfer', data).then(res => {
      console.log('Transfer API response:', res.data);
      return res.data;
    }).catch(err => {
      console.error('Transfer API error:', err.response?.data || err.message);
      throw err;
    });
  },
  getPendingTransfers: (branchId) => api.get(`/stock/transfers/pending/${branchId}`).then(res => res.data),
  approveTransfer: (transferId) => api.put(`/stock/transfers/${transferId}/approve`).then(res => res.data),
  rejectTransfer: (transferId, data) => api.put(`/stock/transfers/${transferId}/reject`, data).then(res => res.data),
  getTransferReceipt: (transferId) => api.get(`/stock/transfers/${transferId}/receipt`).then(res => res.data),
  getAllTransfers: (params) => api.get('/stock/transfers', { params }).then(res => res.data),
  getMovements: (branchId, params) => api.get(`/stock/movements/${branchId}`, { params }).then(res => res.data),
  updateStock: (stockId, data) => api.put(`/stock/${stockId}`, data).then(res => res.data),
  deleteStock: (stockId) => api.delete(`/stock/${stockId}`).then(res => res.data),
};

// Sales API - using dedicated routes like logistics
export const salesAPI = {
  getByBranch: (branchId, params) => api.get(`/sales/branch/${branchId}`, { params }).then(res => res.data),
  createSale: (data) => api.post('/sales', data).then(res => res.data),
  getDailySummary: (branchId, date) => api.get(`/sales/summary/daily/${branchId}`, { params: { date } }).then(res => res.data),
  recordExpense: (branchId, data) => api.post(`/sales/expenses/branch/${branchId}`, data).then(res => res.data),
  getExpenses: (branchId, params) => api.get(`/sales/expenses/branch/${branchId}`, { params }).then(res => res.data),
  getFundsTracking: (branchId, date) => api.get(`/sales/funds/branch/${branchId}`, { params: { date } }).then(res => res.data),
  updateSale: (saleId, data) => api.put(`/sales/${saleId}`, data).then(res => res.data),
};

// Logistics API
export const logisticsAPI = {
  // Vehicles
  getVehicles: (params) => api.get('/logistics/vehicles', { params }).then(res => res.data),
  getVehicle: (id) => api.get(`/logistics/vehicles/${id}`).then(res => res.data),
  createVehicle: (data) => api.post('/logistics/vehicles', data).then(res => res.data),
  updateVehicle: (id, data) => api.put(`/logistics/vehicles/${id}`, data).then(res => res.data),
  deleteVehicle: (id) => api.delete(`/logistics/vehicles/${id}`).then(res => res.data),
  
  // Trips
  getTrips: (params) => api.get('/logistics/trips', { params }).then(res => res.data),
  getTrip: (id) => api.get(`/logistics/trips/${id}`).then(res => res.data),
  createTrip: (data) => api.post('/logistics/trips', data).then(res => res.data),
  updateTrip: (id, data) => api.put(`/logistics/trips/${id}`, data).then(res => res.data),
  deleteTrip: (id) => api.delete(`/logistics/trips/${id}`).then(res => res.data),
  
  // Maintenance
  getAllMaintenance: () => api.get('/logistics/maintenance').then(res => res.data),
  getMaintenance: (id) => api.get(`/logistics/maintenance/${id}`).then(res => res.data),
  createMaintenance: (data) => api.post('/logistics/maintenance', data).then(res => res.data),
  updateMaintenance: (id, data) => api.put(`/logistics/maintenance/${id}`, data).then(res => res.data),
  deleteMaintenance: (id) => api.delete(`/logistics/maintenance/${id}`).then(res => res.data),
  
  // Dashboard
  getDashboard: () => api.get('/logistics/dashboard').then(res => res.data),
};

// Packages API
export const packagesAPI = {
  getAll: (params) => api.get('/packages', { params }).then(res => res.data),
  getById: (id) => api.get(`/packages/${id}`).then(res => res.data),
  create: (data) => api.post('/packages', data).then(res => res.data),
  update: (id, data) => api.put(`/packages/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/packages/${id}`).then(res => res.data),
  updateStatus: (id, data) => api.patch(`/packages/${id}/status`, data).then(res => res.data),
};

// Logistics Transactions API
export const logisticsTransactionsAPI = {
  getAll: (params = {}) => api.get('/logistics-transactions', { params }).then(res => res.data),
  getById: (id) => api.get(`/logistics-transactions/${id}`).then(res => res.data),
  create: (data) => api.post('/logistics-transactions', data).then(res => res.data),
  update: (id, data) => api.put(`/logistics-transactions/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/logistics-transactions/${id}`).then(res => res.data),
  getAnalytics: (params = {}) => api.get('/logistics-transactions/analytics', { params }).then(res => res.data)
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
  getReceipts: (id) => api.get(`/orders/${id}/receipts`).then(res => res.data),
};

// HR API
export const hrAPI = {
  getEmployees: (params) => api.get('/hr/employees', { params }).then(res => res.data.employees || res.data),
  createEmployee: (data) => api.post('/hr/employees', data).then(res => res.data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}`, data).then(res => res.data),
  deleteEmployee: (id) => api.delete(`/hr/employees/${id}`).then(res => res.data),
  generatePayroll: (data) => api.post('/hr/payroll/generate', data).then(res => res.data),
  getPayroll: (params) => api.get('/hr/payroll', { params }).then(res => res.data.payroll_records || res.data),
  sendPayslips: (payrollIds) => api.post('/hr/payroll/send-payslips', { payroll_ids: payrollIds }).then(res => res.data),
  bulkUpdatePayroll: (payrollIds, status) => api.patch('/hr/payroll/bulk-update', { payroll_ids: payrollIds, status }).then(res => res.data),
  getDriverStats: () => api.get('/hr/drivers/stats').then(res => res.data),
  getBranches: () => api.get('/hr/branches').then(res => res.data.branches || res.data),
  getDashboard: () => api.get('/hr/dashboard').then(res => res.data),
  getDocuments: (params) => api.get('/hr/documents', { params }).then(res => res.data.documents || res.data),
  getAuditLogs: (params) => api.get('/hr/audit-logs', { params }).then(res => res.data.audit_logs || res.data),
  getEmployeePerformance: (employeeId, params) => api.get(`/hr/employees/${employeeId}/performance`, { params }).then(res => res.data),
  getDepartmentSummary: (params) => api.get('/hr/departments/summary', { params }).then(res => res.data),
  getAttendance: (params) => api.get('/hr/attendance', { params }).then(res => res.data),
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

// Enhanced Expenses API
export const expensesAPI = {
  // New architecture endpoints
  getAll: (params) => api.get('/expenses', { params }).then(res => res.data.success ? res.data.data : res.data),
  getById: (expenseDate) => api.get(`/expenses/${expenseDate}`).then(res => res.data.success ? res.data.data : res.data),
  getByBranch: (branchId, params) => api.get(`/expenses/branches/${branchId}/expenses`, { params }).then(res => res.data.success ? res.data.data : res.data),
  getByVehicle: (vehicleId, params) => api.get(`/expenses/vehicles/${vehicleId}/expenses`, { params }).then(res => res.data.success ? res.data.data : res.data),
  getAnalytics: (params) => api.get('/expenses/analytics', { params }).then(res => res.data.success ? res.data.data : res.data),
  create: (data) => api.post('/expenses', data).then(res => res.data.success ? res.data.data : res.data),
  bulkCreate: (data) => api.post('/expenses/bulk', data).then(res => res.data.success ? res.data.data : res.data),
  
  // Legacy dashboard methods (kept for compatibility)
  getDashboardSummary: (params) => api.get('/expenses/dashboard/summary', { params }).then(res => res.data),
  getTrends: (params) => api.get('/expenses/dashboard/trends', { params }).then(res => res.data),
  
  // Direct expenses (legacy)
  getDirectExpenses: (params) => api.get('/expenses/direct', { params }).then(res => res.data),
  createDirectExpense: (data) => api.post('/expenses/direct', data).then(res => res.data),
  updateDirectExpense: (id, data) => api.put(`/expenses/direct/${id}`, data).then(res => res.data),
  deleteDirectExpense: (id) => api.delete(`/expenses/direct/${id}`).then(res => res.data),
  
  // Legacy methods (kept for compatibility)
  update: (id, data) => api.put(`/expenses/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/expenses/${id}`).then(res => res.data),
  getCategories: () => Promise.resolve([
    { value: 'fuel', label: 'Fuel' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'vehicle_related', label: 'Vehicle Related' },
    { value: 'other', label: 'Other' }
  ]),
  getSummary: (params) => expensesAPI.getDashboardSummary(params),
};

// Enhanced Stock API with more endpoints
export const stockAPIEnhanced = {
  ...stockAPI,
  getAll: () => api.get('/stock').then(res => res.data),
  getLowStock: (branchId) => api.get(`/stock/low-stock/${branchId}`).then(res => res.data),
  getMovements: (branchId, params) => api.get(`/stock/movements/${branchId}`, { params }).then(res => res.data),
};

// Update stockAPI to include missing methods using dedicated routes
stockAPI.getPendingTransfers = (branchId) => api.get(`/stock/transfers/pending/${branchId}`).then(res => res.data);
stockAPI.approveTransfer = (transferId) => api.put(`/stock/transfers/${transferId}/approve`).then(res => res.data);
stockAPI.rejectTransfer = (transferId, data) => api.put(`/stock/transfers/${transferId}/reject`, data).then(res => res.data);
stockAPI.getTransferReceipt = (transferId) => api.get(`/stock/transfers/${transferId}/receipt`).then(res => res.data);
stockAPI.getAllTransfers = (params) => api.get('/stock/transfers', { params }).then(res => res.data);

// Finance API
export const financeAPI = {
  getAnalytics: (params) => api.get('/finance/analytics', { params }).then(res => res.data),
  getProductCosts: () => api.get('/finance/product-costs').then(res => res.data),
};

// Bills API
export const billsAPI = {
  getDashboard: () => api.get('/bills/dashboard').then(res => res.data),
  getList: (params) => api.get('/bills/list', { params }).then(res => res.data),
  getById: (id) => api.get(`/bills/${id}`).then(res => res.data),
  create: (data) => api.post('/bills', data).then(res => res.data),
  updateStatus: (id, data) => api.put(`/bills/${id}/status`, data).then(res => res.data),
  recordPayment: (id, data) => api.post(`/bills/${id}/payment`, data).then(res => res.data),
  bulkApprove: (billIds) => api.post('/bills/bulk-approve', { billIds }).then(res => res.data),
  delete: (id) => api.delete(`/bills/${id}`).then(res => res.data),
};

// Payments API
export const paymentsAPI = {
  getDashboard: () => api.get('/payments/dashboard').then(res => res.data),
  getQueue: () => api.get('/payments/queue').then(res => res.data),
  getAll: (params) => api.get('/payments', { params }).then(res => res.data),
  process: (data) => api.post('/payments/process', data).then(res => res.data),
  batchProcess: (payments) => api.post('/payments/batch', { payments }).then(res => res.data),
  updateStatus: (id, data) => api.put(`/payments/${id}/status`, data).then(res => res.data),
};

// Vendor Credits API
export const vendorCreditsAPI = {
  getAll: (params) => api.get('/vendor-credits', { params }).then(res => res.data),
  create: (data) => api.post('/vendor-credits', data).then(res => res.data),
  update: (id, data) => api.put(`/vendor-credits/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/vendor-credits/${id}`).then(res => res.data),
  apply: (id, billId) => api.post(`/vendor-credits/${id}/apply`, { bill_id: billId }).then(res => res.data),
  approve: (id, notes) => api.post(`/vendor-credits/${id}/approve`, { notes }).then(res => res.data),
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
          
        case 'expenses':
          const [allExpensesData, expenseAnalytics] = await Promise.all([
            expensesAPI.getAll(params).catch(() => []),
            expensesAPI.getAnalytics(params).catch(() => {})
          ]);
          return { expenses: allExpensesData, analytics: expenseAnalytics };

        case 'manager':
          if (!branchId) throw new Error('Branch ID required for manager page');
          const [branch, managerStock, branchEmployees, managerSales] = await Promise.all([
            branchesAPI.getById(branchId),
            api.get(`/stock/branch/${branchId}`).then(res => res.data),
            hrAPI.getEmployees().then(emps => emps.filter(e => e.branch_id && e.branch_id.includes(branchId))),
            api.get(`/sales/branch/${branchId}`).then(res => res.data).catch(() => [])
          ]);
          const lowStockItems = managerStock.filter(item => item.quantity_available <= item.reorder_level);
          const todayRevenue = managerSales
            .filter(s => s.sale_date === new Date().toISOString().split('T')[0])
            .reduce((sum, s) => sum + (s.total_amount || 0), 0);
          return {
            branch,
            summary: {
              totalEmployees: branchEmployees.length,
              totalStock: managerStock.length,
              lowStockAlerts: lowStockItems.length,
              todayRevenue,
              totalRevenue: managerSales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
              todaySalesCount: managerSales.filter(s => s.sale_date === new Date().toISOString().split('T')[0]).length
            },
            employees: branchEmployees,
            stock: managerStock,
            sales: managerSales,
            lowStockItems,
            weeklyData: []
          };

        case 'sales':
          if (!branchId) throw new Error('Branch ID required for sales page');
          const [salesData, stockForSales, expensesData] = await Promise.all([
            api.get(`/sales/branch/${branchId}`, { params }).then(res => res.data),
            api.get(`/stock/branch/${branchId}`).then(res => res.data),
            api.get(`/sales/expenses/branch/${branchId}`, { params }).then(res => res.data)
          ]);
          return { sales: salesData, stock: stockForSales, expenses: expensesData };

        case 'stock':
          if (!branchId) throw new Error('Branch ID required for stock page');
          const [stockData, transfers, movements] = await Promise.all([
            api.get(`/stock/branch/${branchId}`).then(res => res.data),
            api.get(`/stock/transfers/pending/${branchId}`).then(res => res.data).catch(() => []),
            api.get(`/stock/movements/${branchId}`).then(res => res.data).catch(() => [])
          ]);
          return { stock: stockData, transfers, movements };

        case 'logistics':
          const [vehicles, trips, maintenance, packages, logisticsDashboard] = await Promise.all([
            logisticsAPI.getVehicles().catch(() => []),
            logisticsAPI.getTrips(params).catch(() => []),
            logisticsAPI.getAllMaintenance().catch(() => []),
            packagesAPI.getAll().catch(() => []),
            logisticsAPI.getDashboard().catch(() => ({}))
          ]);
          return { vehicles, trips, maintenance, packages, dashboard: logisticsDashboard };

        case 'orders':
          return await ordersAPI.getAll(params).catch(() => []);

        case 'hr':
          const [employeesData, payrollData, branchesData] = await Promise.all([
            hrAPI.getEmployees(params).catch(() => []),
            hrAPI.getPayroll(params).catch(() => []),
            hrAPI.getBranches().catch(() => [])
          ]);
          return { employees: employeesData, payroll: payrollData, branches: branchesData };

        case 'boss':
          const [bossBranches, bossEmployees, bossStock] = await Promise.all([
            branchesAPI.getAll(),
            hrAPI.getEmployees(),
            api.get('/stock').then(res => res.data)
          ]);
          const bossDashboard = {
            totalBranches: bossBranches.length,
            totalEmployees: bossEmployees.length,
            totalStock: bossStock.length,
            totalRevenue: 0
          };
          const rotAnalysis = { averageROT: 15.5 };
          return { dashboard: bossDashboard, rotAnalysis };

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
    stock: (branchId) => api.get(`/stock/branch/${branchId}`).then(res => res.data),
    sales: (branchId, params) => api.get(`/sales/branch/${branchId}`, { params }).then(res => res.data),
    employees: (params) => hrAPI.getEmployees(params),
    vehicles: () => logisticsAPI.getVehicles(),
    orders: (params) => ordersAPI.getAll(params),
    branches: () => branchesAPI.getAll()
  }
};

export default api;