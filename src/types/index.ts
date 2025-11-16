// Core Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'boss' | 'manager' | 'admin' | 'sales' | 'hr' | 'logistics';
  branchId?: string;
  branch_id?: string[];
}

export interface Branch {
  id: string;
  branch_name: string;
  name?: string;
  location?: string;
  manager_id?: string[];
}

export interface Product {
  id: string;
  product_id: string;
  product_name: string;
  quantity_available: number;
  unit_price: number;
  reorder_level: number;
  branch_id?: string[];
}

export interface Sale {
  id: string;
  sale_date: string;
  total_amount: number;
  customer_name?: string;
  employee_id?: string[];
  branch_id?: string[];
  payment_method?: string;
}

export interface Employee {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  role: string;
  branch_id?: string[];
  salary?: number;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: string;
  status: 'active' | 'maintenance' | 'inactive';
  purchase_date?: string;
  current_branch_id?: string[];
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  description: string;
  branch_id?: string[];
  vehicle_id?: string[];
  receipt_number?: string;
  supplier_name?: string;
}

// State Interfaces
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface BranchState {
  branches: Branch[];
  currentBranch: Branch | null;
  loading: boolean;
  error: string | null;
}

export interface InventoryState {
  products: Product[];
  stockMovements: any[];
  transfers: any[];
  loading: boolean;
  error: string | null;
  filters: {
    branch: string | null;
    category: string | null;
    lowStock: boolean;
  };
}

export interface SalesState {
  sales: Sale[];
  currentSale: Sale | null;
  loading: boolean;
  error: string | null;
  filters: {
    branch: string | null;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export interface EmployeeState {
  employees: Employee[];
  currentEmployee: Employee | null;
  loading: boolean;
  error: string | null;
}

export interface VehicleState {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Form Types
export interface SaleFormData {
  customer_name?: string;
  payment_method: string;
  items: SaleItem[];
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ExpenseFormData {
  expense_date: string;
  category: string;
  amount: number;
  description: string;
  vehicle_id?: string;
  receipt_number?: string;
  supplier_name?: string;
}

// Component Props Types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}