/** Shared by the production client and synthetic evaluation runner. */
export const AUTO_CATEGORY_CONFIDENCE_THRESHOLD = 0.6;
export interface CategoryJudgmentInput {
  merchantName: string | null;
  description: string | null;
  opposingAccountName?: string | null;
  amount: number;
}
export function buildCategoryRequest(
  transactions: CategoryJudgmentInput[],
  categories: { id: string; name: string }[]
) {
  const criteria: Record<string, string> = Object.fromEntries(
    categories.map((category, index) => [`c${index}`, category.name])
  );
  criteria.none = 'The transaction does not clearly fit any listed category';
  const questions: Record<
    string,
    { type: 'choice'; instructions: string; criteria: Record<string, string> }
  > = {};
  transactions.forEach((_, index) => {
    questions[`transaction_${index}`] = {
      type: 'choice',
      instructions: `Which category best fits \`transactions[${index}]\`? Use merchant, description, counterparty, amount, and amount sign together. Choose none when the evidence is insufficient or several categories are similarly plausible.`,
      criteria,
    };
  });
  return {
    state: {
      transactions: transactions.map((transaction) => ({
        merchant: transaction.merchantName ?? '',
        description: transaction.description ?? '',
        counterparty: transaction.opposingAccountName ?? '',
        amount: transaction.amount,
      })),
    },
    questions,
  };
}
