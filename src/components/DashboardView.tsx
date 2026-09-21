import React, { useMemo, useState } from 'react';
import {
  Plus,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Settings,
  Archive,
} from 'lucide-react';
import { Account, Category, ExpenseTrackerBackup, TimePeriod, Transaction } from '../types';
import {
  calculateAccountSummaries,
  calculatePeriodSummary,
  formatCurrency,
  formatDateDisplay,
  getDateRangeForPeriod,
  getTodayDateString,
} from '../lib/financials';
import { CategoryIcon } from './CategoryIcon';
import { downloadJsonFile } from '../lib/zipExporter';

interface DashboardViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  period: TimePeriod;
  userName?: string;
  onPeriodChange: (p: TimePeriod) => void;
  onOpenAddExpense: (type?: 'EXPENSE' | 'INCOME' | 'TRANSFER') => void;
  onSelectTransaction: (tx: Transaction) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onDrillDownCategory: (categoryName: string, transactions: Transaction[]) => void;
  onNavigateToTab: (tab: string) => void;
  onExportBackup?: () => Promise<ExpenseTrackerBackup>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  accounts,
  categories,
  period,
  userName,
  onPeriodChange,
  onOpenAddExpense,
  onSelectTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onDrillDownCategory,
  onNavigateToTab,
  onExportBackup,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const range = useMemo(() => getDateRangeForPeriod(period), [period]);

  const { summaries: accountSummaries, totalMoney } = useMemo(
    () => calculateAccountSummaries(accounts, transactions),
    [accounts, transactions]
  );

  const { summary, categoryBreakdown, dailySpendingList } = useMemo(
    () => calculatePeriodSummary(transactions, range, categories),
    [transactions, range, categories]
  );

  // Time greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Format month name for header
  const periodLabel = useMemo(() => {
    if (period === 'today') return 'Today';
    if (period === 'week') return 'This Week';
    if (period === 'month') {
      const d = new Date();
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    if (period === 'year') {
      return `${new Date().getFullYear()}`;
    }
    return 'Custom Range';
  }, [period]);

  // Recent 6 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  // Max daily spending for chart normalization
  const maxDailySpend = useMemo(() => {
    const max = Math.max(...dailySpendingList.map((d) => d.amount), 100);
    return max;
  }, [dailySpendingList]);

  return (
    <div id="dashboard-view" className="space-y-6 pb-24 sm:pb-8">
      {/* Top Greeting & Total Balance (Strongest visual element) */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#A8AFB8] mb-1">
              <span>
                {greeting},{' '}
                <strong className="text-[#F5F7FA] font-semibold">{userName || 'Mahesh ;)'}</strong>
              </span>
              <span>·</span>
              <span className="text-[#7C5CFC] font-semibold">{periodLabel}</span>
            </div>
            <div className="text-xs text-[#737B86] uppercase tracking-wider font-medium">Total Balance</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#F5F7FA] tracking-tight mt-1">
              {formatCurrency(totalMoney)}
            </div>
            <div className="text-xs text-[#A8AFB8] mt-1.5 flex items-center gap-1.5">
              <span className={summary.netChange >= 0 ? 'text-[#32D583]' : 'text-[#F97066]'}>
                {summary.netChange >= 0 ? '↑ ' : '↓ '}
                {formatCurrency(Math.abs(summary.netChange))}
              </span>
              <span>net {summary.netChange >= 0 ? 'surplus' : 'spending'} this period</span>
            </div>
          </div>

          {/* Prominent Action Button Group */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => onOpenAddExpense('EXPENSE')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#7C5CFC] hover:bg-[#6a48f0] text-white text-sm font-semibold shadow-lg shadow-[#7C5CFC]/20 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={() => onOpenAddExpense('INCOME')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-[#1D2127] hover:bg-[#282D34] text-[#32D583] border border-[#282D34] text-xs font-medium transition"
              title="Add Income"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Income</span>
            </button>
            <button
              onClick={() => onOpenAddExpense('TRANSFER')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-[#1D2127] hover:bg-[#282D34] text-[#53B1FD] border border-[#282D34] text-xs font-medium transition"
              title="Transfer between accounts"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>
        </div>

        {/* Time Period Tabs */}
        <div className="flex items-center gap-1.5 mt-6 pt-5 border-t border-[#282D34] overflow-x-auto no-scrollbar">
          {(['today', 'week', 'month', 'year'] as TimePeriod[]).map((p) => {
            const isActive = period === p;
            const labels: Record<string, string> = {
              today: 'Today',
              week: 'This Week',
              month: 'This Month',
              year: 'This Year',
            };
            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#7C5CFC] text-white shadow-xs'
                    : 'bg-[#111418] text-[#A8AFB8] hover:text-[#F5F7FA] hover:bg-[#1D2127] border border-[#282D34]'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings & Backup Quick Access Card */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 flex items-center justify-center text-[#7C5CFC] shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#F5F7FA]">Settings & Backup</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#32D583]/15 text-[#32D583] border border-[#32D583]/30 font-medium shrink-0">
                Offline Ready
              </span>
            </div>
            <p className="text-xs text-[#A8AFB8] mt-0.5">
              Export data backup, download JSON archive, or manage categories & profile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {onExportBackup && (
            <button
              onClick={async () => {
                if (!onExportBackup) return;
                setIsExporting(true);
                try {
                  const backup = await onExportBackup();
                  const dateStr = new Date().toISOString().split('T')[0];
                  downloadJsonFile(backup, `expense-tracker-${dateStr}.expense.json`);
                } catch (err) {
                  console.error('Failed to export:', err);
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#111418] hover:bg-[#1D2127] text-[#F5F7FA] border border-[#282D34] text-xs font-semibold transition active:scale-95 disabled:opacity-50"
              title="Quick Download JSON Backup"
            >
              <Download className="w-3.5 h-3.5 text-[#7C5CFC]" />
              <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
            </button>
          )}
          <button
            onClick={() => onNavigateToTab('settings')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6847ea] text-white text-xs font-semibold shadow-md shadow-[#7C5CFC]/20 transition active:scale-95"
            title="Open Settings & Backup"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Open Settings</span>
          </button>
        </div>
      </div>

      {/* Period Financial Metrics Summary Group */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Income Card */}
        <div className="rounded-xl bg-[#171A1F] border border-[#282D34] p-4">
          <div className="flex items-center justify-between text-xs text-[#A8AFB8] mb-1">
            <span>Income</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#32D583]" />
          </div>
          <div className="text-xl font-bold text-[#32D583]">
            {formatCurrency(summary.income)}
          </div>
          <div className="text-[11px] text-[#737B86] mt-1">Inflow to accounts</div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-xl bg-[#171A1F] border border-[#282D34] p-4">
          <div className="flex items-center justify-between text-xs text-[#A8AFB8] mb-1">
            <span>Expenses</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[#F97066]" />
          </div>
          <div className="text-xl font-bold text-[#F97066]">
            {formatCurrency(summary.expenses)}
          </div>
          <div className="text-[11px] text-[#737B86] mt-1">
            {summary.averageDailySpending > 0
              ? `Avg ${formatCurrency(Math.round(summary.averageDailySpending))}/day`
              : 'Outflow from accounts'}
          </div>
        </div>

        {/* Transfers Card (Separate) */}
        <div className="rounded-xl bg-[#171A1F] border border-[#282D34] p-4">
          <div className="flex items-center justify-between text-xs text-[#A8AFB8] mb-1">
            <span>Transfers</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#53B1FD]" />
          </div>
          <div className="text-xl font-bold text-[#53B1FD]">
            {formatCurrency(summary.transfers)}
          </div>
          <div className="text-[11px] text-[#737B86] mt-1">Between own accounts</div>
        </div>

        {/* Net Change Card */}
        <div className="rounded-xl bg-[#171A1F] border border-[#282D34] p-4">
          <div className="flex items-center justify-between text-xs text-[#A8AFB8] mb-1">
            <span>Net Change</span>
            <Wallet className="w-3.5 h-3.5 text-[#7C5CFC]" />
          </div>
          <div
            className={`text-xl font-bold ${
              summary.netChange >= 0 ? 'text-[#32D583]' : 'text-[#F97066]'
            }`}
          >
            {formatCurrency(summary.netChange)}
          </div>
          <div className="text-[11px] text-[#737B86] mt-1">Income - Expenses</div>
        </div>
      </div>

      {/* Spending Overview Chart & Category Breakdown (2 columns on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spending Overview Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Spending Overview</h3>
            <span className="text-xs text-[#A8AFB8]">
              {dailySpendingList.length} active day{dailySpendingList.length === 1 ? '' : 's'}
            </span>
          </div>

          {dailySpendingList.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-xs text-[#737B86] rounded-xl bg-[#111418] border border-[#282D34]/50 p-4">
              <Calendar className="w-8 h-8 mb-2 opacity-40 text-[#7C5CFC]" />
              No spending recorded in this period.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-4 px-2 pb-1 bg-[#111418] rounded-xl border border-[#282D34]/60 overflow-x-auto">
                {dailySpendingList.map((item) => {
                  const heightPct = Math.max(8, Math.round((item.amount / maxDailySpend) * 100));
                  const isHighest = summary.highestSpendingDay?.date === item.date;
                  const dayNum = item.date.split('-')[2];
                  const dayName = new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });

                  return (
                    <div
                      key={item.date}
                      className="flex-1 min-w-[24px] max-w-[40px] flex flex-col items-center gap-1 group relative h-full justify-end cursor-pointer"
                      title={`${formatDateDisplay(item.date)}: ${formatCurrency(item.amount)}`}
                      onClick={() => {
                        const dayTxs = transactions.filter((t) => !t.isDeleted && t.type === 'EXPENSE' && t.date === item.date);
                        onDrillDownCategory(`Expenses on ${formatDateDisplay(item.date)}`, dayTxs);
                      }}
                    >
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute bottom-full mb-1 bg-[#1D2127] border border-[#282D34] text-[10px] text-[#F5F7FA] py-1 px-1.5 rounded-md whitespace-nowrap shadow-md z-10">
                        {formatCurrency(item.amount)}
                      </div>

                      <div
                        className={`w-full rounded-t-sm transition-all group-hover:brightness-125 ${
                          isHighest ? 'bg-[#7C5CFC]' : 'bg-[#282D34] hover:bg-[#53B1FD]'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] text-[#737B86] group-hover:text-[#F5F7FA]">
                        {dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#737B86] px-1">
                <span>Daily timeline</span>
                {summary.highestSpendingDay && (
                  <span>
                    Peak: <strong className="text-[#F5F7FA]">{formatCurrency(summary.highestSpendingDay.amount)}</strong> on {formatDateDisplay(summary.highestSpendingDay.date)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Spending by Category</h3>
            <span className="text-xs text-[#A8AFB8]">{categoryBreakdown.length} categories</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-[#737B86] rounded-xl bg-[#111418] border border-[#282D34]/50">
              No expenses in this period.
            </div>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {categoryBreakdown.slice(0, 6).map((item) => (
                <div
                  key={item.categoryName}
                  onClick={() => {
                    const catTxs = transactions.filter(
                      (t) =>
                        !t.isDeleted &&
                        t.type === 'EXPENSE' &&
                        t.category.toLowerCase() === item.categoryName.toLowerCase() &&
                        t.date >= range.startDate &&
                        t.date <= range.endDate
                    );
                    onDrillDownCategory(`${item.categoryName} Expenses`, catTxs);
                  }}
                  className="space-y-1.5 p-2 -mx-2 rounded-lg hover:bg-[#1D2127] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIcon name={item.categoryName} color={item.color} className="w-3.5 h-3.5" />
                      <span className="font-medium text-[#F5F7FA] truncate group-hover:text-[#7C5CFC] transition-colors">
                        {item.categoryName}
                      </span>
                      <span className="text-[11px] text-[#737B86]">({item.count})</span>
                    </div>
                    <div className="font-bold text-[#F5F7FA] text-right">
                      {formatCurrency(item.totalAmount)}
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-1.5 bg-[#111418] rounded-full overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color || '#7C5CFC',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accounts Glance (Main Account & Spending Account) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F5F7FA]">Accounts</h3>
          <button
            onClick={() => onNavigateToTab('accounts')}
            className="text-xs text-[#7C5CFC] hover:text-[#9B8AFB] flex items-center gap-1 font-medium"
          >
            <span>View all accounts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accountSummaries.map((item) => {
            const isMain = item.account.type === 'main';
            return (
              <div
                key={item.account.id}
                className="rounded-xl bg-[#171A1F] border border-[#282D34] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#F5F7FA]">{item.account.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#111418] border border-[#282D34] text-[#A8AFB8]">
                      {isMain ? 'Holding / Reserve' : 'Daily Spending'}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-[#F5F7FA] mt-1">
                    {formatCurrency(item.currentBalance)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#282D34] text-[11px]">
                  <div>
                    <span className="text-[#737B86] block">Income</span>
                    <span className="font-semibold text-[#32D583]">
                      +{formatCurrency(item.totalIncome)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#737B86] block">Transfers</span>
                    <span className="font-semibold text-[#53B1FD]">
                      {item.transfersIn > 0
                        ? `+${formatCurrency(item.transfersIn)}`
                        : item.transfersOut > 0
                        ? `-${formatCurrency(item.transfersOut)}`
                        : '₹0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#737B86] block">Expenses</span>
                    <span className="font-semibold text-[#F97066]">
                      -{formatCurrency(item.totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F5F7FA]">Recent Transactions</h3>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-xs text-[#7C5CFC] hover:text-[#9B8AFB] flex items-center gap-1 font-medium"
          >
            <span>See all ({transactions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="rounded-xl bg-[#171A1F] border border-[#282D34] p-8 text-center space-y-3">
            <div className="text-sm font-medium text-[#F5F7FA]">No expenses yet</div>
            <p className="text-xs text-[#737B86] max-w-xs mx-auto">
              Start tracking your spending by adding your first expense.
            </p>
            <button
              onClick={() => onOpenAddExpense('EXPENSE')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C5CFC] text-white text-xs font-semibold hover:bg-[#6a48f0] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-[#171A1F] border border-[#282D34] divide-y divide-[#282D34] overflow-hidden">
            {recentTransactions.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              const isExpense = tx.type === 'EXPENSE';
              const isIncome = tx.type === 'INCOME';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#1D2127] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon name={tx.category} className="w-4 h-4" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F5F7FA] truncate">
                        {tx.description || tx.category}
                      </div>
                      <div className="text-[11px] text-[#737B86] flex items-center gap-1.5 truncate mt-0.5">
                        <span>{tx.category}</span>
                        <span>·</span>
                        <span>{acc?.name || 'Account'}</span>
                        <span>·</span>
                        <span>{formatDateDisplay(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      className={`text-sm font-bold text-right ${
                        isExpense
                          ? 'text-[#F97066]'
                          : isIncome
                          ? 'text-[#32D583]'
                          : 'text-[#53B1FD]'
                      }`}
                    >
                      {isExpense ? '-' : isIncome ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
