import React from 'react';
import { CheckCircle2, Circle, CalendarDays } from 'lucide-react';
import { Card, CardTitle, SectionHeader, Ring } from '../components/ui.jsx';
import MonthCalendar from '../components/MonthCalendar.jsx';
import { addDays, monthLabel } from '../lib.js';

export default function Tasks({ data, model }) {
  const list = data.taskList || { month: model.today.slice(0, 7), items: [] };
  const items = list.items || [];
  const done = items.filter((t) => t.done).length;
  const total = items.length;
  const arcEnd = addDays(data.meta.startDate, data.meta.durationDays - 1);
  const month = list.month || model.today.slice(0, 7);

  const cell = (iso) => {
    if (iso > model.today) return { tone: 'future' };
    const pinned = items.filter((t) => t.date && t.date === iso);
    if (!pinned.length) return { tone: 'empty' };
    const ok = pinned.filter((t) => t.done).length;
    const tone = ok === pinned.length ? 'good' : ok > 0 ? 'mid' : 'flat';
    const label = pinned.length > 1 ? String(pinned.length) : '•';
    return { tone, label, title: pinned.map((t) => t.title).join(', ') };
  };

  return (
    <div>
      <SectionHeader title="Задачи" subtitle={`${list.label || 'Список месяца'} · ${monthLabel(month)}`} />
      <Card className="mb-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Ring value={total ? (done / total) * 100 : 0} size={96} stroke={9} color="#a78bfa">
            <span className="text-lg font-semibold text-white tabular-nums">{done}/{total || 0}</span>
          </Ring>
          <div className="min-w-0">
            <div className="text-white font-medium">Сделано из списка</div>
            <div className="text-sm text-slate-400 mt-1">{done} из {total || 0}. Отметок о выполнении нет.</div>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {!items.length && <li className="text-sm text-slate-500">Список пуст</li>}
          {items.map((t) => (
            <li key={t.id || t.title} className="flex items-center gap-3 rounded-xl bg-white/[.03] px-3 py-3 text-sm">
              {t.done ? <CheckCircle2 size={20} className="text-violet-400 shrink-0" /> : <Circle size={20} className="text-slate-600 shrink-0" />}
              <span className={t.done ? 'text-slate-500 line-through' : 'text-slate-100'}>{t.title}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle icon={CalendarDays} color="text-violet-400">Календарь</CardTitle>
        <p className="text-xs text-slate-500 mb-3">Задачу можно поставить на конкретный день. Сейчас ни одна не привязана — клетки пустые.</p>
        <MonthCalendar
          today={model.today}
          minMonth={month < data.meta.startDate.slice(0, 7) ? month : data.meta.startDate.slice(0, 7)}
          maxMonth={arcEnd.slice(0, 7) > month ? arcEnd.slice(0, 7) : month}
          getCell={cell}
          showBar={false}
        />
      </Card>
    </div>
  );
}
