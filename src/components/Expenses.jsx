import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Receipt, Trash2, CalendarRange, CalendarDays, PiggyBank, PieChart as PieIcon } from 'lucide-react';
import { Card, CardTitle, Empty } from './ui.jsx';
import {
  EXPENSE_CATEGORIES, guessExpenseCategory, fmtKzt, fmtShort, monthLabel,
  readExpenses, writeExpenses, mergeExpenses, expenseSnapshot, monthSpendSlices,
} from '../lib.js';

const field = 'w-full min-h-[48px] rounded-xl bg-white/[.04] border border-white/[.08] px-3 text-base text-white outline-none focus:border-emerald-400/50';

function Money({ label, value, sub, icon: Icon, accent }) {
  return (
    <Card className="flex flex-col gap-1 min-w-0">
      <div className="card-title">{Icon && <Icon size={16} className={accent} />}<span className="truncate">{label}</span></div>
      <div className="text-lg sm:text-2xl font-semibold text-white tabular-nums tracking-tight leading-tight">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </Card>
  );
}

function KztTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-300">{p.name}</div>
      <div className="font-medium tabular-nums text-white">{fmtKzt(p.value)}</div>
    </div>
  );
}

export default function Expenses({ data, today }) {
  const [local, setLocal] = useState(readExpenses);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState('Другое');
  const [manual, setManual] = useState(false);
  const [error, setError] = useState('');

  const guess = guessExpenseCategory(note);
  const merged = useMemo(() => mergeExpenses(data, local), [data, local]);
  const snap = expenseSnapshot(merged, today);
  const slices = monthSpendSlices(merged, today);
  const month = today.slice(0, 7);
  const monthList = merged
    .filter((row) => row.date && row.date.startsWith(month))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1));
  const monthHasDepositOnly = monthList.length > 0 && slices.length === 0;

  const onNote = (value) => {
    setNote(value);
    if (!manual) setCategory(guessExpenseCategory(value));
  };

  const onSave = (e) => {
    e.preventDefault();
    const n = Number(String(amount).replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) {
      setError('Введите сумму больше нуля');
      return;
    }
    const row = {
      id: globalThis.crypto?.randomUUID?.() || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: date || today,
      amountKzt: n,
      note: note.trim(),
      category,
    };
    const next = writeExpenses([row, ...local]);
    setLocal(next);
    setAmount('');
    setNote('');
    setCategory('Другое');
    setManual(false);
    setError('');
  };

  const onDelete = (id) => {
    setLocal(writeExpenses(local.filter((row) => row.id !== id)));
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Расходы</h2>
      <p className="text-sm text-slate-400 mt-1 mb-4">Тенге. В цель и в календарь долларов это не входит.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        <Money label="Эта неделя" value={fmtKzt(snap.week)} sub="пн–вс, без депозита" icon={CalendarRange} accent="text-emerald-400" />
        <Money label="Этот месяц" value={fmtKzt(snap.month)} sub="без депозита" icon={CalendarDays} accent="text-emerald-400" />
        <Money label="Этот год" value={fmtKzt(snap.year)} sub="без депозита" icon={CalendarDays} accent="text-teal-300" />
        <Card className="flex flex-col gap-2 min-w-0">
          <div className="card-title"><PiggyBank size={16} className="text-indigo-300" /><span>Депозит</span></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-slate-500">Этот месяц</div>
              <div className="text-base sm:text-lg font-semibold text-white tabular-nums leading-tight">{fmtKzt(snap.depositMonth)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">За всё время</div>
              <div className="text-base sm:text-lg font-semibold text-white tabular-nums leading-tight">{fmtKzt(snap.depositAll)}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <CardTitle icon={PieIcon} color="text-emerald-400">{monthLabel(month)}</CardTitle>
        {slices.length === 0 ? (
          <Empty>
            {monthHasDepositOnly
              ? 'В этом месяце есть только депозит. Круг показывает траты, отложенные деньги в него не входят.'
              : 'Расходов за этот месяц пока нет. Добавь сумму ниже — здесь появится круг по категориям.'}
          </Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-4 items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={slices} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={2} stroke="none">
                    {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
                  </Pie>
                  <Tooltip content={<KztTip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 min-w-0">
              {slices.map((s) => (
                <li key={s.name} className="flex items-center gap-2 text-sm min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.fill }} />
                  <span className="flex-1 min-w-0 text-slate-300 truncate">{s.name}</span>
                  <span className="tabular-nums text-white shrink-0">{fmtKzt(s.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <CardTitle icon={Receipt} color="text-emerald-400">Новая запись</CardTitle>
        <form onSubmit={onSave} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Сумма, тенге</span>
            <input
              className={field}
              inputMode="decimal"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-400">На что</span>
            <input
              className={field}
              type="text"
              maxLength={80}
              placeholder="кофе, такси, аренда"
              value={note}
              onChange={(e) => onNote(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Дата</span>
            <input className={field} type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={{ colorScheme: 'dark' }} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Категория</span>
            <select
              className={field}
              value={category}
              onChange={(e) => { setManual(true); setCategory(e.target.value); }}
              style={{ colorScheme: 'dark' }}
            >
              {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
            </select>
            {note.trim() ? (
              <span className="text-[11px] text-slate-500">
                По заметке: {guess}{manual && guess !== category ? ' · выбрано вручную' : ''}
              </span>
            ) : null}
          </label>
          {error && <div className="text-sm text-rose-300">{error}</div>}
          <button type="submit" className="min-h-[48px] rounded-xl bg-emerald-400 text-slate-950 font-semibold text-base touch-manipulation active:scale-[.99]">
            Сохранить
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          На этом телефоне. Вечером напиши те же суммы в чат, чтобы я записал их на сайт.
        </p>
      </Card>

      <Card>
        <CardTitle icon={Receipt} color="text-emerald-400" right={<span className="text-xs text-slate-500">{monthLabel(month)}</span>}>
          Записи
        </CardTitle>
        {!monthList.length && <Empty>В этом месяце записей ещё нет.</Empty>}
        <ul className="space-y-2">
          {monthList.map((row) => (
            <li key={row.id} className="flex items-center gap-3 rounded-xl bg-white/[.03] px-3 py-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: EXPENSE_CATEGORIES.find((c) => c.label === row.category)?.color || '#94a3b8' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-100 truncate">{row.note || row.category}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {fmtShort(row.date)} · {row.category}{row.local ? '' : ' · с сайта'}
                </div>
              </div>
              <div className="text-sm font-medium text-white tabular-nums shrink-0">{fmtKzt(row.amountKzt)}</div>
              {row.local ? (
                <button type="button" aria-label="Удалить" onClick={() => onDelete(row.id)} className="shrink-0 min-h-[44px] min-w-[44px] -mr-1 rounded-xl text-slate-400 hover:text-rose-300 flex items-center justify-center touch-manipulation">
                  <Trash2 size={16} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
