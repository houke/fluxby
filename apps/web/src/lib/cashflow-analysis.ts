import type {
  ReviewTransaction,
  TransactionLink,
} from './data/transaction-review';
export interface CashflowStep {
  categoryId: string;
  label: string | null;
  amount: number;
  start: number;
  end: number;
}
const monthShift = (month: string, offset: number) => {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d.toISOString().slice(0, 7);
};
const monthDays = (month: string) =>
  new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)
  ).getUTCDate();
export function analyzeCashflow(
  rows: ReviewTransaction[],
  links: TransactionLink[],
  month: string,
  horizon: 3 | 6 | 12,
  today: string
) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Invalid month');
  const live = new Map(rows.map((tx) => [tx.id, tx]));
  const reductions = new Map<string, number>();
  for (const link of links) {
    if (
      link.kind !== 'refund' ||
      live.get(link.sourceId)?.type !== 'income' ||
      live.get(link.targetId)?.type !== 'expense'
    )
      continue;
    for (const id of [link.sourceId, link.targetId])
      reductions.set(
        id,
        (reductions.get(id) || 0) + Math.round(link.amount * 100)
      );
  }
  const effective = (tx: ReviewTransaction) =>
    Math.max(
      0,
      Math.round(Math.abs(tx.amount) * 100) - (reductions.get(tx.id) || 0)
    ) / 100;
  const elapsed =
    month === today.slice(0, 7) ? Number(today.slice(8)) : monthDays(month);
  const selected = rows.filter(
    (tx) => tx.date.slice(0, 7) === month && Number(tx.date.slice(8)) <= elapsed
  );
  const income = selected
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + effective(tx), 0);
  const groups = new Map<string, { label: string | null; amount: number }>();
  for (const tx of selected.filter((tx) => tx.type === 'expense')) {
    const key = tx.categoryId || '',
      existing = groups.get(key) || { label: tx.categoryName, amount: 0 };
    existing.amount += effective(tx);
    groups.set(key, existing);
  }
  let running = income;
  const steps: CashflowStep[] = [];
  for (const [categoryId, g] of [...groups].sort(
    (a, b) => b[1].amount - a[1].amount
  )) {
    steps.push({
      categoryId,
      label: g.label,
      amount: g.amount,
      start: running,
      end: running - g.amount,
    });
    running -= g.amount;
  }
  const earliest = rows.reduce(
    (min, tx) => (tx.date < min ? tx.date : min),
    '9999-12-31'
  );
  const latest = rows.reduce(
    (max, tx) => (tx.date > max ? tx.date : max),
    '0000-01-01'
  );
  const baselines: number[] = [];
  for (let i = 1; i <= horizon; i++) {
    const target = monthShift(month, -i),
      end = `${target}-${String(Math.min(elapsed, monthDays(target))).padStart(2, '0')}`;
    // Skip the first (potentially partial) imported month and any period beyond known data.
    if (target <= earliest.slice(0, 7) || target > latest.slice(0, 7)) continue;
    baselines.push(
      rows
        .filter(
          (tx) =>
            tx.type === 'expense' && tx.date >= `${target}-01` && tx.date <= end
        )
        .reduce((sum, tx) => sum + effective(tx), 0)
    );
  }
  const expenses = income - running,
    baseline = baselines.length
      ? baselines.reduce((a, b) => a + b, 0) / baselines.length
      : null;
  return {
    income,
    expenses,
    net: running,
    steps,
    elapsed,
    baseline,
    baselineMonths: baselines.length,
    delta:
      baseline === null || baseline === 0
        ? null
        : ((expenses - baseline) / baseline) * 100,
  };
}
