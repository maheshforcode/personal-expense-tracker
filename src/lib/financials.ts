import { Account, Budget, Category, PrepaidWallet, TimePeriod, Transaction } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCurrency(amount: number, currencySymbol = '₹'): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  // Indian currency formatting standard (lakhs, crores) if INR
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(abs);

  return `${isNegative ? '-' : ''}${currencySymbol}${formatted}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const d = new Date(year, month, day);

  const todayStr = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (dateStr === todayStr) {
    return 'Today · ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  }
  if (dateStr === yStr) {
    return 'Yesterday · ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  }

  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export function getDateRangeForPeriod(period: TimePeriod, customRange?: DateRange): DateRange {
  const now = new Date();
  const todayStr = getTodayDateString();

  if (period === 'today') {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (period === 'week') {
    // Current week starting Monday
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const endStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
    return { startDate: startStr, endDate: endStr };
  }

  if (period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
    return { startDate: startStr, endDate: endStr };
  }

  if (period === 'year') {
    const year = now.getFullYear();
    return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
  }

  if (period === 'custom' && customRange) {
    return customRange;
  }

  return { startDate: `${now.getFullYear()}-01-01`, endDate: todayStr };
}

export function getPreviousPeriodRange(period: TimePeriod, currentRange: DateRange): DateRange {
  const [sYear, sMonth, sDay] = currentRange.startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = currentRange.endDate.split('-').map(Number);
  const start = new Date(sYear, sMonth - 1, sDay);
  const end = new Date(eYear, eMonth - 1, eDay);

  if (period === 'week') {
    const prevStart = new Date(start);
    prevStart.setDate(start.getDate() - 7);
    const prevEnd = new Date(end);
    prevEnd.setDate(end.getDate() - 7);
    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
    };
  }

  if (period === 'month') {
    const prevMonthDate = new Date(start);
    prevMonthDate.setMonth(start.getMonth() - 1);
    const year = prevMonthDate.getFullYear();
    const month = prevMonthDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      startDate: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  // default fallback: same duration shifted back
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
  const prevStart = new Date(start);
  prevStart.setDate(start.getDate() - diffDays);
  const prevEnd = new Date(end);
  prevEnd.setDate(end.getDate() - diffDays);
  return {
    startDate: prevStart.toISOString().split('T')[0],
    endDate: prevEnd.toISOString().split('T')[0],
  };
}

export interface AccountCalculatedSummary {
  account: Account;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transfersIn: number;
  transfersOut: number;
  netChange: number;
}

export function calculateAccountSummaries(accounts: Account[], transactions: Transaction[]): {
  summaries: AccountCalculatedSummary[];
  totalMoney: number;
} {
  let totalMoney = 0;

  const summaries = accounts.map((acc) => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let transfersIn = 0;
    let transfersOut = 0;

    transactions.forEach((tx) => {
      if (tx.isDeleted) return;

      if (tx.type === 'INCOME' && tx.accountId === acc.id) {
        totalIncome += tx.amount;
      } else if (tx.type === 'EXPENSE' && tx.accountId === acc.id) {
        // Only deduct from spending account if not paid from a prepaid balance
        if (tx.paymentMode !== 'prepaid') {
          totalExpenses += tx.amount;
        }
      } else if (tx.type === 'RECHARGE' && tx.accountId === acc.id) {
        // Total Amount Paid is deducted from the selected spending/bank account
        totalExpenses += tx.amount;
      } else if (tx.type === 'TRANSFER') {
        if (tx.accountId === acc.id) {
          transfersOut += tx.amount;
        }
        if (tx.toAccountId === acc.id) {
          transfersIn += tx.amount;
        }
      }
    });

    const currentBalance = (acc.initialBalance || 0) + totalIncome - totalExpenses + transfersIn - transfersOut;
    totalMoney += currentBalance;

    return {
      account: acc,
      currentBalance,
      totalIncome,
      totalExpenses,
      transfersIn,
      transfersOut,
      netChange: totalIncome - totalExpenses,
    };
  });

  return { summaries, totalMoney };
}

export function calculatePrepaidWallets(transactions: Transaction[]): PrepaidWallet[] {
  const walletMap = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      totalCredited: number;
      totalSpent: number;
      totalFees: number;
      lastUsedDate?: string;
      transactionCount: number;
    }
  >();

  const getWalletKey = (name: string, id?: string) => {
    if (id && id.trim()) return id.trim();
    return 'prep_' + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  };

  transactions.forEach((tx) => {
    if (tx.isDeleted) return;

    if (tx.type === 'RECHARGE') {
      const name = (tx.prepaidName || tx.subcategory || tx.category || 'Prepaid Card').trim();
      const key = getWalletKey(name, tx.prepaidId);
      const credited = typeof tx.creditedAmount === 'number' ? tx.creditedAmount : Math.max(0, tx.amount - (tx.fee || 0));
      const fee = tx.fee || 0;

      const existing = walletMap.get(key) || {
        id: key,
        name,
        category: tx.category || 'Transport',
        totalCredited: 0,
        totalSpent: 0,
        totalFees: 0,
        lastUsedDate: tx.date,
        transactionCount: 0,
      };

      existing.totalCredited = Math.round((existing.totalCredited + credited) * 100) / 100;
      existing.totalFees = Math.round((existing.totalFees + fee) * 100) / 100;
      existing.transactionCount += 1;
      if (!existing.lastUsedDate || tx.date > existing.lastUsedDate) {
        existing.lastUsedDate = tx.date;
      }
      walletMap.set(key, existing);
    } else if (tx.type === 'EXPENSE' && tx.paymentMode === 'prepaid') {
      const name = (tx.prepaidName || tx.subcategory || 'Prepaid Card').trim();
      const key = getWalletKey(name, tx.prepaidId);

      const existing = walletMap.get(key) || {
        id: key,
        name,
        category: tx.category || 'Transport',
        totalCredited: 0,
        totalSpent: 0,
        totalFees: 0,
        lastUsedDate: tx.date,
        transactionCount: 0,
      };

      existing.totalSpent = Math.round((existing.totalSpent + tx.amount) * 100) / 100;
      existing.transactionCount += 1;
      if (!existing.lastUsedDate || tx.date > existing.lastUsedDate) {
        existing.lastUsedDate = tx.date;
      }
      walletMap.set(key, existing);
    }
  });

  const wallets: PrepaidWallet[] = [];
  walletMap.forEach((w) => {
    const isTransport =
      w.name.toLowerCase().includes('metro') ||
      w.name.toLowerCase().includes('fastag') ||
      w.name.toLowerCase().includes('bus') ||
      w.category.toLowerCase().includes('transport');

    const isMobile =
      w.name.toLowerCase().includes('mobile') ||
      w.name.toLowerCase().includes('phone') ||
      w.name.toLowerCase().includes('jio') ||
      w.name.toLowerCase().includes('airtel') ||
      w.category.toLowerCase().includes('recharge');

    wallets.push({
      ...w,
      balance: Math.round((w.totalCredited - w.totalSpent) * 100) / 100,
      icon: isTransport ? 'Train' : isMobile ? 'Smartphone' : 'CreditCard',
      color: isTransport ? '#53B1FD' : isMobile ? '#32D583' : '#7C5CFC',
    });
  });

  // Sort by balance descending, then by last used date
  wallets.sort((a, b) => b.balance - a.balance || (b.lastUsedDate || '').localeCompare(a.lastUsedDate || ''));
  return wallets;
}

export interface PeriodSummary {
  income: number;
  expenses: number;
  transfers: number;
  netChange: number; // Income - Expenses (Transfers excluded)
  transactionsCount: number;
  averageDailySpending: number;
  averageTransaction: number;
  largestExpense: number;
  smallestExpense: number;
  highestSpendingDay: { date: string; amount: number } | null;
  highestSpendingCategory: { name: string; amount: number } | null;
  daysWithSpending: number;
  noSpendingDays: number;
}

export interface CategoryBreakdownItem {
  categoryName: string;
  categoryId?: string;
  color?: string;
  totalAmount: number;
  count: number;
  percentage: number;
  averageTransaction: number;
}

export function calculatePeriodSummary(
  transactions: Transaction[],
  range: DateRange,
  categories: Category[] = []
): {
  summary: PeriodSummary;
  categoryBreakdown: CategoryBreakdownItem[];
  dailySpendingList: { date: string; amount: number }[];
} {
  const filtered = transactions.filter((t) => {
    if (t.isDeleted) return false;
    return t.date >= range.startDate && t.date <= range.endDate;
  });

  let income = 0;
  let expenses = 0;
  let transfers = 0;
  let expenseCount = 0;
  let largestExpense = 0;
  let smallestExpense = Infinity;

  const categoryMap = new Map<string, { amount: number; count: number }>();
  const dailyMap = new Map<string, number>();

  filtered.forEach((t) => {
    if (t.type === 'INCOME') {
      income += t.amount;
    } else if (t.type === 'EXPENSE') {
      expenses += t.amount;
      expenseCount++;
      if (t.amount > largestExpense) largestExpense = t.amount;
      if (t.amount < smallestExpense) smallestExpense = t.amount;

      // category
      const catName = t.category || 'Other';
      const existing = categoryMap.get(catName) || { amount: 0, count: 0 };
      categoryMap.set(catName, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      });

      // daily
      const dayExisting = dailyMap.get(t.date) || 0;
      dailyMap.set(t.date, dayExisting + t.amount);
    } else if (t.type === 'TRANSFER') {
      transfers += t.amount;
    } else if (t.type === 'RECHARGE') {
      const rechargeFee = t.fee || 0;
      if (rechargeFee > 0) {
        expenses += rechargeFee;
        expenseCount++;
        if (rechargeFee > largestExpense) largestExpense = rechargeFee;
        if (rechargeFee < smallestExpense) smallestExpense = rechargeFee;

        // category: attribute fee to recharge category
        const catName = t.category || 'Recharge & Internet';
        const existing = categoryMap.get(catName) || { amount: 0, count: 0 };
        categoryMap.set(catName, {
          amount: existing.amount + rechargeFee,
          count: existing.count + 1,
        });

        // daily
        const dayExisting = dailyMap.get(t.date) || 0;
        dailyMap.set(t.date, dayExisting + rechargeFee);
      }
    }
  });

  if (smallestExpense === Infinity) {
    smallestExpense = 0;
  }

  // Days in range calculation
  const [sY, sM, sD] = range.startDate.split('-').map(Number);
  const [eY, eM, eD] = range.endDate.split('-').map(Number);
  const startDt = new Date(sY, sM - 1, sD);
  const endDt = new Date(eY, eM - 1, eD);
  const totalDaysInRange = Math.max(1, Math.round((endDt.getTime() - startDt.getTime()) / (1000 * 3600 * 24)) + 1);

  const daysWithSpending = dailyMap.size;
  const noSpendingDays = Math.max(0, totalDaysInRange - daysWithSpending);

  // Highest spending day
  let highestDay: { date: string; amount: number } | null = null;
  dailyMap.forEach((amt, dt) => {
    if (!highestDay || amt > highestDay.amount) {
      highestDay = { date: dt, amount: amt };
    }
  });

  // Category breakdown list
  const categoryBreakdown: CategoryBreakdownItem[] = [];
  let highestCat: { name: string; amount: number } | null = null;

  categoryMap.forEach((data, catName) => {
    const matchedCategory = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    const pct = expenses > 0 ? (data.amount / expenses) * 100 : 0;
    const avg = data.count > 0 ? data.amount / data.count : 0;

    if (!highestCat || data.amount > highestCat.amount) {
      highestCat = { name: catName, amount: data.amount };
    }

    categoryBreakdown.push({
      categoryName: catName,
      categoryId: matchedCategory?.id,
      color: matchedCategory?.color || '#7C5CFC',
      totalAmount: data.amount,
      count: data.count,
      percentage: pct,
      averageTransaction: avg,
    });
  });

  // Sort categories by total spending descending
  categoryBreakdown.sort((a, b) => b.totalAmount - a.totalAmount);

  // Daily spending array sorted by date
  const dailySpendingList: { date: string; amount: number }[] = [];
  dailyMap.forEach((amt, dt) => {
    dailySpendingList.push({ date: dt, amount: amt });
  });
  dailySpendingList.sort((a, b) => a.date.localeCompare(b.date));

  const averageDailySpending = totalDaysInRange > 0 ? expenses / totalDaysInRange : 0;
  const averageTransaction = expenseCount > 0 ? expenses / expenseCount : 0;

  const summary: PeriodSummary = {
    income,
    expenses,
    transfers,
    netChange: income - expenses,
    transactionsCount: filtered.length,
    averageDailySpending,
    averageTransaction,
    largestExpense,
    smallestExpense,
    highestSpendingDay: highestDay,
    highestSpendingCategory: highestCat,
    daysWithSpending,
    noSpendingDays,
  };

  return { summary, categoryBreakdown, dailySpendingList };
}

export interface BudgetComparisonItem {
  category: Category;
  budget: Budget;
  actualAmount: number;
  plannedAmount: number;
  difference: number; // planned - actual (positive is under budget, negative is over budget)
  percentageUsed: number;
}

export function calculateBudgetComparisons(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
  monthRange: DateRange
): BudgetComparisonItem[] {
  const monthTransactions = transactions.filter(
    (t) => !t.isDeleted && t.type === 'EXPENSE' && t.date >= monthRange.startDate && t.date <= monthRange.endDate
  );

  return budgets
    .map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      if (!cat) return null;

      const catExpenses = monthTransactions
        .filter((t) => t.category.toLowerCase() === cat.name.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);

      const planned = b.monthlyAmount;
      const diff = planned - catExpenses;
      const pct = planned > 0 ? (catExpenses / planned) * 100 : 0;

      return {
        category: cat,
        budget: b,
        actualAmount: catExpenses,
        plannedAmount: planned,
        difference: diff,
        percentageUsed: pct,
      };
    })
    .filter((item): item is BudgetComparisonItem => item !== null);
}
