'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  X,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Check,
  Zap,
  CreditCard,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Account, Category, PrepaidWallet, Transaction, TransactionType } from '../types';
import { formatCurrency, getTodayDateString } from '../lib/financials';
import { CategoryIcon } from './CategoryIcon';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => Promise<void>;
  onAddNewCategory: (name: string, type: 'EXPENSE' | 'INCOME') => Promise<Category>;
  accounts: Account[];
  categories: Category[];
  prepaidWallets?: PrepaidWallet[];
  lastUsedAccountId: string;
  editTransaction?: Transaction | null;
  defaultType?: TransactionType;
  preselectedPrepaidId?: string;
}

const COMMON_PREPAID_SERVICES = [
  { name: 'Metro Card', category: 'Transport', subcategory: 'Metro' },
  { name: 'FASTag', category: 'Transport', subcategory: 'Tolls' },
  { name: 'Mobile Prepaid', category: 'Recharge & Internet', subcategory: 'Mobile' },
  { name: 'Bus Pass', category: 'Transport', subcategory: 'Bus' },
  { name: 'Amazon Pay', category: 'Shopping', subcategory: 'Wallet' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddNewCategory,
  accounts,
  categories,
  prepaidWallets = [],
  lastUsedAccountId,
  editTransaction,
  defaultType = 'EXPENSE',
  preselectedPrepaidId,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>(''); // For EXPENSE/INCOME/TRANSFER: amount. For RECHARGE: Amount Paid
  const [selectedCategory, setSelectedCategory] = useState<string>('Food');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [accountId, setAccountId] = useState<string>(lastUsedAccountId || 'acc_spending');
  const [toAccountId, setToAccountId] = useState<string>('acc_spending');

  // Prepaid / Recharge specific state
  const [prepaidName, setPrepaidName] = useState<string>('Metro Card');
  const [creditedAmount, setCreditedAmount] = useState<string>('');
  const [fee, setFee] = useState<string>('0');
  const [paymentMode, setPaymentMode] = useState<'account' | 'prepaid'>('account');
  const [selectedPrepaidId, setSelectedPrepaidId] = useState<string>('');

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

        if (editTransaction.type === 'RECHARGE') {
          setPrepaidName(editTransaction.prepaidName || 'Metro Card');
          setCreditedAmount(
            typeof editTransaction.creditedAmount === 'number'
              ? editTransaction.creditedAmount.toString()
              : (editTransaction.amount - (editTransaction.fee || 0)).toString()
          );
          setFee(typeof editTransaction.fee === 'number' ? editTransaction.fee.toString() : '0');
        } else if (editTransaction.type === 'EXPENSE') {
          if (editTransaction.paymentMode === 'prepaid') {
            setPaymentMode('prepaid');
            setSelectedPrepaidId(editTransaction.prepaidId || '');
          } else {
            setPaymentMode('account');
          }
        }
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
          setSelectedSubcategory('');
        } else if (defaultType === 'INCOME') {
          setSelectedCategory('Salary');
          setSelectedSubcategory('');
          setPaymentMode('account');
        } else if (defaultType === 'RECHARGE') {
          const defaultPrepaid = preselectedPrepaidId
            ? prepaidWallets.find((w) => w.id === preselectedPrepaidId)?.name || 'Metro Card'
            : prepaidWallets[0]?.name || 'Metro Card';
          setPrepaidName(defaultPrepaid);
          setSelectedCategory('Transport');
          setSelectedSubcategory('Metro');
          setCreditedAmount('');
          setFee('0');
        } else {
          // EXPENSE
          setSelectedCategory('Food');
          setSelectedSubcategory('');
          if (preselectedPrepaidId) {
            setPaymentMode('prepaid');
            setSelectedPrepaidId(preselectedPrepaidId);
            const wallet = prepaidWallets.find((w) => w.id === preselectedPrepaidId);
            if (wallet) {
              setSelectedCategory(wallet.category || 'Transport');
            }
          } else {
            setPaymentMode('account');
            setSelectedPrepaidId(prepaidWallets[0]?.id || '');
          }
        }
      }
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setErrorMessage('');
    }
  }, [isOpen, editTransaction, defaultType, lastUsedAccountId, accounts, preselectedPrepaidId, prepaidWallets]);

  if (!isOpen) return null;

  // Amount Paid change handler for RECHARGE
  const handleAmountPaidChange = (newAmountPaid: string) => {
    setAmount(newAmountPaid);
    const parsedPaid = parseFloat(newAmountPaid);
    if (!isNaN(parsedPaid)) {
      const parsedFee = parseFloat(fee) || 0;
      const newCredited = Math.max(0, parsedPaid - parsedFee);
      setCreditedAmount(newCredited > 0 ? newCredited.toString() : '');
    } else {
      setCreditedAmount('');
    }
  };

  // Credited Amount change handler for RECHARGE
  const handleCreditedAmountChange = (newCreditedStr: string) => {
    setCreditedAmount(newCreditedStr);
    const parsedPaid = parseFloat(amount);
    const parsedCredited = parseFloat(newCreditedStr);
    if (!isNaN(parsedPaid) && !isNaN(parsedCredited)) {
      const calculatedFee = Math.max(0, Math.round((parsedPaid - parsedCredited) * 100) / 100);
      setFee(calculatedFee.toString());
    }
  };

  // Fee change handler for RECHARGE
  const handleFeeChange = (newFeeStr: string) => {
    setFee(newFeeStr);
    const parsedPaid = parseFloat(amount);
    const parsedFee = parseFloat(newFeeStr);
    if (!isNaN(parsedPaid) && !isNaN(parsedFee)) {
      const calculatedCredited = Math.max(0, Math.round((parsedPaid - parsedFee) * 100) / 100);
      setCreditedAmount(calculatedCredited.toString());
    }
  };

  const handleSelectPrepaidService = (serviceName: string, defaultCategory?: string, defaultSub?: string) => {
    setPrepaidName(serviceName);
    if (defaultCategory) setSelectedCategory(defaultCategory);
    if (defaultSub) setSelectedSubcategory(defaultSub);
  };

  const relevantCategories = categories.filter((c) => {
    if (type === 'EXPENSE' || type === 'RECHARGE') return c.type === 'EXPENSE' || c.type === 'BOTH' || !c.type;
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

  const currentPrepaidWallet = prepaidWallets.find((w) => w.id === selectedPrepaidId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(type === 'RECHARGE' ? 'Please enter a valid Amount Paid' : 'Please enter a valid amount greater than zero');
      return;
    }

    if (!accountId) {
      setErrorMessage('Please select a funding account');
      return;
    }

    if (type === 'TRANSFER' && accountId === toAccountId) {
      setErrorMessage('Source and destination accounts must be different');
      return;
    }

    if (type === 'RECHARGE') {
      if (!prepaidName.trim()) {
        setErrorMessage('Please provide a prepaid service or card name (e.g. Metro Card)');
        return;
      }
      const parsedCredited = parseFloat(creditedAmount);
      if (isNaN(parsedCredited) || parsedCredited <= 0) {
        setErrorMessage('Please enter a valid credited amount greater than zero');
        return;
      }
      if (parsedCredited > parsedAmount) {
        setErrorMessage('Credited amount cannot exceed the total amount paid');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const txId = editTransaction ? editTransaction.id : `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const nowIso = new Date().toISOString();

      let tx: Transaction;

      if (type === 'RECHARGE') {
        const parsedPaid = Math.round(parsedAmount * 100) / 100;
        const parsedCredited = Math.round((parseFloat(creditedAmount) || parsedPaid) * 100) / 100;
        const parsedFee = Math.round((parseFloat(fee) || (parsedPaid - parsedCredited)) * 100) / 100;
        const cleanName = prepaidName.trim() || 'Metro Card';
        const cleanPrepaidId = 'prep_' + cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

        tx = {
          id: txId,
          type: 'RECHARGE',
          amount: parsedPaid, // Amount Paid deducted from Spending Account
          creditedAmount: parsedCredited, // Added to Prepaid Balance
          fee: parsedFee, // Actual fee/charge
          prepaidId: cleanPrepaidId,
          prepaidName: cleanName,
          category: selectedCategory || 'Transport',
          subcategory: selectedSubcategory || cleanName,
          description: description.trim() || `${cleanName} Recharge`,
          date,
          accountId, // Spending Account
          createdAt: editTransaction?.createdAt || nowIso,
          updatedAt: nowIso,
        };
      } else if (type === 'EXPENSE') {
        const isPrepaid = paymentMode === 'prepaid';
        const wallet = prepaidWallets.find((w) => w.id === selectedPrepaidId);

        tx = {
          id: txId,
          type: 'EXPENSE',
          amount: Math.round(parsedAmount * 100) / 100,
          category: selectedCategory || 'Other',
          subcategory: selectedSubcategory || undefined,
          description: description.trim() || undefined,
          date,
          accountId: isPrepaid ? (accounts[0]?.id || 'acc_spending') : accountId,
          paymentMode: isPrepaid ? 'prepaid' : 'account',
          prepaidId: isPrepaid ? (wallet?.id || selectedPrepaidId) : undefined,
          prepaidName: isPrepaid ? (wallet?.name || 'Prepaid Card') : undefined,
          createdAt: editTransaction?.createdAt || nowIso,
          updatedAt: nowIso,
        };
      } else if (type === 'TRANSFER') {
        tx = {
          id: txId,
          type: 'TRANSFER',
          amount: Math.round(parsedAmount * 100) / 100,
          category: 'Transfer',
          description: description.trim() || undefined,
          date,
          accountId,
          toAccountId,
          createdAt: editTransaction?.createdAt || nowIso,
          updatedAt: nowIso,
        };
      } else {
        // INCOME
        tx = {
          id: txId,
          type: 'INCOME',
          amount: Math.round(parsedAmount * 100) / 100,
          category: selectedCategory || 'Salary',
          subcategory: selectedSubcategory || undefined,
          description: description.trim() || undefined,
          date,
          accountId,
          createdAt: editTransaction?.createdAt || nowIso,
          updatedAt: nowIso,
        };
      }

      await onSave(tx);
      onClose();
    } catch (err) {
      setErrorMessage('Error saving transaction: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccountObj = accounts.find((a) => a.id === accountId);

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
              className={`w-2.5 h-2.5 rounded-full ${
                type === 'EXPENSE'
                  ? 'bg-[#F97066]'
                  : type === 'INCOME'
                  ? 'bg-[#32D583]'
                  : type === 'TRANSFER'
                  ? 'bg-[#53B1FD]'
                  : 'bg-[#9B8AFB]'
              }`}
            />
            <h2 className="text-lg font-semibold text-[#F5F7FA]">
              {editTransaction
                ? 'Edit Transaction'
                : type === 'EXPENSE'
                ? 'Add Expense'
                : type === 'INCOME'
                ? 'Add Income'
                : type === 'TRANSFER'
                ? 'Transfer Money'
                : 'Prepaid Recharge'}
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
            <div className="p-3 rounded-lg bg-[#F97066]/10 border border-[#F97066]/30 text-[#F97066] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Type Selector (if not editing) */}
          {!editTransaction && (
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[#111418] border border-[#282D34]">
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
                <span className="truncate">Expense</span>
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
                <span className="truncate">Income</span>
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
                <span className="truncate">Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('RECHARGE');
                  setSelectedCategory('Transport');
                  setSelectedSubcategory('Metro');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all ${
                  type === 'RECHARGE'
                    ? 'bg-[#1D2127] text-[#9B8AFB] shadow-xs'
                    : 'text-[#A8AFB8] hover:text-[#F5F7FA]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="truncate">Recharge</span>
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* SPECIALIZED RECHARGE UI                                        */}
          {/* ============================================================== */}
          {type === 'RECHARGE' ? (
            <div className="space-y-4">
              {/* Prepaid Card / Service Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#A8AFB8]">Prepaid Service / Card Name</label>
                  <span className="text-[11px] text-[#737B86]">e.g. Metro Card</span>
                </div>

                {/* Quick suggestions / existing cards */}
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PREPAID_SERVICES.map((s) => {
                    const isSelected = prepaidName.toLowerCase() === s.name.toLowerCase();
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => handleSelectPrepaidService(s.name, s.category, s.subcategory)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                          isSelected
                            ? 'bg-[#7C5CFC]/20 border-[#7C5CFC] text-[#F5F7FA] font-medium'
                            : 'bg-[#111418] border-[#282D34] text-[#A8AFB8] hover:text-[#F5F7FA]'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                  {prepaidWallets
                    .filter(
                      (w) => !COMMON_PREPAID_SERVICES.some((s) => s.name.toLowerCase() === w.name.toLowerCase())
                    )
                    .map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleSelectPrepaidService(w.name, w.category)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                          prepaidName.toLowerCase() === w.name.toLowerCase()
                            ? 'bg-[#7C5CFC]/20 border-[#7C5CFC] text-[#F5F7FA] font-medium'
                            : 'bg-[#111418] border-[#282D34] text-[#A8AFB8] hover:text-[#F5F7FA]'
                        }`}
                      >
                        {w.name} (₹{w.balance})
                      </button>
                    ))}
                </div>

                {/* Custom Name Input */}
                <input
                  type="text"
                  placeholder="Or enter custom service name (e.g. Delhi Metro)"
                  value={prepaidName}
                  onChange={(e) => setPrepaidName(e.target.value)}
                  required
                  className="w-full bg-[#111418] border border-[#282D34] rounded-xl px-4 py-2.5 text-sm text-[#F5F7FA] placeholder-[#505760] focus:outline-hidden focus:border-[#7C5CFC]"
                />
              </div>

              {/* Amount Paid Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#A8AFB8]">Amount Paid</label>
                  <span className="text-[11px] text-[#F97066]">Deducted from Spending Account</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xl font-bold text-[#A8AFB8]">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="300"
                    value={amount}
                    onChange={(e) => handleAmountPaidChange(e.target.value)}
                    autoFocus
                    required
                    className="w-full bg-[#111418] border border-[#282D34] rounded-xl py-3 pl-9 pr-4 text-2xl font-bold text-[#F5F7FA] placeholder-[#505760] focus:outline-hidden focus:border-[#7C5CFC] transition-colors"
                  />
                </div>
              </div>

              {/* Credited Amount & Fee Calculation Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#A8AFB8]">Credited Amount</label>
                    <span className="text-[10px] text-[#32D583]">Added to card</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm font-semibold text-[#A8AFB8]">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="294"
                      value={creditedAmount}
                      onChange={(e) => handleCreditedAmountChange(e.target.value)}
                      required
                      className="w-full bg-[#111418] border border-[#282D34] rounded-xl py-2 pl-7 pr-3 text-sm font-semibold text-[#32D583] placeholder-[#505760] focus:outline-hidden focus:border-[#7C5CFC]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#A8AFB8]">Fee / Charge</label>
                    <span className="text-[10px] text-[#A8AFB8]">Paid - Credited</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm font-semibold text-[#A8AFB8]">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="6"
                      value={fee}
                      onChange={(e) => handleFeeChange(e.target.value)}
                      className="w-full bg-[#111418] border border-[#282D34] rounded-xl py-2 pl-7 pr-3 text-sm font-semibold text-[#F5F7FA] placeholder-[#505760] focus:outline-hidden focus:border-[#7C5CFC]"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Calculation Summary Pill */}
              {amount && (
                <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34] text-xs text-[#A8AFB8] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#F5F7FA] font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#9B8AFB]" />
                    <span>Recharge Breakdown</span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-[#A8AFB8]">
                    • <strong className="text-[#F97066]">₹{amount || '0'}</strong> deducted from{' '}
                    <span className="text-[#F5F7FA]">{selectedAccountObj?.name || 'Spending Account'}</span>
                    <br />
                    • <strong className="text-[#32D583]">₹{creditedAmount || '0'}</strong> added to{' '}
                    <span className="text-[#F5F7FA]">{prepaidName || 'Prepaid Card'}</span> balance
                    <br />• Fee / Surcharge:{' '}
                    <strong className="text-[#F5F7FA]">₹{fee || '0'}</strong> (actual expense charge, not
                    double-deducted)
                  </div>
                </div>
              )}

              {/* From Account Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A8AFB8]">Deduct From Account</label>
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

              {/* Category Association */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A8AFB8]">Associated Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-1 bg-[#111418] rounded-xl border border-[#282D34]">
                  {relevantCategories.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
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
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* STANDARD AMOUNT & CATEGORY INPUTS (EXPENSE, INCOME, TRANSFER)   */
            /* ============================================================== */
            <>
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

              {/* Payment Mode Selector for EXPENSE (Bank Account vs Prepaid Balance) */}
              {type === 'EXPENSE' && prepaidWallets.length > 0 && (
                <div className="space-y-2 p-3 rounded-xl bg-[#111418] border border-[#282D34]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#A8AFB8]">Payment Source</label>
                    <span className="text-[11px] text-[#737B86]">Choose account or prepaid card</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#171A1F] border border-[#282D34]">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('account')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition ${
                        paymentMode === 'account'
                          ? 'bg-[#1D2127] text-[#F5F7FA] shadow-xs'
                          : 'text-[#A8AFB8] hover:text-[#F5F7FA]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Bank Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode('prepaid');
                        if (!selectedPrepaidId && prepaidWallets.length > 0) {
                          setSelectedPrepaidId(prepaidWallets[0].id);
                          setSelectedCategory(prepaidWallets[0].category || 'Transport');
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition ${
                        paymentMode === 'prepaid'
                          ? 'bg-[#1D2127] text-[#9B8AFB] shadow-xs'
                          : 'text-[#A8AFB8] hover:text-[#F5F7FA]'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-[#9B8AFB]" />
                      Prepaid Balance
                    </button>
                  </div>

                  {paymentMode === 'prepaid' && (
                    <div className="pt-1 space-y-2">
                      <label className="text-[11px] text-[#A8AFB8] block">Select Prepaid Card / Wallet:</label>
                      <select
                        value={selectedPrepaidId}
                        onChange={(e) => {
                          setSelectedPrepaidId(e.target.value);
                          const w = prepaidWallets.find((item) => item.id === e.target.value);
                          if (w) setSelectedCategory(w.category || 'Transport');
                        }}
                        className="w-full bg-[#171A1F] border border-[#282D34] rounded-lg px-3 py-2 text-xs text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
                      >
                        {prepaidWallets.map((wallet) => (
                          <option key={wallet.id} value={wallet.id}>
                            💳 {wallet.name} (Balance: {formatCurrency(wallet.balance)})
                          </option>
                        ))}
                      </select>

                      {currentPrepaidWallet && (
                        <div className="flex items-center justify-between text-[11px] text-[#A8AFB8] px-1">
                          <span>
                            Available Balance:{' '}
                            <strong className="text-[#32D583]">
                              {formatCurrency(currentPrepaidWallet.balance)}
                            </strong>
                          </span>
                          <span className="text-[#9B8AFB]">Spending Account unaffected</span>
                        </div>
                      )}

                      {currentPrepaidWallet &&
                        amount &&
                        parseFloat(amount) > currentPrepaidWallet.balance && (
                          <div className="p-2 rounded-lg bg-[#F97066]/10 border border-[#F97066]/20 text-[#F97066] text-[11px] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Entered amount ({formatCurrency(parseFloat(amount))}) exceeds card balance (
                              {formatCurrency(currentPrepaidWallet.balance)}).
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

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
            </>
          )}

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#A8AFB8] block">Description (Optional)</label>
            <input
              type="text"
              placeholder={
                type === 'EXPENSE'
                  ? 'e.g. Bingo Chips / Metro ride'
                  : type === 'INCOME'
                  ? 'e.g. September Salary'
                  : type === 'RECHARGE'
                  ? 'e.g. Monthly Metro Card top-up'
                  : 'e.g. Spending replenishment'
              }
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

          {/* Account Selection (for non-recharge, and for expense when paid via account) */}
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
          ) : type !== 'RECHARGE' && (type === 'INCOME' || paymentMode === 'account') ? (
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
          ) : null}

          {/* Submit Button */}
          <div className="pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                type === 'EXPENSE'
                  ? 'bg-[#7C5CFC] hover:bg-[#6847ea] active:scale-[0.99]'
                  : type === 'INCOME'
                  ? 'bg-[#32D583] hover:bg-[#2bc477] text-gray-950 font-semibold active:scale-[0.99]'
                  : type === 'TRANSFER'
                  ? 'bg-[#53B1FD] hover:bg-[#43a1ed] text-gray-950 font-semibold active:scale-[0.99]'
                  : 'bg-[#9B8AFB] hover:bg-[#8672f7] text-gray-950 font-semibold active:scale-[0.99]'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                'Saving...'
              ) : editTransaction ? (
                'Update Transaction'
              ) : type === 'EXPENSE' ? (
                paymentMode === 'prepaid' ? 'Pay from Prepaid Card' : 'Add Expense'
              ) : type === 'INCOME' ? (
                'Add Income'
              ) : type === 'TRANSFER' ? (
                'Transfer'
              ) : (
                'Save Recharge'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
