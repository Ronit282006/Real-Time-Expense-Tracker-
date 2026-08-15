export interface UserProfile {
  profile_id: number;
  name: string;
  email: string;
  mobile_number: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at?: string | null;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string | null;
  transaction_datetime: string;
  created_at: string;
  updated_at: string | null;
}

export interface PaginatedTransactions {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  items: Transaction[];
}

export interface DashboardData {
  total_income: number;
  total_expense: number;
  current_balance: number;
  transaction_count: number;
  monthly_income: number;
  monthly_expense: number;
  top_expense_category: string | null;
  recent_transactions: Transaction[];
  monthly_summary: MonthlySummary[];
  expense_by_category: CategoryExpense[];
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

/* ─── Admin Panel ─── */

export interface AdminUser extends UserProfile {
  total_income: number;
  total_expense: number;
  transaction_count: number;
}

export interface AdminUserList {
  total: number;
  users: AdminUser[];
}

export interface AdminTransaction {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string | null;
  transaction_datetime: string;
  created_at: string;
  updated_at: string | null;
}

export interface AdminTransactionList {
  total: number;
  transactions: AdminTransaction[];
}

export interface SuspiciousTransaction {
  transaction: AdminTransaction;
  reason: string;
  threshold: number;
}

export interface SuspiciousList {
  threshold: number;
  count: number;
  transactions: SuspiciousTransaction[];
}

export interface Category {
  id: number;
  name: string;
  is_active: boolean;
}

export interface MonthlyCount {
  month: string;
  count: number;
}

export interface TopSpender {
  profile_id: number;
  name: string;
  email: string;
  total_income: number;
  total_expense: number;
  transaction_count: number;
}

export interface CategoryAnalyticsItem {
  category: string;
  count: number;
  total_amount: number;
  income_amount: number;
  expense_amount: number;
}

export interface PlatformStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_transactions: number;
  total_income: number;
  total_expense: number;
  platform_balance: number;
  avg_income_per_user: number;
  avg_expense_per_user: number;
  new_users_per_month: MonthlyCount[];
  usage_trends: MonthlyCount[];
  top_spenders: TopSpender[];
  top_categories: CategoryAnalyticsItem[];
}
