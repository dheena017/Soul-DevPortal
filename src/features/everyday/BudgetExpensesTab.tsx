import React, { useMemo, useState } from 'react';
import { HeroArtworkBackdrop, MiniRadialRing } from '../../components/PortalVisuals';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import { useScrollEdgeFade } from '../../utils/useScrollEdgeFade';

export interface ExpenseEntry {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export interface ExpensesWorkspaceState {
  currency: string;
  monthlyBudget: number;
  entries: ExpenseEntry[];
}

const EXPENSE_CATEGORIES = ['Food & Coffee', 'Groceries', 'Travel & Fuel', 'Bills & Utilities', 'Shopping', 'Health', 'Fun', 'Other'];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const BudgetExpensesTab: React.FC = () => {
  const [state, setState] = useSyncedWorkspaceState<ExpensesWorkspaceState>('expenses', {
    currency: '₹',
    monthlyBudget: 15000,
    entries: [],
  });

  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Food & Coffee');
  const [date, setDate] = useState<string>(() => todayIso());
  const [catFilter, setCatFilter] = useState<string>('All');
  const [editingBudget, setEditingBudget] = useState<boolean>(false);

  const monthPrefix = todayIso().slice(0, 7);

  const summary = useMemo(() => {
    const thisMonth = state.entries.filter((e) => e.date.startsWith(monthPrefix));
    const spentMonth = thisMonth.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const spentToday = state.entries
      .filter((e) => e.date === todayIso())
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const remaining = Math.max(0, state.monthlyBudget - spentMonth);
    const pct = state.monthlyBudget > 0 ? Math.min(100, Math.round((spentMonth / state.monthlyBudget) * 100)) : 0;

    const byCategory: Record<string, number> = {};
    thisMonth.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.amount) || 0);
    });
    const breakdown = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => ({
        cat,
        total,
        share: spentMonth > 0 ? Math.round((total / spentMonth) * 100) : 0,
      }));

    return { spentMonth, spentToday, remaining, pct, breakdown };
  }, [state.entries, state.monthlyBudget, monthPrefix]);

  const visibleEntries = useMemo(
    () =>
      state.entries
        .filter((e) => catFilter === 'All' || e.category === catFilter)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.entries, catFilter]
  );

  const ledgerScroll = useScrollEdgeFade([visibleEntries.length, catFilter]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!title.trim() || Number.isNaN(num) || num <= 0) return;
    setState((prev) => ({
      ...prev,
      entries: [
        {
          id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: title.trim(),
          amount: Math.round(num * 100) / 100,
          category,
          date: date || todayIso(),
        },
        ...prev.entries,
      ],
    }));
    setTitle('');
    setAmount('');
  };

  const handleExportCsv = () => {
    const rows = ['Date,Title,Category,Amount', ...state.entries.map((e) => `${e.date},"${e.title.replace(/"/g, '""')}",${e.category},${e.amount}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${monthPrefix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
      {/* Main Logger + Ledger */}
      <section className="neu-card xl:col-span-8 rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1112] shrink-0">
          <HeroArtworkBackdrop src="/visuals/tab-database-wal.jpg" alt="Daily Expenses Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-white">Daily Expense &amp; Monthly Budget Tracker</h2>
              <p className="text-xs text-zinc-300/90">Log quick spending and monitor remaining monthly budget.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="neu-inset flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#080b0c]/90 border border-emerald-400/25">
                <MiniRadialRing
                  percent={summary.pct}
                  color={summary.pct > 90 ? '#fb7185' : '#34d399'}
                  size={24}
                />
                <span className="text-[11px] font-mono font-bold text-white tabular-nums">{summary.pct}% used</span>
              </div>
              <select
                value={state.currency}
                onChange={(e) => setState((p) => ({ ...p, currency: e.target.value }))}
                aria-label="Currency symbol"
                className="h-8 px-2 rounded-lg bg-[#08090c]/90 border border-white/[0.12] text-xs font-mono text-white"
              >
                {['₹', '$', '€', '£', '¥'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleExportCsv}
                className="neu-btn h-8 px-3 rounded-lg bg-[#161821]/95 border border-white/[0.12] text-xs font-mono text-zinc-200 hover:text-white cursor-pointer"
              >
                Export .csv
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col gap-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="neu-tile p-3.5 rounded-xl bg-[#16171e] border border-white/[0.08]">
              <div className="text-[11px] font-mono text-zinc-400">Spent This Month</div>
              <div className="text-xl font-extrabold font-mono text-white tabular-nums mt-0.5">
                {state.currency}{summary.spentMonth.toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Today: {state.currency}{summary.spentToday.toLocaleString()}</div>
            </div>

            <div className="neu-tile p-3.5 rounded-xl bg-[#16171e] border border-white/[0.08]">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Monthly Budget</span>
                <button
                  type="button"
                  onClick={() => setEditingBudget((b) => !b)}
                  className="text-sky-300 hover:underline cursor-pointer"
                >
                  {editingBudget ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingBudget ? (
                <input
                  type="number"
                  value={state.monthlyBudget}
                  onChange={(e) => setState((p) => ({ ...p, monthlyBudget: Math.max(0, Number(e.target.value) || 0) }))}
                  className="mt-1 w-full h-8 px-2 rounded-lg bg-[#08090c] border border-sky-400/40 text-sm font-mono text-white"
                />
              ) : (
                <div className="text-xl font-extrabold font-mono text-sky-300 tabular-nums mt-0.5">
                  {state.currency}{state.monthlyBudget.toLocaleString()}
                </div>
              )}
            </div>

            <div className="neu-tile p-3.5 rounded-xl bg-[#16171e] border border-white/[0.08] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Remaining</span>
                <span className={summary.pct > 90 ? 'text-rose-300 font-bold' : 'text-emerald-300 font-bold'}>
                  {summary.pct}% used
                </span>
              </div>
              <div className="text-xl font-extrabold font-mono text-emerald-300 tabular-nums">
                {state.currency}{summary.remaining.toLocaleString()}
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden mt-1">
                <div
                  className={`h-full transition-all ${summary.pct > 90 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                  style={{ width: `${summary.pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Expense Form */}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.8fr_1fr_auto_auto] gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Expense description (Lunch, Coffee, Cab...)"
              aria-label="Expense description"
              className="h-10 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-sky-400/45"
            />
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Amount (${state.currency})`}
              aria-label="Expense amount"
              className="h-10 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-emerald-400/45"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Expense category"
              className="h-10 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Expense date"
              className="h-10 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-zinc-200"
            />
            <button
              type="submit"
              className="neu-btn h-10 px-4 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 text-xs font-extrabold cursor-pointer"
            >
              + Log
            </button>
          </form>

          {/* Entries List */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg bg-[#16171e] border border-white/[0.08] text-xs text-zinc-200"
              >
                <option value="All">All Categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-mono text-zinc-500">{visibleEntries.length} records</span>
            </div>

            {visibleEntries.length === 0 ? (
              <div className="neu-inset flex-1 min-h-[110px] flex items-center justify-center py-6 text-center text-xs text-zinc-500 rounded-xl bg-[#0d0e13] border border-dashed border-white/[0.08]">
                No expenses logged yet. Add one above to see live spending analytics.
              </div>
            ) : (
              <div
                ref={ledgerScroll.ref}
                onScroll={ledgerScroll.onScroll}
                className={`flex flex-col gap-1.5 max-h-64 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1.5 ${ledgerScroll.fadeClass}`}
              >
                {visibleEntries.map((item) => (
                  <div
                    key={item.id}
                    className="neu-tile flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#16171e] border border-white/[0.06] text-xs shrink-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="neu-inset px-2 py-0.5 rounded bg-white/[0.05] text-[10px] font-mono text-zinc-300 shrink-0">
                        {item.category}
                      </span>
                      <span className="font-semibold text-white truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <span className="text-zinc-500 text-[11px]">{item.date}</span>
                      <strong className="text-emerald-300 tabular-nums">
                        {state.currency}{item.amount.toLocaleString()}
                      </strong>
                      <button
                        type="button"
                        onClick={() =>
                          setState((p) => ({
                            ...p,
                            entries: p.entries.filter((x) => x.id !== item.id),
                          }))
                        }
                        className="text-zinc-500 hover:text-rose-300 cursor-pointer"
                        aria-label={`Delete ${item.title}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>Month: {monthPrefix}</span>
          <span className="text-zinc-600">Synced live to SQLite</span>
        </div>
      </section>

      {/* Right Breakdown */}
      <section className="neu-card xl:col-span-4 rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1015] shrink-0">
          <HeroArtworkBackdrop src="/visuals/tab-api-rest.jpg" alt="Category Breakdown Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-white">Monthly Category Breakdown</h3>
              <p className="text-xs text-zinc-300/90">Share of spending across {monthPrefix}.</p>
            </div>
            <span className="neu-tile shrink-0 px-2.5 py-1 rounded-md bg-[#080b12]/85 backdrop-blur-sm border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300">
              {summary.breakdown.length} active
            </span>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col gap-3">
          {summary.breakdown.length === 0 ? (
            <div className="neu-inset flex-1 min-h-[160px] flex flex-col items-center justify-center p-6 rounded-xl bg-[#0d0e13] border border-dashed border-white/[0.08] text-center text-xs text-zinc-500 gap-1">
              <span>No expenses logged for {monthPrefix} yet.</span>
              <span className="text-[11px] text-zinc-600">Category bars appear automatically when you log spend.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {summary.breakdown.map((row) => (
                <div key={row.cat} className="neu-tile p-2.5 rounded-xl bg-[#14151c] border border-white/[0.06] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-semibold">{row.cat}</span>
                    <span className="font-mono text-sky-300 font-bold tabular-nums">
                      {state.currency}{row.total.toLocaleString()} ({row.share}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${row.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>{summary.breakdown[0] ? `Top: ${summary.breakdown[0].cat}` : 'No category leader'}</span>
          <span className="text-sky-300/80 tabular-nums">{state.currency}{summary.spentMonth.toLocaleString()}</span>
        </div>
      </section>
    </div>
  );
};
