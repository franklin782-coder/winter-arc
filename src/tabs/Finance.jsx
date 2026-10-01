import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardTitle, SectionHeader, Stat, Ring, Bar } from '../components/ui.jsx';
import MonthCalendar from '../components/MonthCalendar.jsx';
import { addDays, financeFx, fmtNum, fmtUsd, fmtUsdCell, kztToUsd, monthDates, sumPnlKzt } from '../lib.js';

export default function Finance({ data, model }) {
  const fx = financeFx(data);
  const goal = (data.goals?.month || []).find((g) => g.auto === 'financeUsd');
  const month = goal?.month || (goal?.deadline || model.today).slice(0, 7);
  const targetKzt = goal?.targetKzt ?? null;
  const goalUsd = kztToUsd(targetKzt, fx?.kztPerUsd);
  const pnl = sumPnlKzt(data, model, month);
  const netUsd = pnl.any ? kztToUsd(pnl.sum, fx?.kztPerUsd) : 0;
  const progress = goalUsd ? Math.max(0, Math.min(100, (netUsd / goalUsd) * 100)) : 0;
  const arcEnd = addDays(data.meta.startDate, data.meta.durationDays - 1);
  const minMonth = data.meta.startDate.slice(0, 7);
  const maxMonth = arcEnd.slice(0, 7) > month ? arcEnd.slice(0, 7) : month;

  const cell = (iso) => {
    if (iso > model.today) return { tone: 'future' };
    const v = model.get(iso)?.pnlKzt;
    if (v == null || v === '') return { tone: 'empty' };
    const n = Number(v);
    if (Number.isNaN(n)) return { tone: 'empty' };
    const usd = kztToUsd(n, fx?.kztPerUsd);
    if (n > 0) return { tone: 'good', label: fmtUsdCell(usd), title: fmtUsd(usd) };
    if (n < 0) return { tone: 'bad', label: fmtUsdCell(usd), title: fmtUsd(usd) };
    return { tone: 'flat', label: fmtUsdCell(0), title: fmtUsd(0) };
  };

  return (
    <div>
      <SectionHeader title="Финансы" subtitle="План на октябрь. На календаре и в итогах — доллары." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        <Card className="col-span-2 flex items-center gap-4">
          <Ring value={progress} size={92} stroke={9} color={netUsd < 0 ? '#fb7185' : '#34d399'}>
            <span className="text-sm font-semibold text-white tabular-nums">{Math.round(progress)}%</span>
          </Ring>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400">Итог месяца</div>
            <div className={`text-2xl font-semibold tabular-nums ${netUsd < 0 ? 'text-rose-300' : 'text-white'}`}>{fmtUsd(netUsd)}</div>
            <div className="text-xs text-slate-400 truncate">из {goalUsd == null ? '—' : fmtUsd(goalUsd)}</div>
            <Bar value={progress} color="from-emerald-400 to-teal-300" className="h-2 mt-2" />
            {!pnl.any && <div className="text-[11px] text-slate-500 mt-1.5">Дневных результатов пока нет</div>}
          </div>
        </Card>
        <Stat label="Плюсовые дни" value={pnl.profit} icon={TrendingUp} accent="text-emerald-400" sub="прибыль" />
        <Stat label="Убыточные дни" value={pnl.loss} icon={TrendingDown} accent="text-rose-400" sub="убыток" />
      </div>

      <Card>
        <CardTitle icon={Wallet} color="text-emerald-400">Календарь</CardTitle>
        <MonthCalendar
          today={model.today}
          minMonth={minMonth}
          maxMonth={maxMonth}
          getCell={cell}
          summary={(ym) => {
            const snap = sumPnlKzt(data, model, ym);
            const net = snap.any ? kztToUsd(snap.sum, fx?.kztPerUsd) : 0;
            const same = ym === month;
            return [
              { label: 'Итог', value: snap.any ? fmtUsd(net) : '$0.00', accent: net < 0 ? 'text-rose-300' : 'text-emerald-300' },
              { label: 'Цель', value: same && goalUsd != null ? fmtUsd(goalUsd) : '—' },
              { label: 'Дни +/−', value: `${snap.profit}/${snap.loss}` },
            ];
          }}
          legend={[
            { tone: 'good', label: 'прибыль' },
            { tone: 'bad', label: 'убыток' },
            { tone: 'empty', label: 'нет записи' },
          ]}
        />
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          {fx ? <>Курс НБ РК на {fx.date}: {fmtNum(fx.kztPerUsd, 2)} ₸ за $1. План {fmtNum(targetKzt)} ₸ → {goalUsd == null ? '—' : fmtUsd(goalUsd)}.</> : 'Курс не задан.'}
          {' '}В день пишется сумма в тенге (<span className="text-slate-400">pnlKzt</span>), на экране она в долларах. Пустые клетки — дни без записи.
        </p>
      </Card>
    </div>
  );
}
