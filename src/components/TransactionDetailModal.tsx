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
  const isRecharge = transaction.type === 'RECHARGE';
  const isPrepaidExpense = isExpense && transaction.paymentMode === 'prepaid';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-xl bg-[#171A1F] border border-[#282D34] shadow-2xl p-6 space-y-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon name={transaction.category} className="w-4 h-4" />
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isRecharge
                  ? 'text-[#9B8AFB]'
                  : isPrepaidExpense
                  ? 'text-[#53B1FD]'
                  : 'text-[#A8AFB8]'
              }`}
            >
              {isRecharge
                ? 'RECHARGE'
                : isPrepaidExpense
                ? 'EXPENSE (PREPAID)'
                : transaction.type}
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
                : isRecharge
                ? 'text-[#9B8AFB]'
                : 'text-[#53B1FD]'
            }`}
          >
            {isExpense || isRecharge ? '-' : isIncome ? '+' : ''}
            {formatCurrency(transaction.amount)}
          </div>
          <div className="text-sm font-medium text-[#F5F7FA]">
            {isRecharge ? (
              <span>
                {transaction.prepaidName || 'Prepaid Card'} ·{' '}
                <span className="text-[#32D583]">
                  +{formatCurrency(transaction.creditedAmount || transaction.amount - (transaction.fee || 0))} credited
                </span>
              </span>
            ) : (
              <>
                {transaction.category}
                {transaction.subcategory && (
                  <span className="text-xs font-normal text-[#A8AFB8]"> · {transaction.subcategory}</span>
                )}
              </>
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

          {isRecharge ? (
            <>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#737B86]">Amount Paid</span>
                <span className="text-[#F97066] font-semibold">{formatCurrency(transaction.amount)}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#737B86]">Credited to Card</span>
                <span className="text-[#32D583] font-semibold">
                  +{formatCurrency(transaction.creditedAmount || transaction.amount - (transaction.fee || 0))}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#737B86]">Fee / Charge</span>
                <span className="text-[#F5F7FA] font-medium">
                  {formatCurrency(transaction.fee || 0)}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#737B86]">Prepaid Card</span>
                <span className="text-[#53B1FD] font-medium">💳 {transaction.prepaidName || 'Card'}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#737B86]">Deducted From</span>
                <span className="text-[#F5F7FA] font-medium">{sourceAccount?.name || 'Spending Account'}</span>
              </div>
            </>
          ) : (
            <div className="p-3 flex justify-between items-center">
              <span className="text-[#737B86]">
                {isPrepaidExpense ? 'Paid Via' : 'Account'}
              </span>
              <span className="text-[#F5F7FA] font-medium flex items-center gap-1.5">
                {isTransfer ? (
                  <>
                    <span>{sourceAccount?.name || 'Account'}</span>
                    <ArrowRightLeft className="w-3 h-3 text-[#53B1FD]" />
                    <span>{destinationAccount?.name || 'Account'}</span>
                  </>
                ) : isPrepaidExpense ? (
                  <span className="text-[#53B1FD]">
                    💳 {transaction.prepaidName || 'Prepaid Card'}{' '}
                    <span className="text-[10px] text-[#737B86]">(Bank unaffected)</span>
                  </span>
                ) : (
                  sourceAccount?.name || 'Spending Account'
                )}
              </span>
            </div>
          )}
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
