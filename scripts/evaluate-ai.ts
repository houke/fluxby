import { readFile, writeFile } from 'node:fs/promises';
import {
  buildCategoryRequest,
  AUTO_CATEGORY_CONFIDENCE_THRESHOLD,
} from '../apps/web/src/lib/typesafe-category-request';
import {
  summarizeJudgments,
  percentile,
  type EvaluatedJudgment,
} from './lib/ai-evaluation';

type Case = {
  id: string;
  language: 'en' | 'nl';
  merchantName: string | null;
  description: string | null;
  amount: number;
  expected: string | null;
};
const cases: Case[] = JSON.parse(
  await readFile(
    new URL('../tests/fixtures/ai-categorization.json', import.meta.url),
    'utf8'
  )
);
const categories = [
  ['groceries', 'Groceries', 'Boodschappen'],
  ['dining', 'Dining out', 'Uit eten'],
  ['transport', 'Transport', 'Vervoer'],
  ['utilities', 'Utilities', 'Nutsvoorzieningen'],
  ['housing', 'Rent and mortgage', 'Huur en hypotheek'],
  ['salary', 'Salary', 'Salaris'],
  ['entertainment', 'Entertainment', 'Vermaak'],
  ['health', 'Healthcare', 'Gezondheid'],
  ['shopping', 'Shopping', 'Winkelen'],
];
const live = process.argv.includes('--live');
const key = process.env.TYPESAFE_API_KEY;
if (live && !key)
  throw new Error('Set TYPESAFE_API_KEY to run live synthetic evaluation.');
const rows: EvaluatedJudgment[] = [];
const latencies: number[] = [];
const models = new Set<string>();
let inputTokens = 0;
let outputTokens = 0;
if (live)
  for (const language of ['en', 'nl'] as const) {
    const subset = cases.filter((item) => item.language === language);
    const options = categories.map(([id, en, nl]) => ({
      id,
      name: language === 'en' ? en : nl,
    }));
    for (let offset = 0; offset < subset.length; offset += 5) {
      const batch = subset.slice(offset, offset + 5);
      const started = performance.now();
      try {
        const response = await fetch('https://api.typesafe.ai/v1/systemone', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'jev-latest',
            ...buildCategoryRequest(batch, options),
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = (await response.json()) as {
          model: string;
          usage?: { input_tokens: number; output_tokens: number };
          answers: Record<
            string,
            { type: string; choice: string; confidence: number }
          >;
        };
        models.add(result.model);
        inputTokens += result.usage?.input_tokens || 0;
        outputTokens += result.usage?.output_tokens || 0;
        batch.forEach((item, index) => {
          const answer = result.answers?.[`transaction_${index}`];
          const match = answer?.choice?.match(/^c(\d+)$/);
          const predicted = match ? options[Number(match[1])]?.id : null;
          const valid =
            answer?.type === 'choice' &&
            Number.isFinite(answer.confidence) &&
            answer.confidence >= 0 &&
            answer.confidence <= 1 &&
            (answer.choice === 'none' || !!predicted);
          rows.push({
            id: item.id,
            language,
            expected: item.expected,
            predicted: predicted || null,
            confidence: valid ? answer.confidence : 0,
            ...(!valid ? { error: 'invalid_response' } : {}),
          });
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'request_failed';
        batch.forEach((item) =>
          rows.push({
            id: item.id,
            language,
            expected: item.expected,
            predicted: null,
            confidence: 0,
            error: message,
          })
        );
      } finally {
        latencies.push(Math.round(performance.now() - started));
      }
    }
  }
const report = {
  status: live ? 'live_synthetic' : 'live_not_run',
  dataset: 'synthetic-v1',
  cases: cases.length,
  model: [...models],
  timestamp: new Date().toISOString(),
  note: 'Hand-labeled synthetic cases; not a representative production accuracy estimate. Confidence is not accuracy. Empty precision is null, never 100%.',
  metrics: live
    ? summarizeJudgments(rows, AUTO_CATEGORY_CONFIDENCE_THRESHOLD)
    : null,
  byLanguage: live
    ? Object.fromEntries(
        ['en', 'nl'].map((language) => [
          language,
          summarizeJudgments(
            rows.filter((row) => row.language === language),
            AUTO_CATEGORY_CONFIDENCE_THRESHOLD
          ),
        ])
      )
    : null,
  thresholdSweep: live
    ? [0.5, 0.6, 0.7, 0.8, 0.9].map((threshold) =>
        summarizeJudgments(rows, threshold)
      )
    : null,
  requestLatencyMs: {
    p50: percentile(latencies, 0.5),
    p95: percentile(latencies, 0.95),
  },
  usage: live ? { inputTokens, outputTokens } : null,
  judgments: rows,
};
const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0)
  await writeFile(
    process.argv[outputIndex + 1],
    JSON.stringify(report, null, 2) + '\n'
  );
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (live && rows.some((row) => row.error)) process.exitCode = 1;
