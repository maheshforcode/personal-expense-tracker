import { Account, Budget, Category, ExpenseTrackerBackup, Transaction } from '../types';

export interface FileValidationResult {
  fileName: string;
  isValid: boolean;
  error?: string;
  backup?: ExpenseTrackerBackup;
}

export interface MergedDatasetSummary {
  filesCount: number;
  totalTransactions: number;
  accountsCount: number;
  categoriesCount: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  duplicateTransactionsSkipped: number;
}

export function validateAndParseBackupContent(jsonString: string, fileName: string): FileValidationResult {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      return {
        fileName,
        isValid: false,
        error: 'This file is not a valid Expense Tracker backup.',
      };
    }

    if (data.format !== 'expense-tracker') {
      return {
        fileName,
        isValid: false,
        error: 'This file is not a valid Expense Tracker backup.',
      };
    }

    if (typeof data.version !== 'number' || data.version > 1) {
      return {
        fileName,
        isValid: false,
        error: 'This backup was created by a newer version of the application.',
      };
    }

    if (!Array.isArray(data.transactions) || !Array.isArray(data.accounts)) {
      return {
        fileName,
        isValid: false,
        error: 'The file format is invalid or corrupted.',
      };
    }

    return {
      fileName,
      isValid: true,
      backup: data as ExpenseTrackerBackup,
    };
  } catch {
    return {
      fileName,
      isValid: false,
      error: 'Unable to read this backup file. The JSON is malformed.',
    };
  }
}

export function mergeBackupDatasets(parsedBackups: ExpenseTrackerBackup[]): MergedDatasetSummary {
  const transactionMap = new Map<string, Transaction>();
  const accountMap = new Map<string, Account>();
  const categoryMap = new Map<string, Category>();
  const budgetMap = new Map<string, Budget>();

  let duplicateTransactionsSkipped = 0;

  for (const backup of parsedBackups) {
    // Accounts
    if (Array.isArray(backup.accounts)) {
      for (const acc of backup.accounts) {
        if (acc && acc.id) {
          if (!accountMap.has(acc.id)) {
            accountMap.set(acc.id, acc);
          }
        }
      }
    }

    // Categories
    if (Array.isArray(backup.categories)) {
      for (const cat of backup.categories) {
        if (cat && (cat.id || cat.name)) {
          const key = cat.id || cat.name.toLowerCase();
          if (!categoryMap.has(key)) {
            categoryMap.set(key, cat);
          } else {
            // merge subcategories if present
            const existing = categoryMap.get(key)!;
            if (cat.subcategories && Array.isArray(cat.subcategories)) {
              const subMap = new Map(existing.subcategories?.map((s) => [s.name.toLowerCase(), s]) || []);
              for (const sub of cat.subcategories) {
                if (!subMap.has(sub.name.toLowerCase())) {
                  subMap.set(sub.name.toLowerCase(), sub);
                }
              }
              existing.subcategories = Array.from(subMap.values());
            }
          }
        }
      }
    }

    // Budgets
    if (Array.isArray(backup.budgets)) {
      for (const b of backup.budgets) {
        if (b && (b.id || b.categoryId)) {
          const key = b.categoryId || b.id;
          if (!budgetMap.has(key)) {
            budgetMap.set(key, b);
          }
        }
      }
    }

    // Transactions with Duplicate Detection by unique ID
    if (Array.isArray(backup.transactions)) {
      for (const tx of backup.transactions) {
        if (!tx) continue;
        const txId = tx.id || `${tx.date}_${tx.amount}_${tx.category}_${tx.description || ''}`;

        if (transactionMap.has(txId)) {
          duplicateTransactionsSkipped++;
        } else {
          transactionMap.set(txId, { ...tx, id: txId });
        }
      }
    }
  }

  const transactions = Array.from(transactionMap.values());
  // Sort descending by date
  transactions.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  // Determine date range
  let startDate = '';
  let endDate = '';

  if (transactions.length > 0) {
    const dates = transactions.map((t) => t.date).filter(Boolean).sort();
    if (dates.length > 0) {
      startDate = dates[0];
      endDate = dates[dates.length - 1];
    }
  }

  return {
    filesCount: parsedBackups.length,
    totalTransactions: transactions.length,
    accountsCount: accountMap.size,
    categoriesCount: categoryMap.size,
    dateRange: {
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
    },
    transactions,
    accounts: Array.from(accountMap.values()),
    categories: Array.from(categoryMap.values()),
    budgets: Array.from(budgetMap.values()),
    duplicateTransactionsSkipped,
  };
}
