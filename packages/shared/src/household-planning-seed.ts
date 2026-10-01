/** Names are selected when a demo profile is created, never when it is read. */
export function getHouseholdPlanningDemoData(language: 'nl' | 'en') {
  const names =
    language === 'nl'
      ? {
          salary: 'Salaris',
          tax: 'Gemeentelijke belastingen',
          holiday: 'Vakantiegeld',
        }
      : {
          salary: 'Salary',
          tax: 'Municipal taxes',
          holiday: 'Holiday allowance',
        };
  return {
    cashflows: [
      {
        name: names.salary,
        kind: 'income' as const,
        amountCents: 320000,
        days: 14,
        frequency: 'monthly' as const,
        reservedCents: 0,
      },
      {
        name: names.tax,
        kind: 'expense' as const,
        amountCents: 36000,
        days: 45,
        frequency: 'yearly' as const,
        reservedCents: 12000,
      },
      {
        name: names.holiday,
        kind: 'income' as const,
        amountCents: 180000,
        days: 60,
        frequency: 'once' as const,
        reservedCents: 0,
      },
    ],
    variableDailyCents: 1500,
  };
}
