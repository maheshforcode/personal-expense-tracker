import React from 'react';
import { Edit2, Trash2, X, ArrowRightLeft } from 'lucide-react';
import { Account, Transaction } from '../types';
import { formatCurrency, formatDateDisplay } from '../lib/financials';
import { CategoryIcon } from './CategoryIcon';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  accounts: Account[];
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transaction,
  accounts,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !transaction) return null;

  const sourceAccount = accounts.find((a) => a.id === transaction.accountId);
  const destinationAccount = transaction.toAccountId
    ? accounts.find((a) => a.id === transaction.toAccountId)
    : null;

  const isExpense = transaction.type === 'EXPENSE';
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-xl bg-[#171A1F] border border-[#282D34] shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon name={transaction.category} className="w-4 h-4" />
            <span className="text-xs font-semibold text-[#A8AFB8] uppercase tracking-wider">
              {transaction.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#737B86] hover:text-[#F5F7FA] hover:bg-[#1D2127]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <div
            className={`text-3xl font-extrabold ${
              isExpense
                ? 'text-[#F97066]'
                : isIncome
                ? 'text-[#32D583]'
                : 'text-[#53B1FD]'
            }`}
          >
            {isExpense ? '-' : isIncome ? '+' : ''}
            {formatCurrency(transaction.amount)}
          </div>
          <div className="text-sm font-medium text-[#F5F7FA]">
            {transaction.category}
            {transaction.subcategory && (
              <span className="text-xs font-normal text-[#A8AFB8]"> · {transaction.subcategory}</span>
            )}
          </div>
        </div>

        {/* Details list */}
        <div className="rounded-xl bg-[#111418] border border-[#282D34] divide-y divide-[#282D34] text-xs">
          {transaction.description && (
            <div className="p-3 flex justify-between">
              <span className="text-[#737B86]">Description</span>
              <span className="text-[#F5F7FA] font-medium text-right">{transaction.description}</span>
            </div>
          )}

          <div className="p-3 flex justify-between">
            <span className="text-[#737B86]">Date</span>
            <span className="text-[#F5F7FA] font-medium">{formatDateDisplay(transaction.date)}</span>
          </div>

          <div className="p-3 flex justify-between items-center">
            <span className="text-[#737B86]">Account</span>
            <span className="text-[#F5F7FA] font-medium flex items-center gap-1.5">
              {isTransfer ? (
                <>
                  <span>{sourceAccount?.name || 'Account'}</span>
                  <ArrowRightLeft className="w-3 h-3 text-[#53B1FD]" />
                  <span>{destinationAccount?.name || 'Account'}</span>
                </>
              ) : (
                sourceAccount?.name || 'Spending Account'
              )}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(transaction);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#1D2127] hover:bg-[#282D34] text-[#F5F7FA] text-xs font-semibold flex items-center justify-center gap-2 border border-[#282D34] transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(transaction);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#F97066]/15 hover:bg-[#F97066]/25 text-[#F97066] border border-[#F97066]/30 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
