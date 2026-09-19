/**
 * TypeSafe AI client for browser use.
 *
 * Wraps the TypeSafe HTTP API directly since the official SDK targets Node.js.
 * API reference: https://docs.typesafe.ai/api
 */
import { readFromOPFSSync } from '@fluxby/database';

const TYPESAFE_API_BASE = 'https://api.typesafe.ai';
const TYPESAFE_MODEL = 'jev-latest';
const SETTINGS_KEY = 'typesafe-api-key';
const MAX_CONCURRENT = 5;
const REQUEST_TIMEOUT_MS = 15_000;

// Simple semaphore to cap concurrent TypeSafe API requests
function createSemaphore(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const acquire = (): Promise<void> =>
    new Promise((resolve) => {
      if (active < max) {
        active++;
        resolve();
      } else {
        queue.push(() => {
          active++;
          resolve();
        });
      }
    });
  const release = () => {
    active--;
    const next = queue.shift();
    if (next) next();
  };
  return { acquire, release };
}

const semaphore = createSemaphore(MAX_CONCURRENT);

// ── Question types ────────────────────────────────────────────────────────────

export interface NoulQuestion {
  type: 'noul';
  instructions: string;
  criteria?: { true?: string; false?: string };
}

export interface ChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string | null>;
}

export type Question = NoulQuestion | ChoiceQuestion;

// ── Answer types ──────────────────────────────────────────────────────────────

export interface NoulAnswer {
  type: 'noul';
  noul: number;
}

export interface ChoiceAnswer {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export type Answer = NoulAnswer | ChoiceAnswer;

export interface TypeSafeResponse {
  model: string;
  answers: Record<string, Answer>;
  usage: { input_tokens: number; output_tokens: number };
}

// ── Core client ───────────────────────────────────────────────────────────────

/** Read the stored TypeSafe API key from OPFS settings (sync). Returns '' if not set. */
export function getTypeSafeApiKey(): string {
  return readFromOPFSSync<string>(SETTINGS_KEY) ?? '';
}

/**
 * Ask TypeSafe AI one or more questions about the given state.
 * Throws with a descriptive message if the API key is missing or the request fails.
 */
export async function askTypeSafe(
  state: unknown,
  questions: Record<string, Question>,
  apiKey?: string
): Promise<TypeSafeResponse> {
  const key = apiKey ?? getTypeSafeApiKey();
  if (!key) throw new Error('TypeSafe API key not configured');

  await semaphore.acquire();
  try {
    const response = await fetch(`${TYPESAFE_API_BASE}/v1/systemone`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state, model: TYPESAFE_MODEL, questions }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => response.statusText);
      throw new Error(`TypeSafe ${response.status}: ${body}`);
    }

    return response.json() as Promise<TypeSafeResponse>;
  } finally {
    semaphore.release();
  }
}

// ── Answer helpers ────────────────────────────────────────────────────────────

export function noulAnswer(response: TypeSafeResponse, id: string): number {
  const a = response.answers[id];
  if (!a || a.type !== 'noul') throw new Error(`No noul answer for "${id}"`);
  return (a as NoulAnswer).noul;
}

export function choiceAnswer(
  response: TypeSafeResponse,
  id: string
): ChoiceAnswer {
  const a = response.answers[id];
  if (!a || a.type !== 'choice')
    throw new Error(`No choice answer for "${id}"`);
  return a as ChoiceAnswer;
}

// ── Domain helpers ────────────────────────────────────────────────────────────

/**
 * Suggest a spending category for a single transaction.
 * Returns the best-matching category with confidence, or null when AI is
 * unavailable, the key is missing, or no category clears 0.6 confidence.
 */
export async function suggestCategory(params: {
  merchantName: string | null;
  description: string | null;
  amount: number;
  categories: { id: string; name: string }[];
  apiKey?: string;
}): Promise<{ categoryId: string; confidence: number } | null> {
  const { merchantName, description, amount, categories, apiKey } = params;
  if (categories.length === 0) return null;

  const key = apiKey ?? getTypeSafeApiKey();
  if (!key) return null;

  const criteria: Record<string, string | null> = {};
  for (const cat of categories) {
    criteria[cat.id] = cat.name;
  }
  criteria['none'] = 'Does not fit any of these categories';

  try {
    const response = await askTypeSafe(
      {
        merchant: merchantName ?? '',
        description: description ?? '',
        amount,
      },
      {
        category: {
          type: 'choice',
          instructions:
            'Which spending category best fits the bank transaction described in `merchant`, `description`, and `amount`?',
          criteria,
        },
      },
      key
    );

    const answer = choiceAnswer(response, 'category');
    const knownIds = new Set(categories.map((c) => c.id));
    if (
      answer.choice === 'none' ||
      !knownIds.has(answer.choice) ||
      answer.confidence < 0.7
    )
      return null;
    return { categoryId: answer.choice, confidence: answer.confidence };
  } catch {
    return null;
  }
}

/**
 * Detect the debit/credit meaning of each unique value in a direction column.
 * Returns a map of value -> 'debit' | 'credit' | 'unknown'.
 * Falls back to an all-'unknown' map on API errors.
 */
export async function detectDirectionConvention(
  uniqueValues: string[],
  apiKey?: string
): Promise<Map<string, 'debit' | 'credit' | 'unknown'>> {
  const key = apiKey ?? getTypeSafeApiKey();
  const result = new Map<string, 'debit' | 'credit' | 'unknown'>();
  if (!key || uniqueValues.length === 0) return result;

  try {
    const questions: Record<string, Question> = {};
    uniqueValues.forEach((value, i) => {
      questions[`v${i}`] = {
        type: 'choice',
        instructions: `In this bank CSV, the direction column contains the value at \`directionValues[${i}]\`. Does this value indicate money leaving the account or money arriving?`,
        criteria: {
          debit:
            'Debit — money leaving the account (payment, expense, withdrawal)',
          credit: 'Credit — money arriving (income, deposit, refund)',
          unknown: 'Cannot determine from this value alone',
        },
      };
    });

    const response = await askTypeSafe(
      { directionValues: uniqueValues },
      questions,
      key
    );

    uniqueValues.forEach((value, i) => {
      const answer = response.answers[`v${i}`];
      result.set(
        value,
        answer?.type === 'choice'
          ? (answer.choice as 'debit' | 'credit' | 'unknown')
          : 'unknown'
      );
    });
  } catch {
    for (const value of uniqueValues) result.set(value, 'unknown');
  }

  return result;
}

/**
 * Detect the date format convention from a set of sample date strings.
 * Returns 'dmy', 'mdy', or null when not confident enough to override the parser.
 */
export async function detectDateFormat(
  sampleDates: string[],
  apiKey?: string
): Promise<'dmy' | 'mdy' | null> {
  const key = apiKey ?? getTypeSafeApiKey();
  if (!key || sampleDates.length === 0) return null;

  try {
    const response = await askTypeSafe(
      { sampleDates },
      {
        format: {
          type: 'choice',
          instructions:
            'These are date strings from a bank CSV export. Which date format convention does this bank use?',
          criteria: {
            dmy: 'DD/MM/YYYY — European format (day first, then month)',
            mdy: 'MM/DD/YYYY — American format (month first, then day)',
          },
        },
      },
      key
    );

    const answer = choiceAnswer(response, 'format');
    if (answer.confidence < 0.8) return null;
    return answer.choice as 'dmy' | 'mdy';
  } catch {
    return null;
  }
}

/**
 * Detect whether an IBAN/merchant combination belongs to a payment intermediary.
 * Returns P(is_intermediary) in [0,1], or null if AI is unavailable.
 */
export async function detectIsPaymentProvider(params: {
  iban: string | null;
  merchantNames: string[];
  description?: string | null;
  apiKey?: string;
}): Promise<number | null> {
  const { iban, merchantNames, description, apiKey } = params;
  const key = apiKey ?? getTypeSafeApiKey();
  if (!key) return null;

  try {
    const response = await askTypeSafe(
      { iban: iban ?? '', merchantNames, description: description ?? '' },
      {
        is_provider: {
          type: 'noul',
          instructions:
            'Is `iban` used by a payment intermediary (such as PayPal, Tikkie, Mollie, iDEAL, Stripe, Adyen, Buckaroo, SumUp) rather than a direct merchant the user bought goods or services from?',
          criteria: {
            true: 'IBAN belongs to a payment processor or intermediary platform',
            false: 'IBAN belongs to a direct merchant, person, or organisation',
          },
        },
      },
      key
    );

    return noulAnswer(response, 'is_provider');
  } catch {
    return null;
  }
}
