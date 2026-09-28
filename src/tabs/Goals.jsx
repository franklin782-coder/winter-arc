import React from 'react';
import { Target, Mountain } from 'lucide-react';
import { Card, CardTitle, Bar, Ring, SectionHeader, Empty } from '../components/ui.jsx';
import { fmtNum, goalCurrent, goalProgress, fmtShort, diffDays, pct } from '../lib.js';

const CAT = {
  'Спорт': { c: 'from-sky-400 to-cyan-300', chip: 'bg-sky-500/15 text-sky-300' },
  'Работа': { c: 'from-emerald-400 to-teal-300', chip: 'bg-emerald-500/15 text-emerald-300' },
  'Развитие': { c: 'from-violet-400 to-fuchsia-300', chip: 'bg-violet-500/15 text-violet-300' },
  'Финансы': { c: 'from-amber-400 to-yellow-300', chip: 'bg-amber-500/15 text-amber-300' },
};
const cat = (c) => CAT[c] || { c: 'from-slate-400 to-slate-300', chip: 'bg-white/10 text-slate-300' };

function GoalList({ goals, data, model }) {
  if (!goals?.length) return <Empty>Целей пока нет</Empty>;
  return (
    <div className="space-y-4">
      {goals.map((g) => {
        const cur = goalCurrent(g, data, model);
        const p = goalProgress(g, cur);
        const k = cat(g.category);
        return (
          <div key={g.id}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-slate-100 truncate">{g.title}</span>
                <span className={`chip ${k.chip} hidden sm:inline-flex`}>{g.category}</span>
              </div>
              <span className="text-sm font-semibold text-white tabular-nums shrink-0">{Math.round(p)}%</span>
            </div>
            <Bar value={p} color={k.c} className="h-2.5" />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
              <span>старт {fmtNum(g.start, 1)} {g.unit}</span>
              <span className="text-slate-300">сейчас {fmtNum(cur, 1)} {g.unit}</span>
              <span>цель {fmtNum(g.target, 1)} {g.unit}</span>
            </div>
            {g.deadline && <div className="text-[11px] text-slate-500 mt-0.5">срок: {fmtShort(g.deadline)} · осталось {Math.max(0, diffDays(model.today, g.deadline))} дн.{g.target != null && cur != null && Math.abs(cur - g.target) > 1e-9 ? ` · ещё ${fmtNum(Math.abs(cur - g.target), 1)} ${g.unit}` : ''}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function Goals({ data, model }) {
  const { meta } = data;
  const goals = { month: data.goals?.month || [], sixMonth: data.goals?.sixMonth || [] };
  const avg = (gs) => gs.length ? gs.reduce((s, g) => s + goalProgress(g, goalCurrent(g, data, model)), 0) / gs.length : 0;
  const mAvg = avg(goals.month), sAvg = avg(goals.sixMonth);
  const sixTotal = diffDays(meta.startDate, meta.longTermEndDate);
  const sixElapsed = pct(Math.max(0, model.dayNum), sixTotal);
  const monthElapsed = pct(Math.min(model.dayNum, meta.durationDays), meta.durationDays);
  return (
    <div>
      <SectionHeader title="Цели" subtitle="Прогресс по целям месяца и полугодия" />
      <div className="grid sm:grid-cols-2 gap-3 md:gap-4 mb-4">
        {[
          { label: 'Цели месяца', v: mAvg, n: goals.month.length, time: monthElapsed, color: '#38bdf8', sub: `${fmtShort(meta.startDate)} — ${meta.durationDays} дней` },
          { label: 'Цели на 6 месяцев', v: sAvg, n: goals.sixMonth.length, time: sixElapsed, color: '#a78bfa', sub: `до ${fmtShort(meta.longTermEndDate)}` },
        ].map((x) => (
          <Card key={x.label} className="flex items-center gap-5">
            <Ring value={x.v} color={x.color} size={104}><span className="text-xl font-semibold text-white">{Math.round(x.v)}%</span><span className="text-[10px] text-slate-400">прогресс</span></Ring>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium">{x.label}</div>
              <div className="text-xs text-slate-400 mb-3">{x.sub}</div>
              <div className="text-[11px] text-slate-500 mb-1">Прошло времени: {Math.round(x.time)}%</div>
              <Bar value={x.time} color="from-slate-400 to-slate-300" className="h-1.5" />
              {!x.n ? <div className="text-xs mt-2 text-slate-500">Целей пока нет</div>
                : <div className={`text-xs mt-2 ${x.v >= x.time ? 'text-emerald-300' : x.time <= 5 ? 'text-sky-300' : 'text-amber-300'}`}>{x.v >= x.time ? 'Опережаете график ✓' : x.time <= 5 ? 'Старт — только начали' : 'Немного отстаёте от графика'}</div>}
            </div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
        <Card><CardTitle icon={Target}>На месяц</CardTitle><GoalList goals={goals.month} data={data} model={model} /></Card>
        <Card><CardTitle icon={Mountain} color="text-violet-400">На 6 месяцев</CardTitle><GoalList goals={goals.sixMonth} data={data} model={model} /></Card>
      </div>
    </div>
  );
}
