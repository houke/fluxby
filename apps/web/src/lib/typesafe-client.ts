/**
 * TypeSafe AI client for Fluxby web and Tauri use.
 *
 * Tauri calls the TypeSafe HTTP API through native Rust networking. Browser builds call the Fluxby
 * Worker proxy because the TypeSafe API does not allow Fluxby's web origin in
 * its CORS policy.
 * API reference: https://docs.typesafe.ai/api
 */
import { readFromOPFSSync } from '@fluxby/database';
import { invoke } from './tauri-bridge';

const TYPESAFE_API_BASE = 'https://api.typesafe.ai';
const TYPESAFE_DEV_PROXY = '/typesafe-api';
const TYPESAFE_WEB_PROXY =
  import.meta.env.VITE_TYPESAFE_WEB_PROXY_URL ||
  'https://api.fluxby.app/typesafe/systemone';
const TYPESAFE_MODEL = 'jev-latest';
const SETTINGS_KEY = 'typesafe-api-key';
const TRACE_SETTING_KEY = 'typesafe-ai-trace-enabled';
const MAX_CONCURRENT = 5;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_TRACE_EVENTS = 20;

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

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export function getTypeSafeRequestEndpoint(): string {
  if (isTauriRuntime()) {
    return `${TYPESAFE_API_BASE}/v1/systemone`;
  }

  return import.meta.env.DEV
    ? `${TYPESAFE_DEV_PROXY}/v1/systemone`
    : TYPESAFE_WEB_PROXY;
}

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

export const AUTO_CATEGORY_CONFIDENCE_THRESHOLD = 0.6;

export interface TypeSafeResponse {
  model: string;
  answers: Record<string, Answer>;
  usage: { input_tokens: number; output_tokens: number };
}

export interface TypeSafeTraceEvent {
  id: string;
  startedAt: string;
  durationMs?: number;
  status: 'pending' | 'success' | 'error';
  request: {
    endpoint: string;
    model: string;
    state: unknown;
    questions: Record<string, Question>;
  };
  response?: TypeSafeResponse;
  error?: string;
}

const traceEvents: TypeSafeTraceEvent[] = [];
const traceListeners = new Set<() => void>();

function notifyTraceListeners() {
  traceListeners.forEach((listener) => listener());
}

function traceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function isTraceEnabled() {
  return readFromOPFSSync<boolean>(TRACE_SETTING_KEY) === true;
}

function startTrace(
  state: unknown,
  questions: Record<string, Question>
): ((update: Partial<TypeSafeTraceEvent>) => void) | null {
  if (!isTraceEnabled()) return null;

  const id = traceId();
  traceEvents.unshift({
    id,
    startedAt: new Date().toISOString(),
    status: 'pending',
    request: {
      endpoint: getTypeSafeRequestEndpoint(),
      model: TYPESAFE_MODEL,
      state,
      questions,
    },
  });
  traceEvents.splice(MAX_TRACE_EVENTS);
  notifyTraceListeners();

  return (update) => {
    const index = traceEvents.findIndex((event) => event.id === id);
    if (index < 0) return;
    traceEvents[index] = { ...traceEvents[index], ...update };
    notifyTraceListeners();
  };
}

/** Session-only diagnostic events. Event data is never written to OPFS. */
export function getTypeSafeTraceEvents(): readonly TypeSafeTraceEvent[] {
  return traceEvents;
}

export function subscribeToTypeSafeTrace(listener: () => void): () => void {
  traceListeners.add(listener);
  return () => traceListeners.delete(listener);
}

export function clearTypeSafeTraceEvents() {
  traceEvents.length = 0;
  notifyTraceListeners();
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
  const startedAt = performance.now();
  const updateTrace = startTrace(state, questions);
  try {
    const payload = { state, model: TYPESAFE_MODEL, questions };
    const response = isTauriRuntime()
      ? await invoke<{ status: number; body: string }>('typesafe_request', {
          apiKey: key,
          payload,
        }).then(({ status, body }) => new Response(body, { status }))
      : await fetch(getTypeSafeRequestEndpoint(), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

    if (!response.ok) {
      const body = await response.text().catch(() => response.statusText);
      throw new Error(`TypeSafe ${response.status}: ${body}`);
    }

    const result = (await response.json()) as TypeSafeResponse;
    updateTrace?.({
      status: 'success',
      durationMs: Math.round(performance.now() - startedAt),
      response: result,
    });
    return result;
  } catch (error) {
    updateTrace?.({
      status: 'error',
      durationMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
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
 * unavailable, the key is missing, or no category is above 60% confidence.
 */
export async function suggestCategory(params: {
  merchantName: string | null;
  description: string | null;
  amount: number;
  categories: { id: string; name: string }[];
  apiKey?: string;
}): Promise<{ categoryId: string; confidence: number } | null> {
  const [suggestion] = await suggestCategories({
    transactions: [params],
    categories: params.categories,
    apiKey: params.apiKey,
  });
  return suggestion ?? null;
}

/**
 * Classify several transactions in one TypeSafe request. Batching independent
 * Choice questions is both faster and cheaper than one request per transaction.
 * Only decisions strictly above the automatic-action threshold are returned.
 */
export async function suggestCategories(params: {
  transactions: Array<{
    merchantName: string | null;
    description: string | null;
    opposingAccountName?: string | null;
    amount: number;
  }>;
  categories: { id: string; name: string }[];
  apiKey?: string;
}): Promise<Array<{ categoryId: string; confidence: number } | null>> {
  const { transactions, categories, apiKey } = params;
  if (transactions.length === 0 || categories.length === 0) {
    return transactions.map(() => null);
  }

  const key = apiKey ?? getTypeSafeApiKey();
  if (!key) return transactions.map(() => null);

  if (categories.length > 254) {
    throw new Error(
      'TypeSafe categorisation supports at most 254 categories plus none'
    );
  }

  // UUIDs repeat in every question and cost many tokens. Map short choices
  // back to database IDs only after validating the response.
  const categoryIds = new Map(
    categories.map((category, index) => [`c${index}`, category.id])
  );
  const criteria: Record<string, string | null> = Object.fromEntries(
    categories.map((category, index) => [`c${index}`, category.name])
  );
  criteria.none = 'The transaction does not clearly fit any listed category';

  const buildRequest = (batch: typeof transactions) => {
    const questions: Record<string, Question> = {};
    batch.forEach((_, index) => {
      questions[`transaction_${index}`] = {
        type: 'choice',
        instructions: `Which category best fits \`transactions[${index}]\`? Use merchant, description, counterparty, amount, and amount sign together. Choose none when the evidence is insufficient or several categories are similarly plausible.`,
        criteria,
      };
    });
    return {
      state: {
        transactions: batch.map((transaction) => ({
          merchant: transaction.merchantName ?? '',
          description: transaction.description ?? '',
          counterparty: transaction.opposingAccountName ?? '',
          amount: transaction.amount,
        })),
      },
      questions,
    };
  };

  type Suggestion = { categoryId: string; confidence: number } | null;
  const classify = async (
    batch: typeof transactions
  ): Promise<Suggestion[]> => {
    const { state, questions } = buildRequest(batch);
    try {
      const response = await askTypeSafe(state, questions, key);

      return batch.map((_, index) => {
        const answer = response.answers[`transaction_${index}`];
        const categoryId =
          answer?.type === 'choice'
            ? categoryIds.get(answer.choice)
            : undefined;
        if (
          !answer ||
          answer.type !== 'choice' ||
          answer.choice === 'none' ||
          !categoryId ||
          !Number.isFinite(answer.confidence) ||
          answer.confidence <= AUTO_CATEGORY_CONFIDENCE_THRESHOLD
        ) {
          return null;
        }
        return {
          categoryId,
          confidence: answer.confidence,
        };
      });
    } catch (error) {
      // Only shrink token-limit failures. Auth/network/service failures must
      // reach the UI instead of masquerading as "no matching categories".
      if (
        batch.length > 1 &&
        error instanceof Error &&
        error.message.startsWith('TypeSafe 400:') &&
        error.message.includes('max_tokens_exceeded')
      ) {
        const middle = Math.ceil(batch.length / 2);
        return [
          ...(await classify(batch.slice(0, middle))),
          ...(await classify(batch.slice(middle))),
        ];
      }
      throw error;
    }
  };

  const results: Suggestion[] = [];
  let batch: typeof transactions = [];
  // Conservative byte budget includes repeated criteria and multibyte text.
  // It is an estimate, so provider token errors still trigger smaller batches.
  const requestBytes = (items: typeof transactions) =>
    new TextEncoder().encode(
      JSON.stringify({ ...buildRequest(items), model: TYPESAFE_MODEL })
    ).length;
  for (const transaction of transactions) {
    const proposed = [...batch, transaction];
    if (
      batch.length > 0 &&
      (proposed.length > 5 || requestBytes(proposed) > 12_000)
    ) {
      results.push(...(await classify(batch)));
      batch = [];
    }
    batch.push(transaction);
  }
  if (batch.length > 0) results.push(...(await classify(batch)));
  return results;
}

export type ImportMappingField = 'date' | 'amount' | 'description';

export interface ImportMappingSuggestion {
  header: string;
  confidence: number;
}

/** Suggest missing CSV columns from a closed set of the file's own headers. */
export async function suggestImportColumnMappings(params: {
  headers: string[];
  sampleRows: Array<Record<string, string>>;
  fields: ImportMappingField[];
  apiKey?: string;
}): Promise<Partial<Record<ImportMappingField, ImportMappingSuggestion>>> {
  const { headers, sampleRows, fields, apiKey } = params;
  const key = apiKey ?? getTypeSafeApiKey();
  if (
    !key ||
    headers.length === 0 ||
    headers.length > 254 ||
    fields.length === 0
  )
    return {};

  const headerByChoice = new Map(
    headers.map((header, index) => [`h${index}`, header])
  );
  const criteria: Record<string, string | null> = Object.fromEntries(
    headers.map((header, index) => [`h${index}`, header])
  );
  criteria.unmapped = 'No available column contains this information';

  const fieldNames: Record<ImportMappingField, string> = {
    date: 'transaction date',
    amount: 'transaction amount',
    description: 'merchant or transaction description',
  };
  const questions: Record<string, Question> = {};
  for (const field of fields) {
    questions[field] = {
      type: 'choice',
      instructions: `Which source column contains the ${fieldNames[field]}? Choose unmapped when none fits.`,
      criteria,
    };
  }

  const samplePatterns: Record<ImportMappingField, RegExp> = {
    date: /date|datum|boek/i,
    amount: /amount|bedrag|waarde|saldo|balance|total/i,
    description: /name|naam|description|omschrijving|merchant|payee/i,
  };
  const sampleHeaders = headers.filter((header) =>
    fields.some((field) => samplePatterns[field].test(header))
  );
  const boundedSamples = sampleRows
    .slice(0, 2)
    .map((row) =>
      Object.fromEntries(
        sampleHeaders.map((header) => [
          header,
          String(row[header] ?? '').slice(0, 80),
        ])
      )
    );
  const response = await askTypeSafe(
    { headers, sampleRows: boundedSamples },
    questions,
    key
  );

  const suggestions: Partial<
    Record<ImportMappingField, ImportMappingSuggestion>
  > = {};
  for (const field of fields) {
    const answer = response.answers[field];
    const header =
      answer?.type === 'choice' ? headerByChoice.get(answer.choice) : undefined;
    const confidence =
      answer?.type === 'choice' ? answer.confidence : Number.NaN;
    if (!header || !Number.isFinite(confidence) || confidence < 0.6) {
      continue;
    }
    suggestions[field] = { header, confidence };
  }
  return suggestions;
}

export interface UnlinkedCounterparty {
  iban: string;
  name: string;
  transactionCount: number;
}

export interface AddressBookMatchSuggestion {
  iban: string;
  name: string;
  transactionCount: number;
  contactId: string;
  contactName: string;
  confidence: number;
}

function normalizedNameTokens(value: string): string[] {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function contactNameSimilarity(left: string, right: string): number {
  const leftValue = normalizedNameTokens(left).join(' ');
  const rightValue = normalizedNameTokens(right).join(' ');
  if (!leftValue || !rightValue) return 0;
  if (leftValue === rightValue) return 1;
  if (leftValue.includes(rightValue) || rightValue.includes(leftValue))
    return 0.8;
  const leftTokens = new Set(leftValue.split(' '));
  const rightTokens = new Set(rightValue.split(' '));
  const overlap = [...leftTokens].filter((token) =>
    rightTokens.has(token)
  ).length;
  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

/**
 * Suggest links for unlinked IBAN/name groups. IBANs remain local; Jev only sees
 * counterparty names, transaction counts, and the bounded existing contact list.
 */
export async function suggestAddressBookMatches(params: {
  unlinked: UnlinkedCounterparty[];
  contacts: Array<{
    id: string;
    name: string;
    originalName?: string | null;
    originalNames?: string[];
  }>;
  apiKey?: string;
}): Promise<AddressBookMatchSuggestion[]> {
  const key = params.apiKey ?? getTypeSafeApiKey();
  if (!key || params.unlinked.length === 0 || params.contacts.length === 0)
    return [];

  const matches: AddressBookMatchSuggestion[] = [];
  for (let start = 0; start < params.unlinked.length; start += 5) {
    const batch = params.unlinked.slice(start, start + 5);
    const optionSets = batch.map((counterparty) => {
      const ranked = params.contacts
        .map((contact) => {
          const aliases = [
            contact.originalName,
            ...(contact.originalNames ?? []),
          ].filter((alias): alias is string => !!alias);
          const similarity = Math.max(
            contactNameSimilarity(counterparty.name, contact.name),
            ...aliases.map((alias) =>
              contactNameSimilarity(counterparty.name, alias)
            ),
            0
          );
          return { contact, similarity };
        })
        .filter((entry) => entry.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 24);
      return ranked.map((entry) => entry.contact);
    });

    const questions: Record<string, Question> = {};
    const choiceMaps = optionSets.map((contacts, index) => {
      const contactByChoice = new Map(
        contacts.map((contact, contactIndex) => [`c${contactIndex}`, contact])
      );
      const criteria: Record<string, string | null> = Object.fromEntries(
        contacts.map((contact, contactIndex) => [
          `c${contactIndex}`,
          contact.name,
        ])
      );
      criteria.none = 'No existing contact matches this counterparty';
      questions[`counterparty_${index}`] = {
        type: 'choice',
        instructions: `Does \`unlinked[${index}]\` appear to be the same counterparty as one existing contact? Choose none when the name evidence is weak or ambiguous.`,
        criteria,
      };
      return contactByChoice;
    });

    if (optionSets.every((options) => options.length === 0)) continue;

    const response = await askTypeSafe(
      {
        unlinked: batch.map(({ name, transactionCount }) => ({
          name,
          transactionCount,
        })),
        candidateContacts: optionSets.map((options) =>
          options.map(({ id, name, originalName }) => ({
            id,
            name,
            originalName: originalName ?? '',
          }))
        ),
      },
      questions,
      key
    );

    batch.forEach((counterparty, index) => {
      const answer = response.answers[`counterparty_${index}`];
      const contact =
        answer?.type === 'choice'
          ? choiceMaps[index].get(answer.choice)
          : undefined;
      const confidence =
        answer?.type === 'choice' ? answer.confidence : Number.NaN;
      if (!contact || !Number.isFinite(confidence) || confidence < 0.6) {
        return;
      }
      matches.push({
        ...counterparty,
        contactId: contact.id,
        contactName: contact.name,
        confidence,
      });
    });
  }
  return matches;
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
