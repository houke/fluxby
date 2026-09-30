const nl = {
  emergencyFund: 'Noodfonds',
  holiday: 'Vakantie',
  bicycle: 'Fiets',
  studentLoan: 'Studieschuld',
  uncategorizedSpending: 'Ongecategoriseerde uitgaven',
};
const en: typeof nl = {
  emergencyFund: 'Emergency fund',
  holiday: 'Holiday',
  bicycle: 'Bicycle',
  studentLoan: 'Student loan',
  uncategorizedSpending: 'Uncategorized spending',
};
export const FINANCIAL_PLANNING_DEMO_COPY: Record<'nl' | 'en', typeof nl> = {
  nl,
  en,
};

export function getFinancialPlanningDemoData(language: 'nl' | 'en') {
  const copy = FINANCIAL_PLANNING_DEMO_COPY[language];
  return {
    copy,
    goals: [
      {
        name: copy.emergencyFund,
        targetAmount: 5000,
        currentAmount: 1250,
        monthlyContribution: 150,
      },
      {
        name: copy.holiday,
        targetAmount: 1800,
        currentAmount: 450,
        monthlyContribution: 100,
      },
    ],
    netWorthItems: [
      { name: copy.bicycle, type: 'asset' as const, amount: 750 },
      { name: copy.studentLoan, type: 'liability' as const, amount: 1200 },
    ],
    preferences: { minimumBalance: 250, reservedSavings: 100 },
  };
}
