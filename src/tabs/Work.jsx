import React from 'react';
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, AreaChart, Area } from 'recharts';
import { Briefcase, Clock, CalendarDays, TrendingUp, NotebookPen, CheckCircle2 } from 'lucide-react';
import { Card, CardTitle, SectionHeader, Stat, Bar, ChartTooltip, Empty } from '../components/ui.jsx';
import { fmtNum, fmtShort, fmtLong, arcWeek, pct } from '../lib.js';

export default function Work({ data, model }) {
  const { targets } = data;
  const dates = model.allDates.filter((d) => d <= model.today);
  const h = (d) => model.get(d)?.work?.hours || 0;
  const total = dates.reduce((s, d) => s + h(d), 0);
  const worked = dates.filter((d) => h(d) > 0);
  const series = dates.map((d) => ({ label: fmtShort(d), hours: h(d) }));
  let acc = 0; const cum = dates.map((d) => ({ label: fmtShort(d), total: (acc += h(d)) }));
  const weeks = {};
  for (const d of dates) { const w = arcWeek(data, d); weeks[w] = (weeks[w] || 0) + h(d); }
  const thisWeek = weeks[arcWeek(data, model.today)] || 0;
  const tD = targets.workHoursPerDay ?? null, tW = targets.workHoursPerWeek ?? null;
  const log = [...dates].reverse().filter((d) => model.get(d)?.work);

  return (
    <div>
      <SectionHeader title="Работа" subtitle="Часы, результаты и заметки по дням" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        <Stat label="Сегодня" value={fmtNum(h(model.today), 1)} unit="ч" sub={tD ? `цель ${tD} ч` : 'цель не задана'} icon={Clock} accent="text-emerald-400"><Bar value={pct(h(model.today), targets.workHoursPerDay)} color="from-emerald-400 to-teal-400" className="h-1.5 mt-2" /></Stat>
        <Stat label="Эта неделя" value={fmtNum(thisWeek, 1)} unit="ч" sub={tW ? `цель ${tW} ч` : 'цель не задана'} icon={CalendarDays} accent="text-emerald-400"><Bar value={pct(thisWeek, targets.workHoursPerWeek)} color="from-emerald-400 to-teal-400" className="h-1.5 mt-2" /></Stat>
        <Stat label="За месяц" value={fmtNum(total, 1)} unit="ч" sub={`${worked.length} рабочих дней`} icon={Briefcase} accent="text-emerald-400" />
        <Stat label="В среднем" value={fmtNum(worked.length ? total / worked.length : 0, 1)} unit="ч/день" sub="по рабочим дням" icon={TrendingUp} accent="text-emerald-400" />
      </div>
      <div className="grid lg:grid-cols-3 gap-3 md:gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardTitle icon={Clock} color="text-emerald-400" right={<span className="text-xs text-slate-500">пунктир — цель</span>}>Часы по дням</CardTitle>
          <div className="h-60">
            {!total ? <div className="h-full flex items-center justify-center"><Empty>Рабочие часы пока не записаны</Empty></div> : <ResponsiveContainer><BarChart data={series} margin={{ left: -20, right: 4, top: 8 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} content={<ChartTooltip unit=" ч" names={{ hours: 'Часы' }} />} />
              {tD && <ReferenceLine y={tD} stroke="#34d399" strokeDasharray="4 4" strokeOpacity={0.6} />}
              <RBar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={28}>
                {series.map((d, i) => <Cell key={i} fill={tD && d.hours >= tD ? '#34d399' : '#14b8a6'} />)}
              </RBar>
            </BarChart></ResponsiveContainer>}
          </div>
        </Card>
        <Card>
          <CardTitle icon={CalendarDays} color="text-emerald-400">По неделям</CardTitle>
          <div className="space-y-4">
            {!total && <Empty>Нет данных</Empty>}
            {!!total && Object.entries(weeks).map(([w, v]) => (
              <div key={w}>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-300">Неделя {w}</span><span className="text-white tabular-nums">{fmtNum(v, 1)}{tW ? ` / ${tW}` : ''} ч</span></div>
                <Bar value={pct(v, targets.workHoursPerWeek)} color="from-emerald-400 to-teal-400" className="h-2.5" />
              </div>
            ))}
          </div>
          {cum.length > 1 && total > 0 && <div className="h-28 mt-5 -mx-1">
            <div className="text-xs text-slate-500 mb-1 px-1">Накопительно, ч</div>
            <ResponsiveContainer><AreaChart data={cum} margin={{ left: 0, right: 4, top: 4 }}>
              <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity=".35" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></linearGradient></defs>
              <Tooltip content={<ChartTooltip unit=" ч" names={{ total: 'Всего' }} />} />
              <Area dataKey="total" stroke="#34d399" strokeWidth={2} fill="url(#cg)" />
            </AreaChart></ResponsiveContainer>
          </div>}
        </Card>
      </div>
      <Card>
        <CardTitle icon={NotebookPen} color="text-emerald-400">Журнал результатов</CardTitle>
        <div className="divide-y divide-white/[.05]">
          {!log.length && <Empty>Записей о работе пока нет</Empty>}
          {log.map((d) => {
            const w = model.get(d)?.work || {};
            return (
              <div key={d} className="py-3 flex gap-4 items-start">
                <div className="w-14 shrink-0 text-center rounded-xl bg-emerald-500/10 py-1.5">
                  <div className="text-lg font-semibold text-emerald-300 tabular-nums leading-tight">{fmtNum(w.hours || 0, 1)}</div>
                  <div className="text-[10px] text-emerald-300/70">ч</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500">{fmtLong(d)}</div>
                  <div className="text-sm text-slate-100 mt-0.5">{w.notes || '—'}</div>
                  {!!w.results?.length && <div className="flex flex-wrap gap-1.5 mt-1.5">{w.results.map((r, i) => <span key={i} className="chip bg-white/5 text-slate-300"><CheckCircle2 size={12} className="text-emerald-400" />{r}</span>)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
