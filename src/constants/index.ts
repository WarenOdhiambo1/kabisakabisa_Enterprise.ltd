// Application Constants
export const APP_CONFIG = {
  name: 'BSN Manager',
  version: '2.0.0',
  description: 'Branch Operations Suite',
};

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL || 'https://enterprisebackendltd-iwi8.vercel.app/api',
  timeout: 10000,
  retryAttempts: 3,
};

// UI Constants
export const COLORS = {
  primary: '#90ee90',
  secondary: '#f6f4d2',
  accent: '#ffe5d9',
  background: 'transparent',
  text: '#000000',
  error: '#f44336',
  warning: '#ff9800',
  success: '#4caf50',
  info: '#2196f3',
};

export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

// User Roles
export const USER_ROLES = {
  BOSS: 'boss',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SALES: 'sales',
  HR: 'hr',
  LOGISTICS: 'logistics',
} as const;

// Expense Categories
export const EXPENSE_CATEGORIES = [
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
  { value: 'vehicle_related', label: 'Vehicle Related' },
  { value: 'other', label: 'Other' },
];

// Vehicle Types
export const VEHICLE_TYPES = [
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'car', label: 'Car' },
];

// Payment Methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'check', label: 'Check' },
];

// Table Pagination
export const PAGINATION = {
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
};

// Date Formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  input: 'yyyy-MM-dd',
  timestamp: 'yyyy-MM-dd HH:mm:ss',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  theme: 'bsn_theme',
  sidebarState: 'bsn_sidebar',
  userPreferences: 'bsn_preferences',
  lastBranch: 'bsn_last_branch',
};

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SALES: '/sales',
  STOCK: '/stock',
  LOGISTICS: '/logistics',
  ORDERS: '/orders',
  HR: '/hr',
  EXPENSES: '/expenses',
  FINANCE: '/finance',
  BOSS: '/boss',
  MANAGER: '/manager',
  ADMIN: '/admin',
} as const;