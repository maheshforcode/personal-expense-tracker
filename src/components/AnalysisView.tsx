import React, { useMemo, useState } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  Layers,
  BarChart3,
  PieChart,
  Target,
  RefreshCw,
  Database,
  Eye,
} from 'lucide-react';
import { Account, Budget, Category, ExpenseTrackerBackup, Transaction } from '../types';
import {
  mergeBackupDatasets,
  MergedDatasetSummary,
  validateAndParseBackupContent,
} from '../lib/backupParser';
import {
  calculateAccountSummaries,
  calculateBudgetComparisons,
  calculatePeriodSummary,
  formatCurrency,
  formatDateDisplay,
  getDateRangeForPeriod,
} from '../lib/financials';
import { CategoryIcon } from './CategoryIcon';

interface AnalysisViewProps {
  localTransactions: Transaction[];
  localAccounts: Account[];
  localCategories: Category[];
  localBudgets: Budget[];
  onMergeIntoLocal: (backup: ExpenseTrackerBackup, replaceAll?: boolean) => Promise<{ added: number; skipped: number }>;
  onDrillDown: (title: string, transactions: Transaction[]) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  localTransactions,
  localAccounts,
  localCategories,
  localBudgets,
  onMergeIntoLocal,
  onDrillDown,
}) => {
  // Source mode: 'local' | 'uploaded'
  const [dataSource, setDataSource] = useState<'local' | 'uploaded'>('local');

  // Uploaded files state
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string }[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [mergedSummary, setMergedSummary] = useState<MergedDatasetSummary | null>(null);

  // Time-based analysis tab: 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [analysisTab, setAnalysisTab] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // Active dataset depending on mode
  const activeDataset = useMemo(() => {
    if (dataSource === 'uploaded' && mergedSummary) {
      return {
        transactions: mergedSummary.transactions,
        accounts: mergedSummary.accounts,
        categories: mergedSummary.categories,
        budgets: mergedSummary.budgets,
        isCustomUpload: true,
      };
    }
    return {
      transactions: localTransactions,
      accounts: localAccounts,
      categories: localCategories,
      budgets: localBudgets,
      isCustomUpload: false,
    };
  }, [dataSource, mergedSummary, localTransactions, localAccounts, localCategories, localBudgets]);

  // Overall calculations on active dataset
  const overallRange = useMemo(() => {
    if (activeDataset.transactions.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return { startDate: today, endDate: today };
    }
    const dates = activeDataset.transactions.map((t) => t.date).filter(Boolean).sort();
    return {
      startDate: dates[0] || new Date().toISOString().split('T')[0],
      endDate: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
    };
  }, [activeDataset.transactions]);

  const { summary: overallSummary, categoryBreakdown, dailySpendingList } = useMemo(
    () => calculatePeriodSummary(activeDataset.transactions, overallRange, activeDataset.categories),
    [activeDataset.transactions, overallRange, activeDataset.categories]
  );

  const { summaries: accountSummaries } = useMemo(
    () => calculateAccountSummaries(activeDataset.accounts, activeDataset.transactions),
    [activeDataset.accounts, activeDataset.transactions]
  );

  // Budgets Planned vs Actual
  const budgetComparisons = useMemo(() => {
    return calculateBudgetComparisons(
      activeDataset.budgets,
      activeDataset.categories,
      activeDataset.transactions,
      overallRange
    );
  }, [activeDataset.budgets, activeDataset.categories, activeDataset.transactions, overallRange]);

  // Handle file drop / upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setParseErrors([]);
    setRestoreStatus(null);

    const filePromises: Promise<{ name: string; content: string }>[] = [];

    Array.from(files).forEach((file) => {
      filePromises.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ name: file.name, content: e.target?.result as string });
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsText(file);
        })
      );
    });

    Promise.all(filePromises)
      .then((loaded) => {
        setUploadedFiles(loaded);

        const validBackups: ExpenseTrackerBackup[] = [];
        const errors: string[] = [];

        loaded.forEach((f) => {
          const res = validateAndParseBackupContent(f.content, f.name);
          if (res.isValid && res.backup) {
            validBackups.push(res.backup);
          } else if (res.error) {
            errors.push(`${f.name}: ${res.error}`);
          }
        });

        if (errors.length > 0) {
          setParseErrors(errors);
        }

        if (validBackups.length > 0) {
          const summary = mergeBackupDatasets(validBackups);
          setMergedSummary(summary);
          setDataSource('uploaded');
        } else {
          setMergedSummary(null);
        }
      })
      .catch((err) => {
        setParseErrors([err.message || 'Error reading files']);
      });
  };

  // Restore/Merge into local DB
  const handleMergeToLocal = async () => {
    if (!mergedSummary) return;
    setIsRestoring(true);
    setRestoreStatus(null);

    try {
      const backupToMerge: ExpenseTrackerBackup = {
        format: 'expense-tracker',
        version: 1,
        metadata: {
          exportedAt: new Date().toISOString(),
          currency: 'INR',
        },
        accounts: mergedSummary.accounts,
        categories: mergedSummary.categories,
        transactions: mergedSummary.transactions,
        budgets: mergedSummary.budgets,
      };

      const result = await onMergeIntoLocal(backupToMerge, false);
      setRestoreStatus(
        `Successfully merged: ${result.added} transactions added, ${result.skipped} duplicate transactions safely skipped.`
      );
    } catch (e) {
      setRestoreStatus('Failed to merge data: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsRestoring(false);
    }
  };

  // Transfer statistics
  const transferStats = useMemo(() => {
    const transfers = activeDataset.transactions.filter((t) => !t.isDeleted && t.type === 'TRANSFER');
    const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);
    const count = transfers.length;
    const avg = count > 0 ? totalAmount / count : 0;

    return { totalAmount, count, avg, transfers };
  }, [activeDataset.transactions]);

  // Income statistics
  const incomeStats = useMemo(() => {
    const incomes = activeDataset.transactions.filter((t) => !t.isDeleted && t.type === 'INCOME');
    const totalAmount = incomes.reduce((sum, t) => sum + t.amount, 0);
    const count = incomes.length;
    let highestIncome = 0;
    const sourceMap = new Map<string, number>();

    incomes.forEach((i) => {
      if (i.amount > highestIncome) highestIncome = i.amount;
      const s = i.category || 'Other';
      sourceMap.set(s, (sourceMap.get(s) || 0) + i.amount);
    });

    const sources = Array.from(sourceMap.entries()).map(([name, amount]) => ({ name, amount }));
    sources.sort((a, b) => b.amount - a.amount);

    return { totalAmount, count, highestIncome, sources, incomes };
  }, [activeDataset.transactions]);

  // Monthly aggregated data
  const monthlyBreakdown = useMemo(() => {
    const map = new Map<string, { income: number; expenses: number; transfers: number; count: number }>();

    activeDataset.transactions.forEach((tx) => {
      if (tx.isDeleted) return;
      const monthKey = tx.date.substring(0, 7); // YYYY-MM
      const existing = map.get(monthKey) || { income: 0, expenses: 0, transfers: 0, count: 0 };

      if (tx.type === 'INCOME') existing.income += tx.amount;
      else if (tx.type === 'EXPENSE') existing.expenses += tx.amount;
      else if (tx.type === 'TRANSFER') existing.transfers += tx.amount;

      existing.count += 1;
      map.set(monthKey, existing);
    });

    const list = Array.from(map.entries()).map(([month, data]) => ({
      month,
      ...data,
      net: data.income - data.expenses,
    }));
    list.sort((a, b) => a.month.localeCompare(b.month));
    return list;
  }, [activeDataset.transactions]);

  return (
    <div id="analysis-view" className="space-y-6 pb-24 sm:pb-8">
      {/* Header & Source Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F7FA]">Detailed Financial Analysis</h2>
          <p className="text-xs text-[#A8AFB8] mt-0.5">
            Factual descriptive statistics, category breakdowns, and multi-file backup analysis
          </p>
        </div>

        {/* Dataset Source Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-[#171A1F] border border-[#282D34] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setDataSource('local')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              dataSource === 'local'
                ? 'bg-[#7C5CFC] text-white shadow-xs'
                : 'text-[#A8AFB8] hover:text-[#F5F7FA]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Local Tracker Data</span>
          </button>
          <button
            onClick={() => setDataSource('uploaded')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              dataSource === 'uploaded'
                ? 'bg-[#7C5CFC] text-white shadow-xs'
                : 'text-[#A8AFB8] hover:text-[#F5F7FA]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Backups ({uploadedFiles.length})</span>
          </button>
        </div>
      </div>

      {/* Upload Area (Always accessible or when in uploaded mode) */}
      {dataSource === 'uploaded' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files);
            }}
            className="rounded-2xl border-2 border-dashed border-[#282D34] hover:border-[#7C5CFC]/60 bg-[#171A1F] p-8 text-center transition-colors"
          >
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F5F7FA]">Drop JSON backup files here</h3>
                <p className="text-xs text-[#737B86] mt-1">
                  Upload one or multiple weekly/monthly <code className="text-[#A8AFB8]">.expense.json</code> files.
                  Duplicates will be merged automatically without double-counting.
                </p>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D2127] hover:bg-[#282D34] text-xs font-medium text-[#F5F7FA] border border-[#282D34] cursor-pointer transition">
                  <FileText className="w-3.5 h-3.5 text-[#7C5CFC]" />
                  <span>Choose Files</span>
                  <input
                    type="file"
                    multiple
                    accept=".json"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Validation errors */}
          {parseErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-[#F97066]/10 border border-[#F97066]/30 space-y-1 text-xs text-[#F97066]">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Import Validation Notice:</span>
              </div>
              {parseErrors.map((err, idx) => (
                <div key={idx} className="pl-6 text-[11px] text-[#F97066]/90">
                  {err}
                </div>
              ))}
            </div>
          )}

          {/* Dataset Summary Pill after Upload */}
          {mergedSummary && (
            <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#282D34] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#32D583]" />
                    <h3 className="text-sm font-semibold text-[#F5F7FA]">
                      {mergedSummary.filesCount} file{mergedSummary.filesCount === 1 ? '' : 's'} imported & unified
                    </h3>
                  </div>
                  <p className="text-xs text-[#737B86] mt-0.5">
                    Unified date range: {formatDateDisplay(mergedSummary.dateRange.startDate)} → {formatDateDisplay(mergedSummary.dateRange.endDate)}
                  </p>
                </div>

                <button
                  onClick={handleMergeToLocal}
                  disabled={isRestoring}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#32D583] hover:bg-[#2bc477] text-gray-950 font-bold text-xs shadow-md transition disabled:opacity-50 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                  <span>Restore / Merge into Local Database</span>
                </button>
              </div>

              {restoreStatus && (
                <div className="p-3 rounded-lg bg-[#32D583]/10 border border-[#32D583]/30 text-xs text-[#32D583] font-medium">
                  {restoreStatus}
                </div>
              )}

              {/* Stats badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
                  <span className="text-[#737B86] block text-[11px]">Transactions</span>
                  <span className="text-base font-bold text-[#F5F7FA]">{mergedSummary.totalTransactions}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
                  <span className="text-[#737B86] block text-[11px]">Accounts</span>
                  <span className="text-base font-bold text-[#F5F7FA]">{mergedSummary.accountsCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
                  <span className="text-[#737B86] block text-[11px]">Categories</span>
                  <span className="text-base font-bold text-[#F5F7FA]">{mergedSummary.categoriesCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
                  <span className="text-[#737B86] block text-[11px]">Duplicates Filtered</span>
                  <span className="text-base font-bold text-[#32D583]">{mergedSummary.duplicateTransactionsSkipped}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
                  <span className="text-[#737B86] block text-[11px]">Status</span>
                  <span className="text-base font-bold text-[#53B1FD]">Ready</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Date Range & Overview Cards */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#282D34] pb-3">
          <div className="flex items-center gap-2 text-xs text-[#A8AFB8]">
            <Calendar className="w-4 h-4 text-[#7C5CFC]" />
            <span>Dataset Period:</span>
            <strong className="text-[#F5F7FA]">
              {formatDateDisplay(overallRange.startDate)} — {formatDateDisplay(overallRange.endDate)}
            </strong>
          </div>

          <span className="text-xs text-[#737B86]">
            {activeDataset.transactions.length} total entries analyzed
          </span>
        </div>

        {/* 5 Key Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[11px] text-[#737B86] block">Total Income</span>
            <span className="text-lg font-bold text-[#32D583] mt-0.5 block">
              {formatCurrency(overallSummary.income)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[11px] text-[#737B86] block">Total Expenses</span>
            <span className="text-lg font-bold text-[#F97066] mt-0.5 block">
              {formatCurrency(overallSummary.expenses)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[11px] text-[#737B86] block">Total Transfers</span>
            <span className="text-lg font-bold text-[#53B1FD] mt-0.5 block">
              {formatCurrency(overallSummary.transfers)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[11px] text-[#737B86] block">Average / Day</span>
            <span className="text-lg font-bold text-[#F5F7FA] mt-0.5 block">
              {formatCurrency(Math.round(overallSummary.averageDailySpending))}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[11px] text-[#737B86] block">Net Change</span>
            <span
              className={`text-lg font-bold mt-0.5 block ${
                overallSummary.netChange >= 0 ? 'text-[#32D583]' : 'text-[#F97066]'
              }`}
            >
              {formatCurrency(overallSummary.netChange)}
            </span>
          </div>
        </div>
      </div>

      {/* Analysis Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#282D34] pb-2">
        {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAnalysisTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
              analysisTab === tab
                ? 'bg-[#7C5CFC] text-white'
                : 'text-[#A8AFB8] hover:text-[#F5F7FA] hover:bg-[#1D2127]'
            }`}
          >
            {tab === 'all' ? 'Comprehensive' : `${tab} View`}
          </button>
        ))}
      </div>

      {/* 1. Category Analysis with Click-to-Drilldown */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Category Spending Breakdown</h3>
            <p className="text-xs text-[#737B86]">Click any category to inspect its underlying transactions</p>
          </div>
          <span className="text-xs text-[#A8AFB8]">{categoryBreakdown.length} active categories</span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#737B86] bg-[#111418] rounded-xl">
            No expenses recorded to categorize.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#282D34] text-[#737B86]">
                  <th className="pb-2.5 font-medium">Category</th>
                  <th className="pb-2.5 font-medium text-right">Transactions</th>
                  <th className="pb-2.5 font-medium text-right">Total Amount</th>
                  <th className="pb-2.5 font-medium text-right">Share (%)</th>
                  <th className="pb-2.5 font-medium text-right">Average / Tx</th>
                  <th className="pb-2.5 font-medium text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282D34]/50">
                {categoryBreakdown.map((item) => {
                  const catTxs = activeDataset.transactions.filter(
                    (t) => !t.isDeleted && t.type === 'EXPENSE' && t.category.toLowerCase() === item.categoryName.toLowerCase()
                  );

                  return (
                    <tr
                      key={item.categoryName}
                      onClick={() => onDrillDown(`${item.categoryName} Transactions`, catTxs)}
                      className="hover:bg-[#1D2127] cursor-pointer group transition-colors"
                    >
                      <td className="py-3 flex items-center gap-2 text-[#F5F7FA] font-medium">
                        <CategoryIcon name={item.categoryName} color={item.color} className="w-3.5 h-3.5" />
                        <span className="group-hover:text-[#7C5CFC] transition-colors">{item.categoryName}</span>
                      </td>
                      <td className="py-3 text-right text-[#A8AFB8]">{item.count}</td>
                      <td className="py-3 text-right font-bold text-[#F5F7FA]">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="py-3 text-right text-[#A8AFB8]">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{item.percentage.toFixed(1)}%</span>
                          <div className="w-12 h-1 bg-[#111418] rounded-full overflow-hidden inline-block">
                            <div
                              className="h-full bg-[#7C5CFC]"
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right text-[#A8AFB8]">
                        {formatCurrency(Math.round(item.averageTransaction))}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#7C5CFC] group-hover:underline">
                          <Eye className="w-3 h-3" />
                          View
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Planned vs Actual Budgets Analysis */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Planned vs. Actual Budgets</h3>
            <p className="text-xs text-[#737B86]">Comparison of target planned spending against actual recorded expenses</p>
          </div>
          <Target className="w-4 h-4 text-[#7C5CFC]" />
        </div>

        {budgetComparisons.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#737B86] bg-[#111418] rounded-xl">
            No active category budgets defined.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetComparisons.map((b) => {
              const isOver = b.actualAmount > b.plannedAmount;
              return (
                <div
                  key={b.budget.id}
                  onClick={() => {
                    const catTxs = activeDataset.transactions.filter(
                      (t) => !t.isDeleted && t.type === 'EXPENSE' && t.category.toLowerCase() === b.category.name.toLowerCase()
                    );
                    onDrillDown(`${b.category.name} Expenses vs Budget`, catTxs);
                  }}
                  className="rounded-xl bg-[#111418] border border-[#282D34] p-4 space-y-2.5 cursor-pointer hover:border-[#7C5CFC]/40 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-[#F5F7FA]">
                      <CategoryIcon name={b.category.name} color={b.category.color} className="w-3.5 h-3.5" />
                      <span>{b.category.name}</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        isOver ? 'text-[#F97066]' : 'text-[#32D583]'
                      }`}
                    >
                      {isOver
                        ? `Over by ${formatCurrency(Math.abs(b.difference))}`
                        : `Remaining: ${formatCurrency(b.difference)}`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-[#171A1F] rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-[#F97066]' : 'bg-[#7C5CFC]'
                        }`}
                        style={{ width: `${Math.min(100, b.percentageUsed)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#737B86]">
                      <span>Spent: {formatCurrency(b.actualAmount)}</span>
                      <span>Planned: {formatCurrency(b.plannedAmount)} ({b.percentageUsed.toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Account Analysis & Transfer Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Account Analysis Table */}
        <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F5F7FA]">Account Flow Breakdown</h3>
          <div className="space-y-3">
            {accountSummaries.map((item) => (
              <div
                key={item.account.id}
                className="p-3.5 rounded-xl bg-[#111418] border border-[#282D34] space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#F5F7FA]">{item.account.name}</span>
                  <span className="font-extrabold text-[#F5F7FA]">
                    Balance: {formatCurrency(item.currentBalance)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[11px] pt-1 text-[#737B86] border-t border-[#282D34]">
                  <div>
                    <span>Income</span>
                    <strong className="block text-[#32D583]">+{formatCurrency(item.totalIncome)}</strong>
                  </div>
                  <div>
                    <span>Transfers In</span>
                    <strong className="block text-[#53B1FD]">+{formatCurrency(item.transfersIn)}</strong>
                  </div>
                  <div>
                    <span>Transfers Out</span>
                    <strong className="block text-[#53B1FD]">-{formatCurrency(item.transfersOut)}</strong>
                  </div>
                  <div>
                    <span>Expenses</span>
                    <strong className="block text-[#F97066]">-{formatCurrency(item.totalExpenses)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Analysis & Frequency */}
        <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Transfer Dynamics</h3>
            <ArrowRightLeft className="w-4 h-4 text-[#53B1FD]" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
              <span className="text-[#737B86] block text-[11px]">Total Transferred</span>
              <span className="text-base font-bold text-[#53B1FD] mt-0.5 block">
                {formatCurrency(transferStats.totalAmount)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
              <span className="text-[#737B86] block text-[11px]">Transfers Count</span>
              <span className="text-base font-bold text-[#F5F7FA] mt-0.5 block">
                {transferStats.count}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
              <span className="text-[#737B86] block text-[11px]">Avg / Transfer</span>
              <span className="text-base font-bold text-[#F5F7FA] mt-0.5 block">
                {formatCurrency(Math.round(transferStats.avg))}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#737B86] leading-relaxed">
            Transfers move liquidity from Main reserve into the Spending account. They do not alter total net net-worth across accounts.
          </p>
        </div>
      </div>

      {/* 4. Spending Patterns & Descriptive Statistics */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#F5F7FA]">Spending Patterns & Descriptive Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Most Active Day</span>
            <span className="text-sm font-bold text-[#F5F7FA] mt-0.5 block truncate">
              {overallSummary.highestSpendingDay
                ? `${formatDateDisplay(overallSummary.highestSpendingDay.date)} (${formatCurrency(overallSummary.highestSpendingDay.amount)})`
                : 'None'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Highest Spending Category</span>
            <span className="text-sm font-bold text-[#F5F7FA] mt-0.5 block truncate">
              {overallSummary.highestSpendingCategory
                ? `${overallSummary.highestSpendingCategory.name} (${formatCurrency(overallSummary.highestSpendingCategory.amount)})`
                : 'None'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Largest Single Expense</span>
            <span className="text-sm font-bold text-[#F97066] mt-0.5 block">
              {formatCurrency(overallSummary.largestExpense)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Smallest Single Expense</span>
            <span className="text-sm font-bold text-[#32D583] mt-0.5 block">
              {formatCurrency(overallSummary.smallestExpense)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Days with Spending</span>
            <span className="text-sm font-bold text-[#F5F7FA] mt-0.5 block">
              {overallSummary.daysWithSpending} days
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">No-Spending Days</span>
            <span className="text-sm font-bold text-[#32D583] mt-0.5 block">
              {overallSummary.noSpendingDays} days
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Average Tx Value</span>
            <span className="text-sm font-bold text-[#F5F7FA] mt-0.5 block">
              {formatCurrency(Math.round(overallSummary.averageTransaction))}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Average Daily Spend</span>
            <span className="text-sm font-bold text-[#F5F7FA] mt-0.5 block">
              {formatCurrency(Math.round(overallSummary.averageDailySpending))}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Monthly History Timeline */}
      {monthlyBreakdown.length > 0 && (
        <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F5F7FA]">Monthly Financial Trajectory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#282D34] text-[#737B86]">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium text-right">Income</th>
                  <th className="pb-2 font-medium text-right">Expenses</th>
                  <th className="pb-2 font-medium text-right">Transfers</th>
                  <th className="pb-2 font-medium text-right">Net Change</th>
                  <th className="pb-2 font-medium text-right">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282D34]/50">
                {monthlyBreakdown.map((m) => (
                  <tr
                    key={m.month}
                    onClick={() => {
                      const monthTxs = activeDataset.transactions.filter(
                        (t) => !t.isDeleted && t.date.startsWith(m.month)
                      );
                      onDrillDown(`Transactions for ${m.month}`, monthTxs);
                    }}
                    className="hover:bg-[#1D2127] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-bold text-[#F5F7FA]">{m.month}</td>
                    <td className="py-2.5 text-right font-medium text-[#32D583]">
                      +{formatCurrency(m.income)}
                    </td>
                    <td className="py-2.5 text-right font-medium text-[#F97066]">
                      -{formatCurrency(m.expenses)}
                    </td>
                    <td className="py-2.5 text-right font-medium text-[#53B1FD]">
                      {formatCurrency(m.transfers)}
                    </td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        m.net >= 0 ? 'text-[#32D583]' : 'text-[#F97066]'
                      }`}
                    >
                      {formatCurrency(m.net)}
                    </td>
                    <td className="py-2.5 text-right text-[#A8AFB8]">{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
