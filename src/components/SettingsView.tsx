import React, { useState } from 'react';
import {
  Download,
  Upload,
  Archive,
  Trash2,
  Plus,
  Target,
  Database,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  User,
  Check,
  Edit3,
} from 'lucide-react';
import { Account, Budget, Category, ExpenseTrackerBackup, Transaction } from '../types';
import { generateAndDownloadZipBackup, downloadJsonFile } from '../lib/zipExporter';
import { validateAndParseBackupContent } from '../lib/backupParser';
import { formatCurrency } from '../lib/financials';
import { CategoryIcon } from './CategoryIcon';

interface SettingsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  userName: string;
  onUpdateUserName: (name: string) => Promise<void>;
  onExportBackup: () => Promise<ExpenseTrackerBackup>;
  onImportBackup: (backup: ExpenseTrackerBackup, replaceAll: boolean) => Promise<{ added: number; skipped: number }>;
  onClearData: () => Promise<void>;
  onAddCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onSaveBudget: (budget: Budget) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  transactions,
  accounts,
  categories,
  budgets,
  userName,
  onUpdateUserName,
  onExportBackup,
  onImportBackup,
  onClearData,
  onAddCategory,
  onDeleteCategory,
  onSaveBudget,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  // New Category state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [newCatColor, setNewCatColor] = useState('#7C5CFC');
  const [newCatSubs, setNewCatSubs] = useState('');

  // Budget editing state
  const [editingBudgetCatId, setEditingBudgetCatId] = useState<string | null>(null);
  const [budgetAmountInput, setBudgetAmountInput] = useState('');

  // Handle Export JSON
  const handleExportJson = async () => {
    try {
      const backup = await onExportBackup();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadJsonFile(backup, `expense-tracker-${dateStr}.expense.json`);
    } catch {
      alert('Failed to export JSON backup');
    }
  };

  // Handle Download Working ZIP archive
  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      const backup = await onExportBackup();
      await generateAndDownloadZipBackup(backup, 'expense-tracker-backup');
    } catch (err) {
      alert('Failed to generate ZIP: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExportingZip(false);
    }
  };

  // Handle Import File
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, replaceAll: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    setImportError(null);

    try {
      const text = await file.text();
      const validation = validateAndParseBackupContent(text, file.name);

      if (!validation.isValid || !validation.backup) {
        setImportError(validation.error || 'Invalid backup file.');
        return;
      }

      const res = await onImportBackup(validation.backup, replaceAll);
      setImportStatus(
        `Import completed successfully: ${res.added} transactions added, ${res.skipped} duplicate transactions skipped.`
      );
    } catch (err) {
      setImportError('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      e.target.value = '';
    }
  };

  // Handle Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const subcategoryList = newCatSubs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
      }));

    const newCat: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
      subcategories: subcategoryList.length > 0 ? subcategoryList : undefined,
    };

    await onAddCategory(newCat);
    setNewCatName('');
    setNewCatSubs('');
    setShowAddCat(false);
  };

  // Handle Save Budget
  const handleSaveBudgetAmount = async (categoryId: string) => {
    const amount = parseFloat(budgetAmountInput);
    if (!isNaN(amount) && amount >= 0) {
      const existing = budgets.find((b) => b.categoryId === categoryId);
      const budgetObj: Budget = {
        id: existing?.id || `bgt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        categoryId,
        monthlyAmount: amount,
        period: 'monthly',
      };
      await onSaveBudget(budgetObj);
    }
    setEditingBudgetCatId(null);
    setBudgetAmountInput('');
  };

  return (
    <div id="settings-view" className="space-y-6 pb-24 sm:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#F5F7FA]">Settings & Data</h2>
        <p className="text-xs text-[#A8AFB8] mt-0.5">
          User profile, local database management, backups, categories, and planned budgets
        </p>
      </div>

      {/* User Profile Card */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#7C5CFC]" />
            <h3 className="text-sm font-semibold text-[#F5F7FA]">User Profile</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/30 font-medium">
            Personal Account
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#111418] border border-[#282D34]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 flex items-center justify-center text-[#7C5CFC] font-bold text-base">
              {(userName || 'Mahesh ;)').charAt(0).toUpperCase()}
            </div>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-[#171A1F] border border-[#7C5CFC] text-xs text-[#F5F7FA] focus:outline-hidden"
                    placeholder="Enter name (e.g. Mahesh ;))"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (nameInput.trim()) {
                        await onUpdateUserName(nameInput.trim());
                      }
                      setIsEditingName(false);
                    }}
                    className="p-1.5 rounded-lg bg-[#7C5CFC] hover:bg-[#6847ea] text-white"
                    title="Save name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#F5F7FA]">{userName || 'Mahesh ;)'}</span>
                  <button
                    onClick={() => {
                      setNameInput(userName || 'Mahesh ;)');
                      setIsEditingName(true);
                    }}
                    className="text-[#737B86] hover:text-[#7C5CFC] transition"
                    title="Edit Name"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-[11px] text-[#A8AFB8] mt-0.5">Primary Profile · Indian Rupee (₹)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#737B86] self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-lg bg-[#171A1F] border border-[#282D34] text-[#A8AFB8]">
              Currency: <strong>INR (₹)</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Local Storage Status */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#7C5CFC]" />
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Local Storage Engine</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#32D583]/10 text-[#32D583] border border-[#32D583]/30 font-medium">
            IndexedDB Active
          </span>
        </div>

        <p className="text-xs text-[#A8AFB8] leading-relaxed">
          All data is stored directly in your browser without requiring any cloud server or subscription.
          Transactions, categories, and accounts remain safe offline.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Transactions</span>
            <span className="text-base font-bold text-[#F5F7FA] mt-0.5 block">{transactions.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Accounts</span>
            <span className="text-base font-bold text-[#F5F7FA] mt-0.5 block">{accounts.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Categories</span>
            <span className="text-base font-bold text-[#F5F7FA] mt-0.5 block">{categories.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#111418] border border-[#282D34]">
            <span className="text-[#737B86] block text-[11px]">Budgets</span>
            <span className="text-base font-bold text-[#F5F7FA] mt-0.5 block">{budgets.length}</span>
          </div>
        </div>
      </div>

      {/* Backup & Export (Working ZIP and JSON) */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#F5F7FA]">Backup & Export</h3>
          <p className="text-xs text-[#737B86] mt-0.5">
            Download your full data archive. The ZIP file includes the versioned JSON backup, Excel/CSV spreadsheets, and documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Download Complete Data Archive ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6847ea] text-white text-xs font-semibold shadow-lg transition active:scale-[0.99] disabled:opacity-50 text-center"
          >
            <Archive className="w-4 h-4 shrink-0" />
            <span>{isExportingZip ? 'Generating...' : 'Download Data Archive (.zip)'}</span>
          </button>

          {/* Export .expense.json */}
          <button
            onClick={handleExportJson}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#1D2127] hover:bg-[#282D34] text-[#F5F7FA] border border-[#282D34] text-xs font-semibold transition active:scale-[0.99] text-center"
          >
            <Download className="w-4 h-4 text-[#7C5CFC] shrink-0" />
            <span>Export Backup (.expense.json)</span>
          </button>

          {/* Download Working Project Source Code ZIP */}
          <a
            href="/personal-expense-tracker.zip"
            download="personal-expense-tracker.zip"
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#1D2127] hover:bg-[#282D34] text-[#32D583] border border-[#32D583]/30 text-xs font-semibold transition active:scale-[0.99] text-center"
          >
            <Archive className="w-4 h-4 text-[#32D583] shrink-0" />
            <span>Download Project Code (.zip)</span>
          </a>
        </div>

        {/* Import Section */}
        <div className="pt-3 border-t border-[#282D34] space-y-3">
          <h4 className="text-xs font-semibold text-[#F5F7FA]">Restore or Merge Backup</h4>

          {importStatus && (
            <div className="p-3 rounded-lg bg-[#32D583]/10 border border-[#32D583]/30 text-xs text-[#32D583] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 rounded-lg bg-[#F97066]/10 border border-[#F97066]/30 text-xs text-[#F97066] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D2127] hover:bg-[#282D34] text-[#F5F7FA] border border-[#282D34] text-xs font-medium cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-[#32D583]" />
              <span>Merge Backup (Duplicate-Safe)</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => handleFileChange(e, false)}
              />
            </label>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D2127] hover:bg-[#282D34] text-[#F97066] border border-[#F97066]/30 text-xs font-medium cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-[#F97066]" />
              <span>Replace All Data</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  if (window.confirm('Warning: This will replace all existing transactions and accounts with the file. Continue?')) {
                    handleFileChange(e, true);
                  } else {
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Planned Budgets Configuration */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Planned Monthly Budgets</h3>
            <p className="text-xs text-[#737B86]">Set monthly spending targets for categories to track planned vs actual expenses</p>
          </div>
          <Target className="w-4 h-4 text-[#7C5CFC]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories
            .filter((c) => c.type === 'EXPENSE' || c.type === 'BOTH' || !c.type)
            .map((cat) => {
              const currentBudget = budgets.find((b) => b.categoryId === cat.id);
              const isEditing = editingBudgetCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="rounded-xl bg-[#111418] border border-[#282D34] p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CategoryIcon name={cat.name} color={cat.color} className="w-3.5 h-3.5" />
                    <span className="font-medium text-[#F5F7FA] truncate">{cat.name}</span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[#A8AFB8]">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={budgetAmountInput}
                        onChange={(e) => setBudgetAmountInput(e.target.value)}
                        className="w-20 bg-[#171A1F] border border-[#7C5CFC] rounded px-1.5 py-0.5 text-xs text-[#F5F7FA] focus:outline-hidden"
                      />
                      <button
                        onClick={() => handleSaveBudgetAmount(cat.id)}
                        className="px-2 py-0.5 bg-[#7C5CFC] text-white rounded text-[11px]"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingBudgetCatId(cat.id);
                        setBudgetAmountInput((currentBudget?.monthlyAmount || 0).toString());
                      }}
                      className="text-right hover:text-[#7C5CFC] transition"
                    >
                      <span className="font-bold text-[#F5F7FA] block">
                        {currentBudget ? formatCurrency(currentBudget.monthlyAmount) : 'Not set'}
                      </span>
                      <span className="text-[10px] text-[#737B86]">Tap to edit</span>
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Categories Manager */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#282D34] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Category Manager</h3>
            <p className="text-xs text-[#737B86]">Organize spending & income classifications and subcategories</p>
          </div>
          <button
            onClick={() => setShowAddCat(!showAddCat)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C5CFC] text-white text-xs font-medium hover:bg-[#6a48f0] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        </div>

        {/* Add Category Form */}
        {showAddCat && (
          <form onSubmit={handleCreateCategory} className="p-4 rounded-xl bg-[#111418] border border-[#7C5CFC]/40 space-y-3">
            <h4 className="text-xs font-semibold text-[#F5F7FA]">Add Custom Category</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#A8AFB8] block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Subscriptions"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="w-full bg-[#171A1F] border border-[#282D34] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#A8AFB8] block mb-1">Type</label>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as 'EXPENSE' | 'INCOME')}
                  className="w-full bg-[#171A1F] border border-[#282D34] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
                >
                  <option value="EXPENSE">Expense Category</option>
                  <option value="INCOME">Income Category</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#A8AFB8] block mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs text-[#A8AFB8]">{newCatColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#A8AFB8] block mb-1">
                Subcategories (Comma-separated, optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Netflix, Spotify, iCloud"
                value={newCatSubs}
                onChange={(e) => setNewCatSubs(e.target.value)}
                className="w-full bg-[#171A1F] border border-[#282D34] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-hidden focus:border-[#7C5CFC]"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAddCat(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1D2127] text-xs text-[#A8AFB8] hover:text-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#7C5CFC] hover:bg-[#6847ea] text-white text-xs font-semibold"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3 rounded-xl bg-[#111418] border border-[#282D34] flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CategoryIcon name={cat.name} color={cat.color} className="w-3.5 h-3.5" />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-[#F5F7FA] truncate block">{cat.name}</span>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <span className="text-[10px] text-[#737B86] truncate block">
                      {cat.subcategories.length} subcategories
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button (for custom categories) */}
              {cat.id.startsWith('cat_') && (
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  className="p-1 rounded text-[#737B86] hover:text-[#F97066]"
                  title="Delete category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone: Clear Local Data */}
      <div className="rounded-2xl bg-[#171A1F] border border-[#F97066]/30 p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#F97066]">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Danger Zone</h3>
        </div>
        <p className="text-xs text-[#737B86]">
          Erase all transactions, custom categories, and budgets stored in this browser.
          Make sure you have downloaded a backup ZIP or JSON first.
        </p>

        {showClearConfirm ? (
          <div className="p-3 rounded-xl bg-[#F97066]/10 border border-[#F97066]/40 space-y-2">
            <p className="text-xs font-semibold text-[#F97066]">
              Are you completely sure? This will delete {transactions.length} transactions permanently.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await onClearData();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#F97066] text-gray-950 text-xs font-bold hover:bg-[#e25c52]"
              >
                Yes, Delete Everything
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1D2127] text-xs text-[#A8AFB8] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 rounded-xl bg-[#F97066]/15 hover:bg-[#F97066]/25 text-[#F97066] border border-[#F97066]/30 text-xs font-semibold transition"
          >
            Clear All Data
          </button>
        )}
      </div>
    </div>
  );
};
