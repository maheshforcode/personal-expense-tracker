import React, { useEffect, useState } from 'react';
import { Plus, X, ArrowRightLeft, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { Account, Category, Transaction, TransactionType } from '../types';
import { getTodayDateString } from '../lib/financials';
import { CategoryIcon } from './CategoryIcon';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => Promise<void>;
  onAddNewCategory: (name: string, type: 'EXPENSE' | 'INCOME') => Promise<Category>;
  accounts: Account[];
  categories: Category[];
  lastUsedAccountId: string;
  editTransaction?: Transaction | null;
  defaultType?: TransactionType;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddNewCategory,
  accounts,
  categories,
  lastUsedAccountId,
  editTransaction,
  defaultType = 'EXPENSE',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Food');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [accountId, setAccountId] = useState<string>(lastUsedAccountId || 'acc_spending');
  const [toAccountId, setToAccountId] = useState<string>('acc_spending');

  // Category creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setType(editTransaction.type);
        setAmount(editTransaction.amount.toString());
        setSelectedCategory(editTransaction.category || '');
        setSelectedSubcategory(editTransaction.subcategory || '');
        setDescription(editTransaction.description || '');
        setDate(editTransaction.date || getTodayDateString());
        setAccountId(editTransaction.accountId || accounts[0]?.id || '');
        setToAccountId(editTransaction.toAccountId || accounts[1]?.id || accounts[0]?.id || '');
      } else {
        setType(defaultType);
        setAmount('');
        setDescription('');
        setDate(getTodayDateString());
        const initialAcc = lastUsedAccountId || (accounts.length > 1 ? accounts[1].id : accounts[0]?.id || '');
        setAccountId(initialAcc);
        if (defaultType === 'TRANSFER') {
          setAccountId(accounts[0]?.id || '');
          setToAccountId(accounts[1]?.id || accounts[0]?.id || '');
          setSelectedCategory('Transfer');
        } else if (defaultType === 'INCOME') {
          setSelectedCategory('Salary');
        } else {
          setSelectedCategory('Food');
        }
        setSelectedSubcategory('');
      }
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setErrorMessage('');
    }
  }, [isOpen, editTransaction, defaultType, lastUsedAccountId, accounts]);

  if (!isOpen) return null;

  const relevantCategories = categories.filter((c) => {
    if (type === 'EXPENSE') return c.type === 'EXPENSE' || c.type === 'BOTH' || !c.type;
    if (type === 'INCOME') return c.type === 'INCOME' || c.type === 'BOTH' || !c.type;
    return true;
  });

  const activeCategoryObj = categories.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
  );

  const availableSubcategories = activeCategoryObj?.subcategories || [];

  const handleQuickDate = (target: 'today' | 'yesterday') => {
    const d = new Date();
    if (target === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const created = await onAddNewCategory(
        newCategoryName.trim(),
        type === 'INCOME' ? 'INCOME' : 'EXPENSE'
      );
      setSelectedCategory(created.name);
      setSelectedSubcategory('');
      setNewCategoryName('');
      setIsCreatingCategory(false);
    } catch {
      setErrorMessage('Failed to create category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than zero');
      return;
    }

    if (!accountId) {
      setErrorMessage('Please select an account');
      return;
    }

    if (type === 'TRANSFER' && accountId === toAccountId) {
      setErrorMessage('Source and destination accounts must be different');
      return;
    }

    setIsSubmitting(true);
    try {
      const tx: Transaction = {
        id: editTransaction ? editTransaction.id : `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type,
        amount: Math.round(parsedAmount * 100) / 100,
        category: type === 'TRANSFER' ? 'Transfer' : selectedCategory || 'Other',
        subcategory: type === 'TRANSFER' ? undefined : (selectedSubcategory || undefined),
        description: description.trim() || undefined,
        date,
        accountId,
        toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
        createdAt: editTransaction?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(tx);
      onClose();
    } catch (err) {
      setErrorMessage('Error saving transaction: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-xs">
      <div
        id="add-expense-modal"
        className="w-full max-w-lg rounded-t-2xl sm:rounded-xl bg-[#171A1F] border border-[#282D34] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#282D34]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                type === 'EXPENSE' ? 'bg-[#F97066]' : type === 'INCOME' ? 'bg-[#32D583]' : 'bg-[#53B1FD]'
              }`}
            />
            <h2 className="text-lg font-semibold text-[#F5F7FA]">
              {editTransaction ? 'Edit Transaction' : type === 'EXPENSE' ? 'Add Expense' : type === 'INCOME' ? 'Add Income' : 'Transfer Money'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#737B86] hover:text-[#F5F7FA] hover:bg-[#1D2127] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#F97066]/10 border border-[#F97066]/30 text-[#F97066] text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Type Selector (if not editing) */}
          {!editTransaction && (
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#111418] border border-[#282D34]">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-[#1D2127] text-[#F97066] shadow-xs'
                    : 'text-[#A8AFB8] hover:text-[#F5F7FA]'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all ${
                  type === 'INCOME'
                    ? 'bg-[#1D2127] text-[#32D583] shadow-xs'
                    : 'text-[#A8AFB8] hover:text-[#F5F7FA]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Income
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('TRANSFER');
                  setSelectedCategory('Transfer');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all ${
                  type === 'TRANSFER'
                    ? 'bg-[#1D2127] text-[#53B1FD] shadow-xs'
                    : 'text-[#A8AFB8] hover:text-[#F5F7FA]'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Transfer
              </button>
            </div>
          )}

          {/* Amount Field (Prominent) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#A8AFB8] block">Amount</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xl font-bold text-[#A8AFB8]">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                className="w-full bg-[#111418] border border-[#282D34] rounded-xl py-3 pl-9 pr-4 text-2xl font-bold text-[#F5F7FA] placeholder-[#505760] focus:outline-hidden focus:border-[#7C5CFC] transition-colors"
              />
            </div>
          </div>

          {/* Category Picker (For EXPENSE and INCOME) */}
          {type !== 'TRANSFER' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#A8AFB8]">Category</label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="text-xs font-medium text-[#7C5CFC] hover:text-[#9B8AFB] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add New Category
                </button>
              </div>

              {/* Dynamic Add New Category Input */}
              {isCreatingCategory && (
                <div className="p-3 mb-2 rounded-xl bg-[#111418] border border-[#7C5CFC]/40 space-y-2">
                  <div className="text-xs text-[#F5F7FA] font-medium">Create New Category</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Personal Care"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-[#171A1F] border border-[#282D34] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] placeholder-[#505760] focus:outline-hidden focus:border-[#7C5CFC]"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-3 py-1.5 bg-[#7C5CFC] hover:bg-[#6847ea] text-white text-xs font-medium rounded-lg transition"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(false)}
                      className="px-2 py-1.5 bg-[#1D2127] text-[#A8AFB8] text-xs rounded-lg hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-[#111418] rounded-xl border border-[#282D34]">
                {relevantCategories.map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setSelectedSubcategory('');
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-[#1D2127] text-[#F5F7FA] border border-[#7C5CFC]/60 shadow-xs'
                          : 'text-[#A8AFB8] hover:text-[#F5F7FA] hover:bg-[#1D2127]/60 border border-transparent'
                      }`}
                    >
                      <CategoryIcon name={cat.name} color={cat.color} className="w-3.5 h-3.5" />
                      <span className="truncate font-medium">{cat.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#7C5CFC] ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Subcategories (if available) */}
              {availableSubcategories.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] text-[#737B86] mb-1.5">Optional Subcategory:</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategory('')}
                      className={`px-2.5 py-1 text-[11px] rounded-full border transition ${
                        !selectedSubcategory
                          ? 'bg-[#7C5CFC]/20 border-[#7C5CFC] text-[#F5F7FA]'
                          : 'bg-[#111418] border-[#282D34] text-[#737B86] hover:text-[#A8AFB8]'
                      }`}
                    >
                      None
                    </button>
                    {availableSubcategories.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubcategory(sub.name)}
                        className={`px-2.5 py-1 text-[11px] rounded-full border transition ${
                          selectedSubcategory === sub.name
                            ? 'bg-[#7C5CFC]/20 border-[#7C5CFC] text-[#F5F7FA]'
                            : 'bg-[#111418] border-[#282D34] text-[#A8AFB8] hover:text-[#F5F7FA]'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#A8AFB8] block">Description (Optional)</label>
            <input
              type="text"
              placeholder={type === 'EXPENSE' ? 'e.g. Bingo Chips' : type === 'INCOME' ? 'e.g. September Salary' : 'e.g. Spending replenishment'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#111418] border border-[#282D34] rounded-xl px-4 py-2.5 text-sm text-[#F5F7FA] placeholder-[#505760] focus:outline-hidden focus:border-[#7C5CFC]"
            />
          </div>

          {/* Date Picker with Quick Select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#A8AFB8]">Date</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDate('today')}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-[#1D2127] text-[#A8AFB8] hover:text-[#F5F7FA] border border-[#282D34]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('yesterday')}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-[#1D2127] text-[#A8AFB8] hover:text-[#F5F7FA] border border-[#282D34]"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#111418] border border-[#282D34] rounded-xl px-4 py-2.5 text-sm text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
              />
            </div>
          </div>

          {/* Account Selection */}
          {type === 'TRANSFER' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A8AFB8]">From Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-[#111418] border border-[#282D34] rounded-xl px-3 py-2.5 text-sm text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A8AFB8]">To Account</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-[#111418] border border-[#282D34] rounded-xl px-3 py-2.5 text-sm text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#A8AFB8]">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[#111418] border border-[#282D34] rounded-xl px-4 py-2.5 text-sm text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type === 'main' ? 'Main' : 'Spending'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                type === 'EXPENSE'
                  ? 'bg-[#7C5CFC] hover:bg-[#6847ea] active:scale-[0.99]'
                  : type === 'INCOME'
                  ? 'bg-[#32D583] hover:bg-[#2bc477] text-gray-950 font-semibold active:scale-[0.99]'
                  : 'bg-[#53B1FD] hover:bg-[#43a1ed] text-gray-950 font-semibold active:scale-[0.99]'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                'Saving...'
              ) : editTransaction ? (
                'Update Transaction'
              ) : (
                `Add ${type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'Income' : 'Transfer'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
