export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type?: 'EXPENSE' | 'INCOME' | 'BOTH';
  subcategories?: SubCategory[];
  isDefault?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'main' | 'spending' | 'other';
  initialBalance: number;
  currency: string;
  color?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  subcategory?: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  accountId: string; // source account for EXPENSE & INCOME, fromAccount for TRANSFER
  toAccountId?: string; // destination account for TRANSFER
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean; // soft-delete support for future sync
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyAmount: number;
  period?: 'monthly' | 'yearly';
}

export interface AppPreferences {
  userName?: string;
  currency: string;
  currencySymbol: string;
  lastUsedAccountId: string;
  theme: 'dark';
  dateFormat: string;
}

export interface BackupMetadata {
  exportedAt: string;
  currency: string;
  appVersion?: string;
  deviceInfo?: string;
}

export interface ExpenseTrackerBackup {
  format: 'expense-tracker';
  version: number;
  metadata: BackupMetadata;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  preferences?: Partial<AppPreferences>;
}

export type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';
