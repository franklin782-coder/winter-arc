import React, { useState } from 'react';
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, CalendarDays, BarChart3 } from 'lucide-react';
import { Card, CardTitle, Ring, Bar, SectionHeader, ChartTooltip, Stat, Empty } from '../components/ui.jsx';
import { dayTasks, fmtShort, fmtLong, weekday, arcWeek } from '../lib.js';

export default function Tasks({ data, model }) {
  const dates = model.allDates.filter((d) => d <= model.today && model.get(d)?.tasks?.length);
  if (!dates.includes(model.today)) dates.push(model.today);
  const [sel, setSel] = useState(dates[dates.length - 1] || model.today);
  const idx = dates.indexOf(sel);
  const day = model.get(sel) || {};
  const t = dayTasks(day);

  const byDay = dates.map((d) => ({ date: d, label: fmtShort(d), pct: Math.round(dayTasks(model.get(d)).pct ?? 0) }));
  const weeks = {};
  for (const d of dates) { const w = arcWeek(data, d); const x = dayTasks(model.get(d)); weeks[w] = weeks[w] || { done: 0, total: 0 }; weeks[w].done += x.done; weeks[w].total += x.total; }
  const totalDone = dates.reduce((s, d) => s + dayTasks(model.get(d)).done, 0);
  const totalAll = dates.reduce((s, d) => s + dayTasks(model.get(d)).total, 0);
  const perfect = dates.filter((d) => dayTasks(model.get(d)).pct === 100).length;
  const color = (p) => (p >= 80 ? '#a78bfa' : p >= 50 ? '#818cf8' : '#475569');

  return (
    <div>
      <SectionHeader title="Задачи" subtitle="Ежедневный чек-лист и процент выполнения" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        <Stat label="Выполнено всего" value={totalDone} unit={`/ ${totalAll}`} icon={CheckCircle2} accent="text-violet-400" />
        <Stat label="Средний % " value={totalAll ? Math.round((totalDone / totalAll) * 100) : 0} unit="%" icon={BarChart3} accent="text-violet-400" />
        <Stat label="Идеальных дней" value={perfect} sub="100% задач" icon={CalendarDays} accent="text-violet-400" />
        <Stat label="Эта неделя" value={(() => { const w = weeks[arcWeek(data, model.today)]; return w?.total ? Math.round((w.done / w.total) * 100) : 0; })()} unit="%" icon={CalendarDays} accent="text-violet-400" />
      </div>

      <div className="grid lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <button disabled={idx <= 0} onClick={() => setSel(dates[idx - 1])} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30"><ChevronLeft size={18} /></button>
            <div className="text-center">
              <div className="text-white font-medium">{fmtLong(sel)}</div>
              <div className="text-xs text-slate-400">{sel === model.today ? 'Сегодня' : `${t.done} из ${t.total}`}</div>
            </div>
            <button disabled={idx >= dates.length - 1} onClick={() => setSel(dates[idx + 1])} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <Ring value={t.pct || 0} color="#a78bfa" size={72} stroke={8}><span className="text-sm font-semibold text-white">{Math.round(t.pct || 0)}%</span></Ring>
            <div className="text-sm text-slate-400">Выполнено <span className="text-white font-medium">{t.done}</span> из <span className="text-white font-medium">{t.total}</span> задач</div>
          </div>
          {!day.tasks?.length && <Empty>Задач на этот день нет</Empty>}
          <ul className="space-y-1.5">
            {(day.tasks || []).map((task, i) => (
              <li key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${task.done ? 'bg-violet-500/[.07]' : 'bg-white/[.03]'}`}>
                {task.done ? <CheckCircle2 size={18} className="text-violet-400 shrink-0" /> : <Circle size={18} className="text-slate-600 shrink-0" />}
                <span className={task.done ? 'text-slate-400 line-through' : 'text-slate-100'}>{task.title}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="lg:col-span-3 space-y-3 md:space-y-4">
          <Card>
            <CardTitle icon={BarChart3} color="text-violet-400">Выполнение по дням</CardTitle>
            <div className="h-56">
              {!totalAll ? <div className="h-full flex items-center justify-center"><Empty>Задачи пока не записаны</Empty></div> : <ResponsiveContainer><BarChart data={byDay} margin={{ left: -20, right: 4, top: 8 }} onClick={(e) => e?.activePayload && setSel(e.activePayload[0].payload.date)}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} content={<ChartTooltip unit="%" names={{ pct: 'Выполнено' }} />} />
                <RBar dataKey="pct" radius={[6, 6, 0, 0]} maxBarSize={28} className="cursor-pointer">
                  {byDay.map((d) => <Cell key={d.date} fill={color(d.pct)} stroke={d.date === sel ? '#e9d5ff' : 'none'} strokeWidth={1.5} />)}
                </RBar>
              </BarChart></ResponsiveContainer>}
            </div>
          </Card>
          <Card>
            <CardTitle icon={CalendarDays} color="text-violet-400">По неделям</CardTitle>
            <div className="space-y-3">
              {!totalAll && <Empty>Нет данных</Empty>}
              {Object.entries(weeks).filter(([, x]) => x.total > 0).map(([w, x]) => (
                <div key={w}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-slate-300">Неделя {w}</span><span className="text-white tabular-nums">{x.done}/{x.total} · {Math.round((x.done / x.total) * 100)}%</span></div>
                  <Bar value={(x.done / x.total) * 100} color="from-violet-400 to-fuchsia-400" />
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {totalAll > 0 && byDay.map((d) => (
                <button key={d.date} onClick={() => setSel(d.date)} title={`${d.label}: ${d.pct}%`}
                  className={`h-11 rounded-lg text-[10px] flex flex-col items-center justify-center ${d.date === sel ? 'ring-2 ring-violet-300' : ''}`}
                  style={{ background: `rgba(167,139,250,${0.08 + (d.pct / 100) * 0.6})` }}>
                  <span className="text-slate-300">{weekday(d.date)}</span><span className="text-white font-medium">{d.pct}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
