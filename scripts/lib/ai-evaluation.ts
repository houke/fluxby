export interface EvaluatedJudgment {
  id: string;
  language: string;
  expected: string | null;
  predicted: string | null;
  confidence: number;
  error?: string;
}
export function summarizeJudgments(
  rows: EvaluatedJudgment[],
  threshold: number
) {
  const successful = rows.filter((row) => !row.error);
  const accepted = successful.filter(
    (row) =>
      row.predicted !== null &&
      Number.isFinite(row.confidence) &&
      row.confidence > threshold &&
      row.confidence <= 1
  );
  const correct = accepted.filter((row) => row.predicted === row.expected);
  const expectedAbstentions = successful.filter((row) => row.expected === null);
  return {
    total: rows.length,
    errors: rows.length - successful.length,
    accepted: accepted.length,
    coverage: rows.length ? accepted.length / rows.length : null,
    precision: accepted.length ? correct.length / accepted.length : null,
    falseActionsOnAmbiguous: accepted.filter((row) => row.expected === null)
      .length,
    correctAbstentions: expectedAbstentions.filter(
      (row) => !accepted.includes(row)
    ).length,
    threshold,
  };
}
export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];
}
