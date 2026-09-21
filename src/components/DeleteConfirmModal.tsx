import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDateDisplay } from '../lib/financials';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-xl bg-[#171A1F] border border-[#282D34] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#F97066]">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-semibold text-[#F5F7FA]">Delete this transaction?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#737B86] hover:text-[#F5F7FA] hover:bg-[#1D2127]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transaction Details Box */}
        <div className="rounded-lg bg-[#111418] border border-[#282D34] p-4 space-y-1.5">
          <div className="text-xl font-bold text-[#F5F7FA]">
            {formatCurrency(transaction.amount)}
          </div>
          <div className="text-xs font-medium text-[#A8AFB8]">
            {transaction.category}
            {transaction.subcategory ? ` · ${transaction.subcategory}` : ''}
          </div>
          {transaction.description && (
            <div className="text-xs text-[#737B86] truncate">
              {transaction.description}
            </div>
          )}
          <div className="text-[11px] text-[#505760] pt-1">
            {formatDateDisplay(transaction.date)}
          </div>
        </div>

        <p className="text-xs text-[#A8AFB8]">
          This transaction will be removed from your records and accounts balance will be automatically adjusted.
        </p>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-3 rounded-lg bg-[#1D2127] hover:bg-[#282D34] text-[#F5F7FA] text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-3 rounded-lg bg-[#F97066] hover:bg-[#e45a50] text-gray-950 text-xs font-bold transition disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
