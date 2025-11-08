import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://enterprisebackendltd.vercel.app/api';

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
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for state-changing requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
      const csrfToken = Cookies.get('csrfToken');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
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

// Stock API
export const stockAPI = {
  getByBranch: (branchId) => api.get(`/stock/branch/${branchId}`).then(res => res.data),
  addStock: (branchId, data) => api.post(`/stock/branch/${branchId}`, data).then(res => res.data),
  addQuantity: (stockId, quantity) => api.patch(`/stock/${stockId}/add-quantity`, { quantity }).then(res => res.data),
  transfer: (data) => api.post('/stock/transfer', data).then(res => res.data),
  getPendingTransfers: (branchId) => api.get(`/stock/transfers/pending/${branchId}`).then(res => res.data),
  approveTransfer: (transferId) => api.patch(`/stock/transfers/${transferId}/approve`).then(res => res.data),
  rejectTransfer: (transferId) => api.patch(`/stock/transfers/${transferId}/reject`).then(res => res.data),
  updateStock: (stockId, data) => api.put(`/stock/${stockId}`, data).then(res => res.data),
  deleteStock: (stockId) => api.delete(`/stock/${stockId}`).then(res => res.data),
};

// Sales API
export const salesAPI = {
  getByBranch: (branchId, params) => api.get(`/sales/branch/${branchId}`, { params }).then(res => res.data),
  createSale: (branchId, data) => api.post(`/sales/branch/${branchId}`, data).then(res => res.data),
  getDailySummary: (branchId, date) => api.get(`/sales/summary/daily/${branchId}`, { params: { date } }).then(res => res.data),
  recordExpense: (branchId, data) => api.post(`/sales/expenses/branch/${branchId}`, data).then(res => res.data),
  getExpenses: (branchId, params) => api.get(`/sales/expenses/branch/${branchId}`, { params }).then(res => res.data),
  getFundsTracking: (branchId, date) => api.get(`/sales/funds/branch/${branchId}`, { params: { date } }).then(res => res.data),
  updateSale: (saleId, data) => api.put(`/sales/${saleId}`, data).then(res => res.data),
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
};

// HR API
export const hrAPI = {
  getEmployees: (params) => api.get('/hr/employees', { params }).then(res => res.data),
  createEmployee: (data) => api.post('/hr/employees', data).then(res => res.data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}`, data).then(res => res.data),
  deleteEmployee: (id) => api.delete(`/hr/employees/${id}`).then(res => res.data),
  generatePayroll: (data) => api.post('/hr/payroll/generate', data).then(res => res.data),
  getPayroll: (params) => api.get('/hr/payroll', { params }).then(res => res.data),
  sendPayslips: (payrollIds) => api.post('/hr/payroll/send-payslips', { payrollIds }).then(res => res.data),
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
  getPageData: async (page, branchId = null, params = {}) => {
    try {
      switch (page) {
        case 'admin':
          const [branches, employees, debugData] = await Promise.all([
            branchesAPI.getAll().catch(() => []),
            hrAPI.getEmployees().catch(() => []),
            api.get('/stock/debug').then(res => res.data).catch(() => ({ stock: [] }))
          ]);
          const allStock = debugData.stock || [];
          const products = allStock.map(item => ({
            id: item.id,
            product_name: item.product_name,
            product_id: item.product_id,
            unit_price: item.unit_price || 0,
            quantity_available: item.quantity_available || 0,
            branch_id: item.branch_id,
            reorder_level: item.reorder_level || 10
          }));
          const overview = {
            totalBranches: branches.length,
            totalEmployees: employees.length,
            totalProducts: products.length
          };
          return { overview, products, branches, employees };

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
          if (!branchId) throw new Error('Branch ID required for sales page');
          const salesStock = await api.get(`/stock/branch/${branchId}`).then(res => res.data);
          return { stock: salesStock, sales: [], expenses: [] };

        case 'stock':
          if (!branchId) throw new Error('Branch ID required for stock page');
          const stockData = await api.get(`/stock/branch/${branchId}`).then(res => res.data);
          return { stock: stockData, transfers: [], movements: [] };

        case 'logistics':
          const [vehicles, trips] = await Promise.all([
            logisticsAPI.getVehicles().catch(() => []),
            logisticsAPI.getTrips(params).catch(() => [])
          ]);
          
          // Get maintenance data directly from Airtable
          let maintenance = [];
          try {
            const maintenanceResponse = await api.get('/data/Vehicle_Maintenance');
            maintenance = maintenanceResponse.data || [];
          } catch (error) {
            console.log('Maintenance fetch failed:', error.message);
            maintenance = [];
          }
          
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