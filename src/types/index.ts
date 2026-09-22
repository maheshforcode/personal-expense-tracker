export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'RECHARGE';

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
  amount: number; // For EXPENSE/INCOME/TRANSFER: amount. For RECHARGE: total amount paid deducted from account
  category: string;
  subcategory?: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  accountId: string; // source account for EXPENSE, INCOME, TRANSFER, RECHARGE
  toAccountId?: string; // destination account for TRANSFER
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean; // soft-delete support for future sync

  // Prepaid / Recharge specific fields
  prepaidId?: string; // Unique id for the prepaid wallet/card (e.g. 'prep_metro')
  prepaidName?: string; // Display name e.g. 'Metro Card' or 'FASTag'
  creditedAmount?: number; // Actual amount added to prepaid balance (e.g. 294)
  fee?: number; // Fee/charge (e.g. 6). Note: amount = creditedAmount + fee
  paymentMode?: 'account' | 'prepaid'; // 'account' = paid via bank account, 'prepaid' = deducted from prepaid card
}

export interface PrepaidWallet {
  id: string;
  name: string;
  category: string;
  icon?: string;
  color?: string;
  balance: number;
  totalCredited: number;
  totalSpent: number;
  totalFees: number;
  lastUsedDate?: string;
  transactionCount: number;
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
