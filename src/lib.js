// Вспомогательные функции: даты, агрегаты, стрики.
export const DAY = 864e5;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const iso = (d) => d.toISOString().slice(0, 10);
export const addDays = (s, n) => iso(new Date(parse(s).getTime() + n * DAY));
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / DAY);

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_FULL = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const WD_FULL = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
export const fmtShort = (s) => { const d = parse(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
export const fmtLong = (s) => { const d = parse(s); return `${d.getUTCDate()} ${MONTHS_FULL[d.getUTCMonth()]}, ${WD_FULL[d.getUTCDay()]}`; };
export const weekday = (s) => WD[parse(s).getUTCDay()];

export const almatyToday = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);

export const fmtNum = (n, digits = 0) =>
  n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export const pct = (a, b) => (b ? Math.max(0, Math.min(100, (a / b) * 100)) : 0);

export function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// Сумма КБЖУ за день
export function dayNutrition(day) {
  const meals = day?.nutrition?.meals || [];
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  for (const m of meals) { t.kcal += m.kcal || 0; t.protein += m.protein || 0; t.fat += m.fat || 0; t.carbs += m.carbs || 0; }
  return meals.length ? t : null;
}
export function dayTasks(day) {
  const tasks = day?.tasks || [];
  const done = tasks.filter((t) => t.done).length;
  return { done, total: tasks.length, pct: tasks.length ? (done / tasks.length) * 100 : null };
}
// Привычка может быть булевой (true/false) или счётной (h.target, значение — число 0..target)
export const habitDone = (h, v) => (h?.target ? (Number(v) || 0) >= h.target : !!v);
export const habitFrac = (h, v) => (h?.target ? Math.max(0, Math.min(1, (Number(v) || 0) / h.target)) : v ? 1 : 0);
export const habitDoneOn = (model, h, d) => habitDone(h, model.get(d)?.habits?.[h.id]);
export function dayHabits(day, habits) {
  if (!day?.habits || !habits.length) return { done: 0, total: habits.length, pct: null };
  const done = habits.filter((h) => habitDone(h, day.habits[h.id])).length;
  return { done, total: habits.length, pct: (done / habits.length) * 100 };
}

// Лучший результат сета по метрике упражнения
export function setValue(set, metric) {
  if (metric === 'reps') return set.reps ?? null;
  if (metric === 'distance') return set.distanceKm ?? null;
  if (metric === 'time') return set.timeMin ?? null;
  return set.weight ?? null;
}

// Готовит модель: список дат арки, "сегодня", индексы
export function buildModel(data) {
  const { meta } = data;
  const today = meta.asOf || almatyToday();
  const dayNum = diffDays(meta.startDate, today) + 1;
  const arcDates = Array.from({ length: meta.durationDays }, (_, i) => addDays(meta.startDate, i));
  const elapsed = arcDates.filter((d) => d <= today);
  const allDates = Object.keys(data.days || {}).sort();
  const get = (d) => data.days?.[d];
  return { today, dayNum, arcDates, elapsed, allDates, get };
}

// Стрик привычки: подряд выполненные дни, заканчивая сегодня (или вчера, если сегодня ещё не отмечено)
const habitById = (data, id) => data.habits.find((h) => h.id === id);
export function habitStreak(data, model, id) {
  const h = habitById(data, id);
  let d = model.today;
  if (!habitDoneOn(model, h, d)) d = addDays(d, -1);
  let n = 0;
  while (d >= data.meta.startDate && habitDoneOn(model, h, d)) { n++; d = addDays(d, -1); }
  return n;
}
export function habitBestStreak(data, model, id) {
  const h = habitById(data, id);
  let best = 0, cur = 0;
  for (const d of model.elapsed) { if (habitDoneOn(model, h, d)) { cur++; best = Math.max(best, cur); } else cur = 0; }
  return best;
}

// Все подходы упражнения по датам: [{date, best}]
export function exerciseSeries(data, ex) {
  const out = [];
  for (const date of Object.keys(data.days || {}).sort()) {
    const w = data.days[date].workout;
    const e = w?.exercises?.find((x) => x.id === ex.id);
    if (!e) continue;
    const vals = e.sets.map((s) => setValue(s, ex.metric)).filter((v) => v != null);
    if (vals.length) out.push({ date, label: fmtShort(date), best: Math.max(...vals) });
  }
  return out;
}

// Автоматически вычисляемые цели
export function goalCurrent(goal, data, model) {
  if (goal.auto === 'workHours') return model.elapsed.reduce((s, d) => s + (model.get(d)?.work?.hours || 0), 0);
  if (goal.auto === 'workouts') return model.elapsed.filter((d) => model.get(d)?.workout).length;
  if (goal.auto === 'weight') { const w = latestWeight(data, model); return w ? w.value : goal.current; }
  return goal.current;
}
export function goalProgress(goal, current) {
  if (goal.target == null || current == null) return 0;
  const start = goal.start ?? 0;
  const span = goal.target - start;
  if (!span) return 100;
  return Math.max(0, Math.min(100, ((current - start) / span) * 100));
}
export function latestWeight(data, model) {
  for (let i = model.allDates.length - 1; i >= 0; i--) {
    const d = model.allDates[i];
    if (d <= model.today && data.days[d].weight != null) return { date: d, value: data.days[d].weight };
  }
  return null;
}

// Неделя арки (1..), с понедельника старта: блоки по 7 дней от startDate
export const arcWeek = (data, date) => Math.floor(diffDays(data.meta.startDate, date) / 7) + 1;

// Цель по весу: старт → цель (targets.startWeight / goalWeight / goalWeightDate). null, если цель не задана.
export function weightGoal(data, model) {
  const { startWeight, goalWeight, goalWeightDate, goalLabel } = data.targets || {};
  if (goalWeight == null || startWeight == null) return null;
  const w = latestWeight(data, model);
  const current = w ? w.value : startWeight;
  const span = startWeight - goalWeight;
  const done = startWeight - current; // сколько уже сброшено (для цели на набор — отрицательный span, формула та же)
  const progress = span ? Math.max(0, Math.min(100, (done / span) * 100)) : 100;
  const daysLeft = goalWeightDate ? Math.max(0, diffDays(model.today, goalWeightDate)) : null;
  const left = current - goalWeight;
  const perWeek = daysLeft ? (left / daysLeft) * 7 : null;
  return { label: goalLabel || null, start: startWeight, goal: goalWeight, current, done, left, progress, date: goalWeightDate, daysLeft, perWeek };
}
