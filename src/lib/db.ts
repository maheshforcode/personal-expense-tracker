import {
  Account,
  AppPreferences,
  Budget,
  Category,
  ExpenseTrackerBackup,
  Transaction,
} from '../types';

const DB_NAME = 'expense_tracker_db';
const DB_VERSION = 1;

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_main',
    name: 'Main Account',
    type: 'main',
    initialBalance: 21000,
    currency: 'INR',
    color: '#7C5CFC',
    notes: 'Primary reserve account holding funds',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'acc_spending',
    name: 'Spending Account',
    type: 'spending',
    initialBalance: 0,
    currency: 'INR',
    color: '#53B1FD',
    notes: 'Daily transactions & regular payments',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_food',
    name: 'Food',
    icon: 'Utensils',
    color: '#F97066',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [
      { id: 'sub_food_snacks', name: 'Snacks' },
      { id: 'sub_food_restaurant', name: 'Restaurant' },
      { id: 'sub_food_tea', name: 'Tea/Coffee' },
      { id: 'sub_food_street', name: 'Street Food' },
      { id: 'sub_food_online', name: 'Online Food' },
    ],
  },
  {
    id: 'cat_groceries',
    name: 'Groceries',
    icon: 'ShoppingBag',
    color: '#32D583',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [
      { id: 'sub_groc_general', name: 'General Grocery' },
      { id: 'sub_groc_veg', name: 'Vegetables' },
      { id: 'sub_groc_fruits', name: 'Fruits' },
      { id: 'sub_groc_house', name: 'Household' },
    ],
  },
  {
    id: 'cat_transport',
    name: 'Transport',
    icon: 'Car',
    color: '#53B1FD',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [
      { id: 'sub_tr_metro', name: 'Metro' },
      { id: 'sub_tr_rickshaw', name: 'Rickshaw' },
      { id: 'sub_tr_bus', name: 'Bus' },
      { id: 'sub_tr_auto', name: 'Auto' },
      { id: 'sub_tr_fuel', name: 'Fuel' },
      { id: 'sub_tr_other', name: 'Other' },
    ],
  },
  {
    id: 'cat_recharge',
    name: 'Recharge & Internet',
    icon: 'Wifi',
    color: '#FEC84B',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [
      { id: 'sub_rec_mobile', name: 'Mobile' },
      { id: 'sub_rec_wifi', name: 'WiFi' },
      { id: 'sub_rec_dth', name: 'DTH' },
      { id: 'sub_rec_other', name: 'Other' },
    ],
  },
  {
    id: 'cat_shopping',
    name: 'Shopping',
    icon: 'ShoppingBag',
    color: '#EE46BC',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [
      { id: 'sub_shop_clothes', name: 'Clothing' },
      { id: 'sub_shop_electronics', name: 'Electronics' },
      { id: 'sub_shop_personal', name: 'Personal' },
      { id: 'sub_shop_home', name: 'Home' },
    ],
  },
  {
    id: 'cat_bills',
    name: 'Bills',
    icon: 'Receipt',
    color: '#FB6514',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [
      { id: 'sub_bills_elec', name: 'Electricity' },
      { id: 'sub_bills_water', name: 'Water' },
      { id: 'sub_bills_gas', name: 'Gas' },
      { id: 'sub_bills_rent', name: 'Rent' },
    ],
  },
  {
    id: 'cat_entertainment',
    name: 'Entertainment',
    icon: 'Film',
    color: '#9B8AFB',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [
      { id: 'sub_ent_movies', name: 'Movies' },
      { id: 'sub_ent_streaming', name: 'Streaming' },
      { id: 'sub_ent_games', name: 'Games' },
      { id: 'sub_ent_outing', name: 'Outing' },
    ],
  },
  {
    id: 'cat_health',
    name: 'Health',
    icon: 'HeartPulse',
    color: '#FD6F8E',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [
      { id: 'sub_health_meds', name: 'Medicines' },
      { id: 'sub_health_doc', name: 'Doctor' },
      { id: 'sub_health_fit', name: 'Fitness' },
    ],
  },
  {
    id: 'cat_gifts',
    name: 'Gifts',
    icon: 'Gift',
    color: '#E067F6',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [
      { id: 'sub_gifts_fam', name: 'Family' },
      { id: 'sub_gifts_friends', name: 'Friends' },
      { id: 'sub_gifts_occ', name: 'Occasion' },
    ],
  },
  {
    id: 'cat_other',
    name: 'Other',
    icon: 'MoreHorizontal',
    color: '#98A2B3',
    type: 'EXPENSE',
    isDefault: true,
    subcategories: [],
  },
  {
    id: 'cat_salary',
    name: 'Salary',
    icon: 'Briefcase',
    color: '#32D583',
    type: 'INCOME',
    isDefault: true,
    subcategories: [],
  },
  {
    id: 'cat_freelance',
    name: 'Freelance',
    icon: 'Laptop',
    color: '#2E90FA',
    type: 'INCOME',
    isDefault: true,
    subcategories: [],
  },
  {
    id: 'cat_investment',
    name: 'Investment / Returns',
    icon: 'TrendingUp',
    color: '#12B76A',
    type: 'INCOME',
    isDefault: true,
    subcategories: [],
  },
];

export const DEFAULT_BUDGETS: Budget[] = [
  { id: 'b_transport', categoryId: 'cat_transport', monthlyAmount: 2000 },
  { id: 'b_recharge', categoryId: 'cat_recharge', monthlyAmount: 800 },
  { id: 'b_food', categoryId: 'cat_food', monthlyAmount: 3500 },
  { id: 'b_groceries', categoryId: 'cat_groceries', monthlyAmount: 2500 },
];

export const DEFAULT_PREFERENCES: AppPreferences = {
  userName: 'Mahesh ;)',
  currency: 'INR',
  currencySymbol: '₹',
  lastUsedAccountId: 'acc_spending',
  theme: 'dark',
  dateFormat: 'DD MMM YYYY',
};

// Initial realistic sample data for September 2026 matching the prompt specification
export const INITIAL_SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_001',
    type: 'INCOME',
    amount: 30000,
    category: 'Salary',
    description: 'Monthly Salary Credit',
    date: '2026-09-01',
    accountId: 'acc_main',
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'tx_002',
    type: 'TRANSFER',
    amount: 6000,
    category: 'Transfer',
    description: 'Monthly spending replenishment',
    date: '2026-09-02',
    accountId: 'acc_main',
    toAccountId: 'acc_spending',
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'tx_003',
    type: 'EXPENSE',
    amount: 500,
    category: 'Recharge & Internet',
    subcategory: 'WiFi',
    description: 'Monthly Broadband bill',
    date: '2026-09-03',
    accountId: 'acc_spending',
    createdAt: '2026-09-03T11:00:00.000Z',
    updatedAt: '2026-09-03T11:00:00.000Z',
  },
  {
    id: 'tx_004',
    type: 'EXPENSE',
    amount: 300,
    category: 'Recharge & Internet',
    subcategory: 'Mobile',
    description: '5G mobile recharge',
    date: '2026-09-04',
    accountId: 'acc_spending',
    createdAt: '2026-09-04T12:00:00.000Z',
    updatedAt: '2026-09-04T12:00:00.000Z',
  },
  {
    id: 'tx_005',
    type: 'EXPENSE',
    amount: 850,
    category: 'Groceries',
    subcategory: 'General Grocery',
    description: 'Monthly cooking staples',
    date: '2026-09-06',
    accountId: 'acc_spending',
    createdAt: '2026-09-06T15:30:00.000Z',
    updatedAt: '2026-09-06T15:30:00.000Z',
  },
  {
    id: 'tx_006',
    type: 'EXPENSE',
    amount: 415,
    category: 'Shopping',
    subcategory: 'Personal',
    description: 'Desk organizer & notebook',
    date: '2026-09-10',
    accountId: 'acc_spending',
    createdAt: '2026-09-10T16:00:00.000Z',
    updatedAt: '2026-09-10T16:00:00.000Z',
  },
  {
    id: 'tx_007',
    type: 'EXPENSE',
    amount: 620,
    category: 'Transport',
    subcategory: 'Metro',
    description: 'Smart card recharge',
    date: '2026-09-12',
    accountId: 'acc_spending',
    createdAt: '2026-09-12T08:30:00.000Z',
    updatedAt: '2026-09-12T08:30:00.000Z',
  },
  {
    id: 'tx_008',
    type: 'EXPENSE',
    amount: 760,
    category: 'Transport',
    subcategory: 'Rickshaw',
    description: 'Weekly commute trips',
    date: '2026-09-15',
    accountId: 'acc_spending',
    createdAt: '2026-09-15T18:45:00.000Z',
    updatedAt: '2026-09-15T18:45:00.000Z',
  },
  {
    id: 'tx_009',
    type: 'EXPENSE',
    amount: 1000,
    category: 'Food',
    subcategory: 'Online Food',
    description: 'Weekend team dinner',
    date: '2026-09-18',
    accountId: 'acc_spending',
    createdAt: '2026-09-18T20:15:00.000Z',
    updatedAt: '2026-09-18T20:15:00.000Z',
  },
  {
    id: 'tx_010',
    type: 'EXPENSE',
    amount: 80,
    category: 'Food',
    subcategory: 'Restaurant',
    description: 'Lunch',
    date: '2026-09-20',
    accountId: 'acc_spending',
    createdAt: '2026-09-20T13:00:00.000Z',
    updatedAt: '2026-09-20T13:00:00.000Z',
  },
  {
    id: 'tx_011',
    type: 'EXPENSE',
    amount: 120,
    category: 'Groceries',
    subcategory: 'General Grocery',
    description: 'Snack items & milk',
    date: '2026-09-21',
    accountId: 'acc_spending',
    createdAt: '2026-09-21T08:00:00.000Z',
    updatedAt: '2026-09-21T08:00:00.000Z',
  },
  {
    id: 'tx_012',
    type: 'EXPENSE',
    amount: 50,
    category: 'Transport',
    subcategory: 'Rickshaw',
    description: 'Rickshaw to metro',
    date: '2026-09-21',
    accountId: 'acc_spending',
    createdAt: '2026-09-21T09:30:00.000Z',
    updatedAt: '2026-09-21T09:30:00.000Z',
  },
  {
    id: 'tx_013',
    type: 'EXPENSE',
    amount: 35,
    category: 'Food',
    subcategory: 'Snacks',
    description: 'Bingo Chips',
    date: '2026-09-21',
    accountId: 'acc_spending',
    createdAt: '2026-09-21T11:45:00.000Z',
    updatedAt: '2026-09-21T11:45:00.000Z',
  },
  {
    id: 'tx_014',
    type: 'EXPENSE',
    amount: 50,
    category: 'Food',
    subcategory: 'Tea/Coffee',
    description: 'Tea with biscuit',
    date: '2026-09-21',
    accountId: 'acc_spending',
    createdAt: '2026-09-21T16:00:00.000Z',
    updatedAt: '2026-09-21T16:00:00.000Z',
  },
];

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not available in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('date', 'date', { unique: false });
          txStore.createIndex('type', 'type', { unique: false });
          txStore.createIndex('accountId', 'accountId', { unique: false });
          txStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        try {
          await this.seedDefaultsIfEmpty(db);
        } catch (e) {
          console.warn('Seeding warning:', e);
        }
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async seedDefaultsIfEmpty(db: IDBDatabase): Promise<void> {
    return new Promise((resolve) => {
      const tx = db.transaction(['accounts', 'categories', 'budgets', 'preferences', 'transactions'], 'readwrite');
      const accStore = tx.objectStore('accounts');
      const catStore = tx.objectStore('categories');
      const bStore = tx.objectStore('budgets');
      const prefStore = tx.objectStore('preferences');
      const txStore = tx.objectStore('transactions');

      const countReq = accStore.count();
      countReq.onsuccess = () => {
        if (countReq.result === 0) {
          DEFAULT_ACCOUNTS.forEach((acc) => accStore.put(acc));
          DEFAULT_CATEGORIES.forEach((cat) => catStore.put(cat));
          DEFAULT_BUDGETS.forEach((b) => bStore.put(b));
          INITIAL_SAMPLE_TRANSACTIONS.forEach((t) => txStore.put(t));
          prefStore.put({ key: 'app_preferences', value: DEFAULT_PREFERENCES });
        }
        resolve();
      };
      countReq.onerror = () => resolve();
    });
  }

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      const req = store.getAll();
      req.onsuccess = () => {
        // filter out soft-deleted
        const all: Transaction[] = req.result || [];
        const active = all.filter((t) => !t.isDeleted);
        // Sort descending by date, then createdAt
        active.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
        resolve(active);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      const req = store.put(transaction);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Accounts ---
  async getAccounts(): Promise<Account[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readonly');
      const store = tx.objectStore('accounts');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || DEFAULT_ACCOUNTS);
      req.onerror = () => reject(req.error);
    });
  }

  async saveAccount(account: Account): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const store = tx.objectStore('accounts');
      const req = store.put(account);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Categories ---
  async getCategories(): Promise<Category[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || DEFAULT_CATEGORIES);
      req.onerror = () => reject(req.error);
    });
  }

  async saveCategory(category: Category): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const req = store.put(category);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Budgets ---
  async getBudgets(): Promise<Budget[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readonly');
      const store = tx.objectStore('budgets');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || DEFAULT_BUDGETS);
      req.onerror = () => reject(req.error);
    });
  }

  async saveBudget(budget: Budget): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readwrite');
      const store = tx.objectStore('budgets');
      const req = store.put(budget);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Preferences ---
  async getPreferences(): Promise<AppPreferences> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('preferences', 'readonly');
      const store = tx.objectStore('preferences');
      const req = store.get('app_preferences');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          const pref = { ...DEFAULT_PREFERENCES, ...req.result.value };
          if (pref.userName === 'Mahi / Mahesh' || !pref.userName) {
            pref.userName = 'Mahesh ;)';
          }
          resolve(pref);
        } else {
          resolve(DEFAULT_PREFERENCES);
        }
      };
      req.onerror = () => resolve(DEFAULT_PREFERENCES);
    });
  }

  async savePreferences(preferences: AppPreferences): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('preferences', 'readwrite');
      const store = tx.objectStore('preferences');
      const req = store.put({ key: 'app_preferences', value: preferences });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Backup & Restore ---
  async exportFullBackup(): Promise<ExpenseTrackerBackup> {
    const [accounts, categories, transactions, budgets, preferences] = await Promise.all([
      this.getAccounts(),
      this.getCategories(),
      this.getTransactions(),
      this.getBudgets(),
      this.getPreferences(),
    ]);

    const backup: ExpenseTrackerBackup = {
      format: 'expense-tracker',
      version: 1,
      metadata: {
        exportedAt: new Date().toISOString(),
        currency: preferences.currency || 'INR',
        appVersion: '1.0.0',
      },
      accounts,
      categories,
      transactions,
      budgets,
      preferences,
    };

    return backup;
  }

  async mergeBackup(backup: ExpenseTrackerBackup, replaceAll = false): Promise<{ added: number; skipped: number }> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['transactions', 'accounts', 'categories', 'budgets', 'preferences'], 'readwrite');
      const txStore = tx.objectStore('transactions');
      const accStore = tx.objectStore('accounts');
      const catStore = tx.objectStore('categories');
      const bStore = tx.objectStore('budgets');
      const prefStore = tx.objectStore('preferences');

      if (replaceAll) {
        txStore.clear();
        accStore.clear();
        catStore.clear();
        bStore.clear();
      }

      let added = 0;
      let skipped = 0;

      // Merge Accounts
      if (Array.isArray(backup.accounts)) {
        backup.accounts.forEach((acc) => {
          accStore.put(acc);
        });
      }

      // Merge Categories
      if (Array.isArray(backup.categories)) {
        backup.categories.forEach((cat) => {
          catStore.put(cat);
        });
      }

      // Merge Budgets
      if (Array.isArray(backup.budgets)) {
        backup.budgets.forEach((b) => {
          bStore.put(b);
        });
      }

      // Merge Preferences
      if (backup.preferences) {
        prefStore.put({ key: 'app_preferences', value: backup.preferences });
      }

      // Merge Transactions safely with duplicate detection
      if (Array.isArray(backup.transactions)) {
        const existingKeysReq = txStore.getAllKeys();
        existingKeysReq.onsuccess = () => {
          const existingKeySet = new Set(existingKeysReq.result.map(String));
          backup.transactions.forEach((item) => {
            if (!item.id) {
              item.id = 'tx_' + Math.random().toString(36).substr(2, 9);
            }
            if (existingKeySet.has(item.id) && !replaceAll) {
              skipped++;
            } else {
              txStore.put(item);
              existingKeySet.add(item.id);
              added++;
            }
          });
        };
      }

      tx.oncomplete = () => resolve({ added, skipped });
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['transactions', 'accounts', 'categories', 'budgets', 'preferences'], 'readwrite');
      tx.objectStore('transactions').clear();
      tx.objectStore('accounts').clear();
      tx.objectStore('categories').clear();
      tx.objectStore('budgets').clear();
      tx.objectStore('preferences').clear();

      // Seed bare minimum default accounts and categories
      DEFAULT_ACCOUNTS.forEach((acc) => {
        tx.objectStore('accounts').put({ ...acc, initialBalance: 0 });
      });
      DEFAULT_CATEGORIES.forEach((cat) => {
        tx.objectStore('categories').put(cat);
      });
      DEFAULT_BUDGETS.forEach((b) => {
        tx.objectStore('budgets').put(b);
      });
      tx.objectStore('preferences').put({ key: 'app_preferences', value: DEFAULT_PREFERENCES });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbStorage = new IndexedDBStorage();

export const initIndexedDB = () => dbStorage.getDB();
export const getAllTransactions = () => dbStorage.getTransactions();
export const getAllAccounts = () => dbStorage.getAccounts();
export const getAllCategories = () => dbStorage.getCategories();
export const getAllBudgets = () => dbStorage.getBudgets();
export const saveTransaction = (t: Transaction) => dbStorage.saveTransaction(t);
export const deleteTransactionById = (id: string) => dbStorage.deleteTransaction(id);
export const saveAccount = (a: Account) => dbStorage.saveAccount(a);
export const saveCategory = (c: Category) => dbStorage.saveCategory(c);
export const deleteCategoryById = (id: string) => dbStorage.deleteCategory(id);
export const saveBudget = (b: Budget) => dbStorage.saveBudget(b);
export const exportFullBackup = () => dbStorage.exportFullBackup();
export const mergeBackupIntoDatabase = (b: ExpenseTrackerBackup, replaceAll = false) => dbStorage.mergeBackup(b, replaceAll);
export const clearAllLocalData = () => dbStorage.clearAllData();
export const getAppPreferences = () => dbStorage.getPreferences();
export const saveAppPreferences = (pref: AppPreferences) => dbStorage.savePreferences(pref);
export const getLastUsedAccountId = async () => (await dbStorage.getPreferences()).lastUsedAccountId;
export const setLastUsedAccountId = async (id: string) => {
  const pref = await dbStorage.getPreferences();
  pref.lastUsedAccountId = id;
  await dbStorage.savePreferences(pref);
};

