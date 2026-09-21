import React from 'react';
import { X } from 'lucide-react';
import { Account, Transaction } from '../types';
import { formatCurrency, formatDateDisplay } from '../lib/financials';
import { CategoryIcon } from './CategoryIcon';

interface UnderlyingTransactionsModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  transactions: Transaction[];
  accounts: Account[];
  onClose: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const UnderlyingTransactionsModal: React.FC<UnderlyingTransactionsModalProps> = ({
  isOpen,
  title,
  subtitle,
  transactions,
  accounts,
  onClose,
  onSelectTransaction,
}) => {
  if (!isOpen) return null;

  const totalAmount = transactions.reduce((sum, t) => sum + (t.type === 'EXPENSE' ? t.amount : t.type === 'INCOME' ? t.amount : t.amount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-[#171A1F] border border-[#282D34] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#282D34]">
          <div>
            <h3 className="text-base font-semibold text-[#F5F7FA]">{title}</h3>
            {subtitle && <p className="text-xs text-[#A8AFB8]">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#737B86] hover:text-[#F5F7FA] hover:bg-[#1D2127]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary pill */}
        <div className="px-5 py-2.5 bg-[#111418] border-b border-[#282D34] flex items-center justify-between text-xs">
          <span className="text-[#A8AFB8]">
            {transactions.length} transaction{transactions.length === 1 ? '' : 's'}
          </span>
          <span className="font-bold text-[#F5F7FA]">Total: {formatCurrency(totalAmount)}</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-[#282D34]/50">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#737B86]">No transactions found in this view.</div>
          ) : (
            transactions.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                  className={`pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-lg transition-colors ${
                    onSelectTransaction ? 'hover:bg-[#1D2127] cursor-pointer' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CategoryIcon name={tx.category} className="w-3.5 h-3.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#F5F7FA] truncate">
                        {tx.description || tx.category}
                      </div>
                      <div className="text-[11px] text-[#737B86] flex items-center gap-1.5 truncate">
                        <span>{formatDateDisplay(tx.date)}</span>
                        <span>·</span>
                        <span>{acc?.name || 'Account'}</span>
                        {tx.subcategory && (
                          <>
                            <span>·</span>
                            <span className="text-[#A8AFB8]">{tx.subcategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-xs font-bold whitespace-nowrap ${
                      tx.type === 'EXPENSE'
                        ? 'text-[#F97066]'
                        : tx.type === 'INCOME'
                        ? 'text-[#32D583]'
                        : 'text-[#53B1FD]'
                    }`}
                  >
                    {tx.type === 'EXPENSE' ? '-' : tx.type === 'INCOME' ? '+' : ''}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111418] border-t border-[#282D34] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-[#1D2127] hover:bg-[#282D34] text-xs font-medium text-[#F5F7FA] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
