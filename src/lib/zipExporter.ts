import JSZip from 'jszip';
import { ExpenseTrackerBackup } from '../types';

export async function generateAndDownloadZipBackup(backup: ExpenseTrackerBackup, fileNamePrefix = 'expense-tracker-backup'): Promise<void> {
  const zip = new JSZip();
  const dateStr = new Date().toISOString().split('T')[0];

  // 1. Versioned JSON backup
  const jsonContent = JSON.stringify(backup, null, 2);
  zip.file(`expense-tracker-${dateStr}.expense.json`, jsonContent);

  // 2. Transactions CSV
  const csvHeaders = ['ID', 'Type', 'Amount', 'Currency', 'Category', 'Subcategory', 'Description', 'Date', 'Account ID', 'To Account ID', 'Created At'];
  const csvRows = backup.transactions.map((tx) => [
    `"${tx.id}"`,
    `"${tx.type}"`,
    tx.amount,
    `"${backup.metadata.currency || 'INR'}"`,
    `"${(tx.category || '').replace(/"/g, '""')}"`,
    `"${(tx.subcategory || '').replace(/"/g, '""')}"`,
    `"${(tx.description || '').replace(/"/g, '""')}"`,
    `"${tx.date}"`,
    `"${tx.accountId}"`,
    `"${tx.toAccountId || ''}"`,
    `"${tx.createdAt || ''}"`,
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
  zip.file(`transactions-${dateStr}.csv`, csvContent);

  // 3. Accounts CSV
  const accHeaders = ['Account ID', 'Account Name', 'Type', 'Initial Balance', 'Currency'];
  const accRows = backup.accounts.map((acc) => [
    `"${acc.id}"`,
    `"${acc.name.replace(/"/g, '""')}"`,
    `"${acc.type}"`,
    acc.initialBalance || 0,
    `"${acc.currency || 'INR'}"`,
  ]);
  const accCsvContent = [accHeaders.join(','), ...accRows.map((r) => r.join(','))].join('\n');
  zip.file(`accounts-${dateStr}.csv`, accCsvContent);

  // 4. README file
  const readme = `Personal Expense Tracker Backup Archive
Generated: ${new Date().toLocaleString()}
Currency: ${backup.metadata.currency || 'INR'}
Total Transactions: ${backup.transactions.length}
Accounts: ${backup.accounts.length}

Files included:
- expense-tracker-${dateStr}.expense.json: Native backup file ready to import/restore in the Personal Expense Tracker app.
- transactions-${dateStr}.csv: Spreadsheet export for Google Sheets, Excel, or CSV viewers.
- accounts-${dateStr}.csv: List of user accounts and starting balances.

To restore this backup:
1. Open the Personal Expense Tracker web application.
2. Go to Settings -> Import Backup or Analysis section.
3. Select the .expense.json file from this zip archive.
`;
  zip.file('README.txt', readme);

  // Generate blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileNamePrefix}-${dateStr}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(content: object, filename: string): void {
  const jsonStr = JSON.stringify(content, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
