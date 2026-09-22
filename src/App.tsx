'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  ArrowRightLeft,
  Wallet,
  Loader2,
  Download,
} from 'lucide-react';
import { Account, Budget, Category, ExpenseTrackerBackup, PrepaidWallet, TimePeriod, Transaction, TransactionType } from './types';
import {
  initIndexedDB,
  getAllTransactions,
  getAllAccounts,
  getAllCategories,
  getAllBudgets,
  saveTransaction,
  deleteTransactionById,
  saveAccount,
  saveCategory,
  deleteCategoryById,
  saveBudget,
  exportFullBackup,
  mergeBackupIntoDatabase,
  clearAllLocalData,
  getLastUsedAccountId,
  setLastUsedAccountId,
  getAppPreferences,
  saveAppPreferences,
} from './lib/db';
import { calculatePrepaidWallets } from './lib/financials';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AccountsView } from './components/AccountsView';
import { AnalysisView } from './components/AnalysisView';
import { SettingsView } from './components/SettingsView';
import { AddExpenseModal } from './components/AddExpenseModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { UnderlyingTransactionsModal } from './components/UnderlyingTransactionsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'accounts' | 'analysis' | 'settings'>('dashboard');

  // Application Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [lastUsedAccId, setLastUsedAccId] = useState<string>('acc_spending');
  const [userName, setUserName] = useState<string>('Mahesh ;)');

  // Dashboard filter period
  const [dashboardPeriod, setDashboardPeriod] = useState<TimePeriod>('month');

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [addExpenseDefaultType, setAddExpenseDefaultType] = useState<TransactionType>('EXPENSE');
  const [preselectedPrepaidId, setPreselectedPrepaidId] = useState<string | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Derived prepaid wallets
  const prepaidWallets = useMemo(() => calculatePrepaidWallets(transactions), [transactions]);

  // Deletion modal state
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mobile detail modal
  const [mobileDetailTransaction, setMobileDetailTransaction] = useState<Transaction | null>(null);

  // Drilldown modal state
  const [drillDownState, setDrillDownState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    transactions: Transaction[];
  }>({
    isOpen: false,
    title: '',
    transactions: [],
  });

  // Reload data from IndexedDB
  const reloadData = useCallback(async () => {
    try {
      const [txList, accList, catList, bgtList, lastAcc, prefs] = await Promise.all([
        getAllTransactions(),
        getAllAccounts(),
        getAllCategories(),
        getAllBudgets(),
        getLastUsedAccountId(),
        getAppPreferences(),
      ]);

      setTransactions(txList);
      setAccounts(accList);
      setCategories(catList);
      setBudgets(bgtList);
      setLastUsedAccId(lastAcc || (accList.length > 1 ? accList[1].id : accList[0]?.id || 'acc_spending'));
      if (prefs?.userName) {
        setUserName(prefs.userName === 'Mahi / Mahesh' ? 'Mahesh ;)' : prefs.userName);
      }
    } catch (err) {
      console.error('Failed to load IndexedDB data:', err);
    }
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      try {
        await initIndexedDB();
        if (mounted) {
          await reloadData();
        }
      } catch (err) {
        console.error('IndexedDB initialization failed:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    boot();
    return () => {
      mounted = false;
    };
  }, [reloadData]);

  // Handle Save Transaction (Add or Edit)
  const handleSaveTransaction = async (tx: Transaction) => {
    await saveTransaction(tx);
    await setLastUsedAccountId(tx.accountId);
    await reloadData();
    setEditingTransaction(null);
    setMobileDetailTransaction(null);
  };

  // Handle Delete Transaction
  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    try {
      await deleteTransactionById(deletingTransaction.id);
      await reloadData();
      setDeletingTransaction(null);
      setMobileDetailTransaction(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Add Category
  const handleAddCategory = async (cat: Category) => {
    await saveCategory(cat);
    await reloadData();
  };

  // Handle Fast Category Creation from Modal
  const handleQuickAddCategory = async (name: string, type: 'EXPENSE' | 'INCOME'): Promise<Category> => {
    const newCat: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      type,
      color: type === 'INCOME' ? '#32D583' : '#7C5CFC',
    };
    await saveCategory(newCat);
    await reloadData();
    return newCat;
  };

  // Handle Delete Category
  const handleDeleteCategory = async (catId: string) => {
    await deleteCategoryById(catId);
    await reloadData();
  };

  // Handle Update User Profile Name
  const handleUpdateUserName = async (name: string) => {
    const pref = await getAppPreferences();
    pref.userName = name;
    await saveAppPreferences(pref);
    setUserName(name);
  };

  // Handle Save Budget
  const handleSaveBudget = async (budget: Budget) => {
    await saveBudget(budget);
    await reloadData();
  };

  // Handle Account Initial Balance Update
  const handleUpdateInitialBalance = async (accountId: string, newBalance: number) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;
    const updated: Account = { ...acc, initialBalance: newBalance };
    await saveAccount(updated);
    await reloadData();
  };

  // Open Add Expense modal
  const handleOpenAddExpense = (type: TransactionType = 'EXPENSE', prepaidId?: string) => {
    setAddExpenseDefaultType(type);
    setPreselectedPrepaidId(prepaidId);
    setEditingTransaction(null);
    setIsAddExpenseOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (tx: Transaction) => {
    setPreselectedPrepaidId(undefined);
    setEditingTransaction(tx);
    setIsAddExpenseOpen(true);
  };

  // Open Drilldown modal
  const handleDrillDown = (title: string, txs: Transaction[], subtitle?: string) => {
    setDrillDownState({
      isOpen: true,
      title,
      subtitle,
      transactions: txs,
    });
  };

  // Handle Backup Export
  const handleExportBackup = async (): Promise<ExpenseTrackerBackup> => {
    return await exportFullBackup();
  };

  // Handle Backup Import
  const handleImportBackup = async (backup: ExpenseTrackerBackup, replaceAll = false) => {
    const res = await mergeBackupIntoDatabase(backup, replaceAll);
    await reloadData();
    return res;
  };

  // Handle Clear Local Data
  const handleClearAllData = async () => {
    await clearAllLocalData();
    await reloadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111418] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#7C5CFC] animate-spin mb-3" />
        <p className="text-xs text-[#A8AFB8] font-medium tracking-wide">
          Loading Personal Expense Tracker...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111418] text-[#F5F7FA] flex flex-col md:flex-row">
      {/* Desktop Sidebar (visible on md+) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#282D34] bg-[#171A1F] p-4 shrink-0 h-screen sticky top-0 justify-between">
        <div className="space-y-6">
          {/* Logo & Status */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#7C5CFC] flex items-center justify-center text-white font-bold shadow-md shadow-[#7C5CFC]/25">
                ₹
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-[#F5F7FA] leading-tight tracking-tight truncate">
                  Expense Tracker
                </h1>
                <span className="text-[10px] text-[#A8AFB8] font-semibold flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#32D583] shrink-0"></span>
                  <span className="truncate">{userName}</span>
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <OfflineIndicator />
              <PWAInstallButton />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/20'
                  : 'text-[#A8AFB8] hover:text-[#F5F7FA] hover:bg-[#1D2127]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'transactions'
                  ? 'bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/20'
                  : 'text-[#A8AFB8] hover:text-[#F5F7FA] hover:bg-[#1D2127]'
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              <span>Transactions</span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'accounts'
                  ? 'bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/20'
                  : 'text-[#A8AFB8] hover:text-[#F5F7FA] hover:bg-[#1D2127]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab('analysis')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'analysis'
                  ? 'bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/20'
                  : 'text-[#A8AFB8] hover:text-[#F5F7FA] hover:bg-[#1D2127]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Financial Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'settings'
                  ? 'bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/20'
                  : 'text-[#A8AFB8] hover:text-[#F5F7FA] hover:bg-[#1D2127]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings & Backup</span>
            </button>
          </nav>
        </div>

        {/* Quick Action Button */}
        <div className="pt-4 border-t border-[#282D34] space-y-2">
          <button
            onClick={() => handleOpenAddExpense('EXPENSE')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#7C5CFC] hover:bg-[#6847ea] text-white text-xs font-bold shadow-lg transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (visible on mobile only) */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-[#282D34] bg-[#171A1F] sticky top-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#7C5CFC] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-[#7C5CFC]/30">
            ₹
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-[#F5F7FA] block leading-tight truncate">Expense Tracker</span>
            <span className="text-[10px] text-[#A8AFB8] font-medium block leading-none truncate">{userName}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <OfflineIndicator />
          <PWAInstallButton />
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 ${
              activeTab === 'settings'
                ? 'bg-[#7C5CFC] border-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/25'
                : 'bg-[#1D2127] border-[#282D34] text-[#A8AFB8] hover:text-[#F5F7FA]'
            }`}
            title="Settings & Backup"
            aria-label="Settings and Backup"
          >
            <Download className="w-3.5 h-3.5 text-[#7C5CFC]" />
            <span>Backup</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 overflow-y-auto pb-28 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            period={dashboardPeriod}
            userName={userName}
            onPeriodChange={setDashboardPeriod}
            onOpenAddExpense={handleOpenAddExpense}
            onSelectTransaction={(tx) => setMobileDetailTransaction(tx)}
            onEditTransaction={handleOpenEdit}
            onDeleteTransaction={(tx) => setDeletingTransaction(tx)}
            onDrillDownCategory={(name, txs) => handleDrillDown(name, txs)}
            onNavigateToTab={(t) => setActiveTab(t as typeof activeTab)}
            onExportBackup={handleExportBackup}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onOpenAddExpense={handleOpenAddExpense}
            onSelectTransaction={(tx) => setMobileDetailTransaction(tx)}
            onEditTransaction={handleOpenEdit}
            onDeleteTransaction={(tx) => setDeletingTransaction(tx)}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            transactions={transactions}
            onOpenTransfer={() => handleOpenAddExpense('TRANSFER')}
            onOpenRecharge={(prepaidId) => handleOpenAddExpense('RECHARGE', prepaidId)}
            onOpenSpendPrepaid={(prepaidId) => handleOpenAddExpense('EXPENSE', prepaidId)}
            onUpdateInitialBalance={handleUpdateInitialBalance}
            onSelectTransaction={(tx) => setMobileDetailTransaction(tx)}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisView
            localTransactions={transactions}
            localAccounts={accounts}
            localCategories={categories}
            localBudgets={budgets}
            onMergeIntoLocal={handleImportBackup}
            onDrillDown={(title, txs) => handleDrillDown(title, txs)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            budgets={budgets}
            userName={userName}
            onUpdateUserName={handleUpdateUserName}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onClearData={handleClearAllData}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onSaveBudget={handleSaveBudget}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (fixed) */}
      <nav className="flex md:hidden items-center justify-between fixed bottom-0 left-0 right-0 h-16 bg-[#171A1F] border-t border-[#282D34] z-40 px-1 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition ${
            activeTab === 'dashboard' ? 'text-[#7C5CFC]' : 'text-[#737B86] hover:text-[#A8AFB8]'
          }`}
        >
          <LayoutDashboard className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition ${
            activeTab === 'transactions' ? 'text-[#7C5CFC]' : 'text-[#737B86] hover:text-[#A8AFB8]'
          }`}
        >
          <ReceiptText className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-1 font-medium">History</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition ${
            activeTab === 'accounts' ? 'text-[#7C5CFC]' : 'text-[#737B86] hover:text-[#A8AFB8]'
          }`}
        >
          <Wallet className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-1 font-medium">Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition ${
            activeTab === 'analysis' ? 'text-[#7C5CFC]' : 'text-[#737B86] hover:text-[#A8AFB8]'
          }`}
        >
          <BarChart3 className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-1 font-medium">Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition ${
            activeTab === 'settings' ? 'text-[#7C5CFC]' : 'text-[#737B86] hover:text-[#A8AFB8]'
          }`}
        >
          <Settings className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-1 font-medium">Backup</span>
        </button>
      </nav>

      {/* Floating Action Button for Add Expense on Mobile */}
      <button
        onClick={() => handleOpenAddExpense('EXPENSE')}
        className="fixed bottom-20 right-4 md:hidden z-40 w-13 h-13 rounded-full bg-[#7C5CFC] hover:bg-[#6847ea] text-white flex items-center justify-center shadow-xl shadow-[#7C5CFC]/40 active:scale-95 transition"
        aria-label="Add Expense"
        title="Add Expense"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingTransaction(null);
          setPreselectedPrepaidId(undefined);
        }}
        onSave={handleSaveTransaction}
        onAddNewCategory={handleQuickAddCategory}
        accounts={accounts}
        categories={categories}
        prepaidWallets={prepaidWallets}
        preselectedPrepaidId={preselectedPrepaidId}
        lastUsedAccountId={lastUsedAccId}
        editTransaction={editingTransaction}
        defaultType={addExpenseDefaultType}
      />

      {/* Mobile Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={!!mobileDetailTransaction}
        transaction={mobileDetailTransaction}
        accounts={accounts}
        onClose={() => setMobileDetailTransaction(null)}
        onEdit={(tx) => handleOpenEdit(tx)}
        onDelete={(tx) => setDeletingTransaction(tx)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        transaction={deletingTransaction}
        isDeleting={isDeleting}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Drill-down / Underlying Transactions Modal */}
      <UnderlyingTransactionsModal
        isOpen={drillDownState.isOpen}
        title={drillDownState.title}
        subtitle={drillDownState.subtitle}
        transactions={drillDownState.transactions}
        accounts={accounts}
        onClose={() => setDrillDownState({ isOpen: false, title: '', transactions: [] })}
        onSelectTransaction={(tx) => {
          setDrillDownState({ isOpen: false, title: '', transactions: [] });
          setMobileDetailTransaction(tx);
        }}
      />
    </div>
  );
}
