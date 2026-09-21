import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, Wallet, Plus, ArrowUpRight, ArrowDownRight, Edit3, Check } from 'lucide-react';
import { Account, Transaction } from '../types';
import { calculateAccountSummaries, formatCurrency, formatDateDisplay } from '../lib/financials';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onOpenTransfer: () => void;
  onUpdateInitialBalance: (accountId: string, newBalance: number) => Promise<void>;
  onSelectTransaction: (tx: Transaction) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  onOpenTransfer,
  onUpdateInitialBalance,
  onSelectTransaction,
}) => {
  const { summaries, totalMoney } = useMemo(
    () => calculateAccountSummaries(accounts, transactions),
    [accounts, transactions]
  );

  // Edit initial balance inline state
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editBalanceInput, setEditBalanceInput] = useState<string>('');

  const handleStartEdit = (acc: Account) => {
    setEditingAccountId(acc.id);
    setEditBalanceInput((acc.initialBalance || 0).toString());
  };

  const handleSaveBalance = async (accountId: string) => {
    const val = parseFloat(editBalanceInput);
    if (!isNaN(val)) {
      await onUpdateInitialBalance(accountId, Math.max(0, val));
    }
    setEditingAccountId(null);
  };

  // Filter transfers
  const transferHistory = useMemo(() => {
    return transactions
      .filter((t) => !t.isDeleted && t.type === 'TRANSFER')
      .slice(0, 10);
  }, [transactions]);

  return (
    <div id="accounts-view" className="space-y-6 pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F7FA]">Accounts</h2>
          <p className="text-xs text-[#A8AFB8] mt-0.5">
            Manage your Main holding reserve and daily Spending accounts
          </p>
        </div>

        <button
          onClick={onOpenTransfer}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#53B1FD] hover:bg-[#429fe5] text-gray-950 text-xs font-bold shadow-md transition active:scale-[0.98] self-start sm:self-auto"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>+ Transfer Money</span>
        </button>
      </div>

      {/* Total Money Card */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-medium text-[#A8AFB8] mb-1">
          <Wallet className="w-4 h-4 text-[#7C5CFC]" />
          <span>Combined Total Money</span>
        </div>
        <div className="text-3xl sm:text-4xl font-extrabold text-[#F5F7FA] mt-1">
          {formatCurrency(totalMoney)}
        </div>
        <p className="text-xs text-[#737B86] mt-1.5">
          Sum of Main Account and Spending Account balances.
        </p>
      </div>

      {/* Accounts List (Main Account & Spending Account) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {summaries.map((item) => {
          const acc = item.account;
          const isMain = acc.type === 'main';

          return (
            <div
              key={acc.id}
              className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-6 space-y-5 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: acc.color || (isMain ? '#7C5CFC' : '#53B1FD') }}
                    />
                    <h3 className="text-base font-bold text-[#F5F7FA]">{acc.name}</h3>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#111418] border border-[#282D34] text-[#A8AFB8]">
                    {isMain ? 'Holding Account' : 'Daily Spending'}
                  </span>
                </div>

                {acc.notes && <p className="text-xs text-[#737B86]">{acc.notes}</p>}

                <div className="pt-2">
                  <div className="text-[11px] text-[#737B86] uppercase font-semibold tracking-wider">
                    Current Balance
                  </div>
                  <div className="text-3xl font-extrabold text-[#F5F7FA] mt-0.5">
                    {formatCurrency(item.currentBalance)}
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="rounded-xl bg-[#111418] border border-[#282D34] p-3 divide-y divide-[#282D34] text-xs">
                {/* Initial Balance */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#737B86]">Opening Balance</span>
                  {editingAccountId === acc.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[#A8AFB8]">₹</span>
                      <input
                        type="number"
                        value={editBalanceInput}
                        onChange={(e) => setEditBalanceInput(e.target.value)}
                        className="w-24 bg-[#171A1F] border border-[#7C5CFC] rounded px-1.5 py-0.5 text-xs text-[#F5F7FA] focus:outline-hidden"
                      />
                      <button
                        onClick={() => handleSaveBalance(acc.id)}
                        className="p-1 rounded bg-[#7C5CFC] text-white hover:bg-[#6847ea]"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#F5F7FA]">
                        {formatCurrency(acc.initialBalance || 0)}
                      </span>
                      <button
                        onClick={() => handleStartEdit(acc)}
                        className="p-1 text-[#737B86] hover:text-[#F5F7FA]"
                        title="Edit initial balance"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Total Income */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#737B86] flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#32D583]" />
                    Total Income
                  </span>
                  <span className="font-semibold text-[#32D583]">
                    +{formatCurrency(item.totalIncome)}
                  </span>
                </div>

                {/* Transfers In */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#737B86] flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#53B1FD]" />
                    Transfers In
                  </span>
                  <span className="font-semibold text-[#53B1FD]">
                    +{formatCurrency(item.transfersIn)}
                  </span>
                </div>

                {/* Transfers Out */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#737B86] flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#53B1FD]" />
                    Transfers Out
                  </span>
                  <span className="font-semibold text-[#53B1FD]">
                    -{formatCurrency(item.transfersOut)}
                  </span>
                </div>

                {/* Total Expenses */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#737B86] flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-[#F97066]" />
                    Total Expenses
                  </span>
                  <span className="font-semibold text-[#F97066]">
                    -{formatCurrency(item.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer History */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Recent Account Transfers</h3>
            <p className="text-xs text-[#737B86]">Money movements between your own accounts</p>
          </div>
          <button
            onClick={onOpenTransfer}
            className="text-xs font-semibold text-[#53B1FD] hover:underline"
          >
            + New Transfer
          </button>
        </div>

        {transferHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#737B86] rounded-xl bg-[#111418] border border-[#282D34]/40">
            No transfers recorded yet. Transfers allow replenishing the Spending Account without increasing expense totals.
          </div>
        ) : (
          <div className="rounded-xl bg-[#111418] border border-[#282D34] divide-y divide-[#282D34] overflow-hidden">
            {transferHistory.map((tx) => {
              const src = accounts.find((a) => a.id === tx.accountId);
              const dest = accounts.find((a) => a.id === tx.toAccountId);

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#1D2127] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[#53B1FD]/10 text-[#53B1FD]">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F5F7FA] flex items-center gap-1.5 truncate">
                        <span>{src?.name || 'Main Account'}</span>
                        <span className="text-[#53B1FD]">→</span>
                        <span>{dest?.name || 'Spending Account'}</span>
                      </div>
                      <div className="text-[11px] text-[#737B86] mt-0.5">
                        {formatDateDisplay(tx.date)}
                        {tx.description && ` · ${tx.description}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-[#53B1FD] whitespace-nowrap">
                    {formatCurrency(tx.amount)}
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
