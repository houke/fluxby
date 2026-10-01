import type { DataService } from './data-service';
import type { WebMcpCopy, WebMcpToolKey } from './webmcp-copy';

export interface WebMcpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    options: { signal: AbortSignal }
  ) => Promise<unknown>;
}

export interface WebMcpModelContext {
  registerTool: (
    tool: WebMcpTool,
    options: { signal: AbortSignal }
  ) => Promise<void>;
}

export function getWebMcpModelContext(): WebMcpModelContext | null {
  if (typeof document === 'undefined' || !window.isSecureContext) return null;
  const context = (document as Document & { modelContext?: WebMcpModelContext })
    .modelContext;
  return context && typeof context.registerTool === 'function' ? context : null;
}

type Input = Record<string, unknown>;
type Run = (input: Input, signal: AbortSignal) => Promise<unknown>;

interface ToolDependencies {
  service: DataService;
  copy: WebMcpCopy;
  profile: { id: string; name: string };
  language: 'nl' | 'en';
  navigate: (path: string) => void;
  confirm: (title: string, message: string) => Promise<boolean>;
  changed: () => Promise<void>;
  isAvailable: () => boolean;
  hasTransaction: (id: string) => Promise<boolean>;
}

const VIEW_PATHS = [
  'dashboard',
  'transactions',
  'analytics',
  'budgets',
  'subscriptions',
  'addressbook',
  'categories',
  'import',
  'settings',
  'help',
] as const;

const stringSchema = { type: 'string' };
const dateSchema = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };
const numberSchema = { type: 'number' };
const integerSchema = { type: 'integer', minimum: 0 };

function schema(properties: Input = {}, required: string[] = []) {
  return { type: 'object', properties, required, additionalProperties: false };
}

function validateSchemaInput(
  input: Input,
  inputSchema: Record<string, unknown>,
  copy: WebMcpCopy
) {
  const properties = inputSchema.properties as Record<string, Input>;
  const required = inputSchema.required as string[];
  for (const key of required) {
    if (input[key] === undefined) throw new Error(copy.invalidInput);
  }
  for (const [key, value] of Object.entries(input)) {
    const property = properties[key];
    if (!property || value === undefined) throw new Error(copy.invalidInput);
    if (
      (property.type === 'string' && typeof value !== 'string') ||
      (property.type === 'number' &&
        (typeof value !== 'number' || !Number.isFinite(value))) ||
      (property.type === 'integer' && !Number.isInteger(value))
    )
      throw new Error(copy.invalidInput);
    if (property.enum && !(property.enum as unknown[]).includes(value))
      throw new Error(copy.invalidInput);
    if (
      typeof value === 'number' &&
      ((typeof property.minimum === 'number' && value < property.minimum) ||
        (typeof property.maximum === 'number' && value > property.maximum))
    )
      throw new Error(copy.invalidInput);
    if (
      typeof value === 'string' &&
      typeof property.pattern === 'string' &&
      !new RegExp(property.pattern).test(value)
    )
      throw new Error(copy.invalidInput);
  }
}

function record(value: unknown, copy: WebMcpCopy): Input {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(copy.invalidInput);
  return value as Input;
}

function optionalString(
  value: unknown,
  copy: WebMcpCopy,
  max = 200
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > max)
    throw new Error(copy.invalidInput);
  return value.trim();
}

function requiredString(value: unknown, copy: WebMcpCopy, max = 200) {
  const result = optionalString(value, copy, max);
  if (!result) throw new Error(copy.invalidInput);
  return result;
}

function optionalDate(value: unknown, copy: WebMcpCopy) {
  const date = optionalString(value, copy, 10);
  if (date === undefined) return undefined;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  )
    throw new Error(copy.invalidInput);
  return date;
}

function period(input: Input, copy: WebMcpCopy) {
  const startDate = optionalDate(input.startDate, copy);
  const endDate = optionalDate(input.endDate, copy);
  if (startDate && endDate && startDate > endDate)
    throw new Error(copy.invalidInput);
  return { startDate, endDate };
}

function finite(value: unknown, copy: WebMcpCopy, positive = false) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (positive && value <= 0)
  )
    throw new Error(copy.invalidInput);
  return value;
}

function boundedInt(
  value: unknown,
  copy: WebMcpCopy,
  max: number,
  fallback: number
) {
  if (value === undefined) return fallback;
  if (
    !Number.isInteger(value) ||
    (value as number) < 0 ||
    (value as number) > max
  )
    throw new Error(copy.invalidInput);
  return value as number;
}

/** The registration surface is intentionally explicit: no raw SQL, backups, or secrets. */
export function buildWebMcpTools(deps: ToolDependencies): WebMcpTool[] {
  const { service, copy, profile } = deps;
  let mutationPending = false;
  const guard = (signal: AbortSignal) => {
    if (signal.aborted || !deps.isAvailable())
      throw new Error(copy.unavailable);
  };
  const tool = (
    key: WebMcpToolKey,
    inputSchema: Record<string, unknown>,
    run: Run,
    readOnly = true
  ): WebMcpTool => ({
    name: `fluxby_${key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}`,
    title: copy.tool[key].title,
    description: copy.tool[key].description,
    inputSchema,
    annotations: {
      readOnlyHint: readOnly,
      untrustedContentHint: readOnly,
      consequentialHint: !readOnly,
    },
    execute: async (input, { signal }) => {
      guard(signal);
      const validatedInput = record(input, copy);
      validateSchemaInput(validatedInput, inputSchema, copy);
      const value = await run(validatedInput, signal);
      if (readOnly) guard(signal);
      return value;
    },
  });
  const write = (key: WebMcpToolKey, inputSchema: Input, run: Run) =>
    tool(
      key,
      inputSchema,
      async (input, signal) => {
        if (mutationPending) throw new Error(copy.busy);
        mutationPending = true;
        try {
          const message = copy.confirmMessage
            .replace('{action}', copy.tool[key].title.toLowerCase())
            .replace('{profile}', profile.name)
            .replace(
              '{details}',
              Object.entries(input)
                .map(
                  ([field, value]) =>
                    `${copy.fieldLabels[field] ?? field}: ${String(value)}`
                )
                .join(' · ')
            );
          const accepted = await deps.confirm(copy.confirmTitle, message);
          guard(signal);
          if (!accepted) return { cancelled: true };
          const result = await run(input, signal);
          await deps.changed();
          return result;
        } finally {
          mutationPending = false;
        }
      },
      false
    );

  return [
    tool('context', schema(), async () => ({
      activeProfile: profile,
      language: deps.language,
      views: VIEW_PATHS,
    })),
    tool(
      'navigate',
      schema({ view: { type: 'string', enum: VIEW_PATHS } }, ['view']),
      async (input) => {
        const view = requiredString(input.view, copy);
        if (!VIEW_PATHS.includes(view as (typeof VIEW_PATHS)[number]))
          throw new Error(copy.invalidInput);
        deps.navigate(`/${view}`);
        return { view };
      }
    ),
    tool(
      'dashboard',
      schema({ startDate: dateSchema, endDate: dateSchema }),
      async (input) => {
        const { startDate, endDate } = period(input, copy);
        return service.getDashboardStats(startDate, endDate);
      }
    ),
    tool('accounts', schema(), async () => service.getAccounts()),
    tool(
      'transactions',
      schema({
        startDate: dateSchema,
        endDate: dateSchema,
        type: { type: 'string', enum: ['income', 'expense', 'transfer'] },
        accountId: stringSchema,
        categoryId: stringSchema,
        search: stringSchema,
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        offset: { ...integerSchema, maximum: 100000 },
      }),
      async (input) => {
        const { startDate, endDate } = period(input, copy);
        const limit = boundedInt(input.limit, copy, 100, 50);
        if (limit < 1) throw new Error(copy.invalidInput);
        const offset = boundedInt(input.offset, copy, 100000, 0);
        const type = optionalString(input.type, copy, 8);
        if (type && !['income', 'expense', 'transfer'].includes(type))
          throw new Error(copy.invalidInput);
        const filters: Record<string, string> = {
          limit: String(limit),
          offset: String(offset),
        };
        for (const [key, value] of Object.entries({
          startDate,
          endDate,
          type,
          accountId: optionalString(input.accountId, copy),
          categoryId: optionalString(input.categoryId, copy),
          search: optionalString(input.search, copy, 200),
        })) {
          if (value) filters[key] = value;
        }
        const rows = await service.getTransactions(filters);
        return {
          items: rows.map(
            ({ rawData: _rawData, importHash: _importHash, ...row }) => row
          ),
          limit,
          offset,
          hasMore: rows.length === limit,
        };
      }
    ),
    tool(
      'analytics',
      schema({ startDate: dateSchema, endDate: dateSchema }),
      async (input) => {
        const dates = period(input, copy);
        const endDate = dates.endDate ?? new Date().toISOString().slice(0, 10);
        const priorYear = new Date(`${endDate}T00:00:00Z`);
        priorYear.setUTCFullYear(priorYear.getUTCFullYear() - 1);
        const startDate =
          dates.startDate ?? priorYear.toISOString().slice(0, 10);
        if (
          startDate > endDate ||
          Date.parse(`${endDate}T00:00:00Z`) -
            Date.parse(`${startDate}T00:00:00Z`) >
            366 * 86400000
        )
          throw new Error(copy.invalidInput);
        const [monthly, categories, daily] = await Promise.all([
          service.getMonthlyStats(startDate, endDate),
          service.getCategoryStats(startDate, endDate),
          service.getDailyExpenses(startDate, endDate),
        ]);
        return { startDate, endDate, monthly, categories, daily };
      }
    ),
    tool('categories', schema(), async () =>
      (await service.getCategories(true)).map((category) => ({
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        icon: category.icon,
        color: category.color,
        description: category.description,
        transactionCount: category.transactionCount,
        totalExpenses: category.totalExpenses,
      }))
    ),
    tool(
      'budgets',
      schema({ month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } }),
      async (input) => {
        const month = optionalString(input.month, copy, 7);
        if (month) optionalDate(`${month}-01`, copy);
        return service.getBudgets(month);
      }
    ),
    tool('subscriptions', schema(), async () => {
      const [patterns, stats] = await Promise.all([
        service.getRecurringPatterns(),
        service.getRecurringStats(),
      ]);
      return { patterns: patterns.slice(0, 100), stats };
    }),
    tool(
      'contacts',
      schema({
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        offset: { ...integerSchema, maximum: 100000 },
      }),
      async (input) => {
        const limit = boundedInt(input.limit, copy, 100, 50);
        if (limit < 1) throw new Error(copy.invalidInput);
        const offset = boundedInt(input.offset, copy, 100000, 0);
        const entries = await service.getAddressBook();
        const items = entries.slice(offset, offset + limit).map((entry) => ({
          id: entry.id,
          name: entry.name,
          iban: entry.iban,
          description: entry.description,
          notes: entry.notes,
        }));
        return { items, limit, offset, total: entries.length };
      }
    ),
    tool('imports', schema(), async () => {
      const rows = await service.getImportHistory();
      return rows.map(({ skippedRows, ...row }) => ({
        ...row,
        skippedRowCount: skippedRows.length,
      }));
    }),
    write(
      'createAccount',
      schema(
        {
          name: stringSchema,
          type: {
            type: 'string',
            enum: ['checking', 'savings', 'credit'],
          },
          iban: stringSchema,
          bank: stringSchema,
          currentBalance: numberSchema,
        },
        ['name', 'type', 'iban']
      ),
      async (input, signal) => {
        const name = requiredString(input.name, copy);
        const type = requiredString(input.type, copy);
        if (!['checking', 'savings', 'credit'].includes(type))
          throw new Error(copy.invalidInput);
        const iban = requiredString(input.iban, copy, 34);
        const bank = optionalString(input.bank, copy);
        const currentBalance =
          input.currentBalance === undefined
            ? undefined
            : finite(input.currentBalance, copy);
        guard(signal);
        const created = await service.createAccount({
          name,
          type,
          iban,
          bank,
          currentBalance,
        });
        return { id: created.id };
      }
    ),
    write(
      'createTransaction',
      schema(
        {
          date: dateSchema,
          amount: numberSchema,
          type: { type: 'string', enum: ['income', 'expense', 'transfer'] },
          accountId: stringSchema,
          categoryId: stringSchema,
          description: stringSchema,
          merchantName: stringSchema,
          notes: stringSchema,
        },
        ['date', 'amount', 'type', 'accountId']
      ),
      async (input, signal) => {
        const date = optionalDate(input.date, copy);
        const amount = finite(input.amount, copy);
        const type = requiredString(input.type, copy, 8);
        const accountId = requiredString(input.accountId, copy);
        const categoryId = optionalString(input.categoryId, copy);
        if (!date || !['income', 'expense', 'transfer'].includes(type))
          throw new Error(copy.invalidInput);
        if (
          (type === 'income' && amount <= 0) ||
          (type === 'expense' && amount >= 0)
        )
          throw new Error(copy.invalidInput);
        if (
          !(await service.getAccounts()).some(
            (account) => account.id === accountId
          )
        )
          throw new Error(copy.notFound);
        if (
          categoryId &&
          !(await service.getCategories()).some(
            (category) => category.id === categoryId
          )
        )
          throw new Error(copy.notFound);
        guard(signal);
        const id = await service.createTransaction({
          date,
          amount,
          type: type as 'income' | 'expense' | 'transfer',
          accountId,
          categoryId,
          description: optionalString(input.description, copy, 1000),
          merchantName: optionalString(input.merchantName, copy),
          notes: optionalString(input.notes, copy, 2000),
        });
        return { id };
      }
    ),
    write(
      'updateTransaction',
      schema(
        {
          id: stringSchema,
          categoryId: stringSchema,
          merchantName: stringSchema,
          notes: stringSchema,
        },
        ['id']
      ),
      async (input, signal) => {
        const id = requiredString(input.id, copy);
        const categoryId = optionalString(input.categoryId, copy);
        const merchantName = optionalString(input.merchantName, copy);
        const notes = optionalString(input.notes, copy, 2000);
        if (
          categoryId === undefined &&
          merchantName === undefined &&
          notes === undefined
        )
          throw new Error(copy.invalidInput);
        if (!(await deps.hasTransaction(id))) throw new Error(copy.notFound);
        if (
          categoryId &&
          !(await service.getCategories()).some(
            (category) => category.id === categoryId
          )
        )
          throw new Error(copy.notFound);
        guard(signal);
        await service.updateTransaction(id, {
          categoryId,
          merchantName,
          notes,
        });
        return { id, updated: true };
      }
    ),
    write(
      'createCategory',
      schema({ name: stringSchema, parentId: stringSchema }, ['name']),
      async (input, signal) => {
        const name = requiredString(input.name, copy);
        const parentId = optionalString(input.parentId, copy);
        if (
          parentId &&
          !(await service.getCategories()).some(
            (category) => category.id === parentId
          )
        )
          throw new Error(copy.notFound);
        guard(signal);
        const category = await service.createCategory({ name, parentId });
        return { id: category.id };
      }
    ),
    write(
      'setBudget',
      schema(
        {
          budgetId: stringSchema,
          categoryId: stringSchema,
          amount: numberSchema,
        },
        ['amount']
      ),
      async (input, signal) => {
        const amount = finite(input.amount, copy, true);
        const budgetId = optionalString(input.budgetId, copy);
        const categoryId = optionalString(input.categoryId, copy);
        if (budgetId) {
          if (
            !(await service.getBudgets()).some(
              (budget) => budget.id === budgetId
            )
          )
            throw new Error(copy.notFound);
          guard(signal);
          await service.updateBudget(budgetId, { amount });
          return { id: budgetId, updated: true };
        }
        if (
          !categoryId ||
          !(await service.getCategories()).some(
            (category) => category.id === categoryId
          )
        )
          throw new Error(copy.notFound);
        guard(signal);
        const budget = await service.createBudget({ categoryId, amount });
        return { id: budget.id, created: true };
      }
    ),
    write(
      'createContact',
      schema({ name: stringSchema, iban: stringSchema, notes: stringSchema }, [
        'name',
        'iban',
      ]),
      async (input, signal) => {
        const name = requiredString(input.name, copy);
        const iban = requiredString(input.iban, copy, 34);
        const notes = optionalString(input.notes, copy, 2000);
        guard(signal);
        const contact = await service.createAddressBookEntry({
          name,
          iban,
          notes,
        });
        return {
          id: contact.data.id,
          merged: contact.merged ?? false,
          transactionsUpdated: contact.data.transactionsUpdated,
        };
      }
    ),
  ];
}
