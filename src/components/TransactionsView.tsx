import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowRightLeft,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Account, Category, TimePeriod, Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateDisplay, getDateRangeForPeriod } from '../lib/financials';
import { CategoryIcon } from './CategoryIcon';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onOpenAddExpense: (type?: TransactionType) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  categories,
  onOpenAddExpense,
  onSelectTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<TimePeriod | 'ALL'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.isDeleted) return false;

      // Type filter
      if (selectedType !== 'ALL' && tx.type !== selectedType) {
        return false;
      }

      // Account filter
      if (selectedAccount !== 'ALL') {
        if (tx.type === 'TRANSFER') {
          if (tx.accountId !== selectedAccount && tx.toAccountId !== selectedAccount) {
            return false;
          }
        } else if (tx.accountId !== selectedAccount) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && tx.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Date Period filter
      if (periodFilter !== 'ALL') {
        if (periodFilter === 'custom') {
          if (customStartDate && tx.date < customStartDate) return false;
          if (customEndDate && tx.date > customEndDate) return false;
        } else {
          const range = getDateRangeForPeriod(periodFilter);
          if (tx.date < range.startDate || tx.date > range.endDate) {
            return false;
          }
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const acc = accounts.find((a) => a.id === tx.accountId);
        const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;

        const matchesDesc = (tx.description || '').toLowerCase().includes(q);
        const matchesCat = (tx.category || '').toLowerCase().includes(q);
        const matchesSub = (tx.subcategory || '').toLowerCase().includes(q);
        const matchesPrepaid = (tx.prepaidName || '').toLowerCase().includes(q);
        const matchesAcc = (acc?.name || '').toLowerCase().includes(q);
        const matchesToAcc = (toAcc?.name || '').toLowerCase().includes(q);
        const matchesAmount = tx.amount.toString().includes(q);

        if (!matchesDesc && !matchesCat && !matchesSub && !matchesPrepaid && !matchesAcc && !matchesToAcc && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    selectedType,
    selectedAccount,
    selectedCategory,
    periodFilter,
    customStartDate,
    customEndDate,
    searchQuery,
    accounts,
  ]);

  // Group filtered transactions by Date
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; displayDate: string; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    filteredTransactions.forEach((tx) => {
      const existing = map.get(tx.date);
      if (existing) {
        existing.push(tx);
      } else {
        const arr = [tx];
        map.set(tx.date, arr);
      }
    });

    // Dates sorted descending
    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    sortedDates.forEach((date) => {
      groups.push({
        date,
        displayDate: formatDateDisplay(date),
        items: map.get(date) || [],
      });
    });

    return groups;
  }, [filteredTransactions]);

  const activeFiltersCount =
    (selectedType !== 'ALL' ? 1 : 0) +
    (selectedAccount !== 'ALL' ? 1 : 0) +
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (periodFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const handleClearFilters = () => {
    setSelectedType('ALL');
    setSelectedAccount('ALL');
    setSelectedCategory('ALL');
    setPeriodFilter('ALL');
    setSearchQuery('');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  return (
    <div id="transactions-view" className="space-y-5 pb-24 sm:pb-8">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F7FA]">Transactions</h2>
          <p className="text-xs text-[#A8AFB8] mt-0.5">
            {filteredTransactions.length} recorded transaction{filteredTransactions.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          onClick={() => onOpenAddExpense('EXPENSE')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6a48f0] text-white text-xs font-semibold shadow-md transition active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Search & Quick Filters Bar */}
      <div className="space-y-3 rounded-2xl bg-[#171A1F] border border-[#282D34] p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#737B86] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description, category, or account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111418] border border-[#282D34] rounded-xl pl-9 pr-8 py-2.5 text-xs text-[#F5F7FA] placeholder-[#505760] focus:outline-hidden focus:border-[#7C5CFC] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737B86] hover:text-[#F5F7FA]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition ${
              showAdvancedFilters || activeFiltersCount > 0
                ? 'bg-[#7C5CFC]/15 border-[#7C5CFC]/40 text-[#7C5CFC]'
                : 'bg-[#111418] border-[#282D34] text-[#A8AFB8] hover:text-[#F5F7FA]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#7C5CFC] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Date Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {(['ALL', 'today', 'week', 'month', 'year'] as (TimePeriod | 'ALL')[]).map((p) => {
            const isActive = periodFilter === p;
            const labels: Record<string, string> = {
              ALL: 'All Time',
              today: 'Today',
              week: 'This Week',
              month: 'This Month',
              year: 'This Year',
            };
            return (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#7C5CFC] text-white'
                    : 'bg-[#111418] text-[#A8AFB8] hover:text-[#F5F7FA] border border-[#282D34]'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Expandable Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-[#282D34]">
            {/* Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#737B86]">Transaction Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-[#111418] border border-[#282D34] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
              >
                <option value="ALL">All Types</option>
                <option value="EXPENSE">Expense Only</option>
                <option value="INCOME">Income Only</option>
                <option value="TRANSFER">Transfer Only</option>
                <option value="RECHARGE">Recharge Only</option>
              </select>
            </div>

            {/* Account */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#737B86]">Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full bg-[#111418] border border-[#282D34] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
              >
                <option value="ALL">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#737B86]">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#111418] border border-[#282D34] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters action */}
            {activeFiltersCount > 0 && (
              <div className="sm:col-span-3 flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-[#F97066] hover:underline font-medium"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grouped Transactions List */}
      {groupedTransactions.length === 0 ? (
        <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-12 text-center space-y-3">
          <div className="text-base font-semibold text-[#F5F7FA]">No transactions found</div>
          <p className="text-xs text-[#737B86] max-w-sm mx-auto">
            {searchQuery || activeFiltersCount > 0
              ? 'Try modifying your search or filters to locate transactions.'
              : 'Start tracking your personal expenses by creating your first entry.'}
          </p>
          {activeFiltersCount > 0 ? (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-[#1D2127] hover:bg-[#282D34] text-xs font-medium text-[#F5F7FA] rounded-xl border border-[#282D34] transition"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => onOpenAddExpense('EXPENSE')}
              className="px-4 py-2 bg-[#7C5CFC] hover:bg-[#6a48f0] text-xs font-semibold text-white rounded-xl shadow-md transition"
            >
              Add Expense
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {groupedTransactions.map((group) => {
            const groupTotalExpense = group.items
              .filter((i) => i.type === 'EXPENSE')
              .reduce((sum, i) => sum + i.amount, 0);

            return (
              <div key={group.date} className="space-y-2">
                {/* Date Group Heading */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-[#A8AFB8] tracking-wider uppercase">
                    {group.displayDate}
                  </span>
                  {groupTotalExpense > 0 && (
                    <span className="text-[11px] text-[#737B86]">
                      Spent: <strong className="text-[#F5F7FA]">{formatCurrency(groupTotalExpense)}</strong>
                    </span>
                  )}
                </div>

                {/* List Container */}
                <div className="rounded-xl bg-[#171A1F] border border-[#282D34] divide-y divide-[#282D34] overflow-hidden">
                  {group.items.map((tx) => {
                    const acc = accounts.find((a) => a.id === tx.accountId);
                    const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
                    const isExpense = tx.type === 'EXPENSE';
                    const isIncome = tx.type === 'INCOME';
                    const isTransfer = tx.type === 'TRANSFER';
                    const isRecharge = tx.type === 'RECHARGE';
                    const isPrepaidExpense = isExpense && tx.paymentMode === 'prepaid';

                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#1D2127] transition-colors group"
                      >
                        {/* Main clickable area for mobile/desktop details */}
                        <div
                          onClick={() => onSelectTransaction(tx)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <CategoryIcon name={tx.category} className="w-4 h-4" />

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-[#F5F7FA] truncate flex items-center gap-1.5">
                              <span>{tx.description || (isRecharge ? `${tx.prepaidName || 'Prepaid'} Recharge` : tx.category)}</span>
                              {isRecharge && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#9B8AFB]/15 text-[#9B8AFB] font-medium border border-[#9B8AFB]/30">
                                  Recharge
                                </span>
                              )}
                              {isPrepaidExpense && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#53B1FD]/15 text-[#53B1FD] font-medium border border-[#53B1FD]/30">
                                  Prepaid
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#737B86] flex items-center gap-1.5 truncate mt-0.5">
                              <span className="text-[#A8AFB8]">{tx.category}</span>
                              {tx.subcategory && (
                                <>
                                  <span>·</span>
                                  <span>{tx.subcategory}</span>
                                </>
                              )}
                              <span>·</span>
                              {isTransfer ? (
                                <span className="flex items-center gap-1 text-[#53B1FD]">
                                  {acc?.name || 'Main'} → {toAcc?.name || 'Spending'}
                                </span>
                              ) : isRecharge ? (
                                <span className="text-[#A8AFB8]">
                                  {acc?.name || 'Spending'} → <strong className="text-[#F5F7FA]">{tx.prepaidName || 'Card'}</strong>{' '}
                                  <span className="text-[#32D583]">(+₹{tx.creditedAmount || tx.amount})</span>
                                  {tx.fee ? <span className="text-[#737B86]"> · fee ₹{tx.fee}</span> : null}
                                </span>
                              ) : isPrepaidExpense ? (
                                <span className="text-[#53B1FD]">
                                  💳 {tx.prepaidName || 'Prepaid Card'}
                                </span>
                              ) : (
                                <span>{acc?.name || 'Spending Account'}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            onClick={() => onSelectTransaction(tx)}
                            className={`text-sm font-bold text-right cursor-pointer ${
                              isExpense
                                ? 'text-[#F97066]'
                                : isIncome
                                ? 'text-[#32D583]'
                                : isRecharge
                                ? 'text-[#9B8AFB]'
                                : 'text-[#53B1FD]'
                            }`}
                          >
                            {isExpense || isRecharge ? '-' : isIncome ? '+' : ''}
                            {formatCurrency(tx.amount)}
                          </div>

                          {/* Desktop Inline Actions */}
                          <div className="hidden sm:flex items-center gap-1">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 rounded-lg text-[#737B86] hover:text-[#F5F7FA] hover:bg-[#282D34] transition"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTransaction(tx)}
                              className="p-1.5 rounded-lg text-[#737B86] hover:text-[#F97066] hover:bg-[#F97066]/10 transition"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
