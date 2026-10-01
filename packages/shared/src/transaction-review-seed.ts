/** Demo records are localized at creation; changing UI language does not rewrite them. */
export function getTransactionReviewDemoData(language: 'nl' | 'en') {
  return language === 'nl'
    ? {
        expense: 'Etentje met vrienden',
        first: 'Tikkie: eerste deel terugbetaald',
        second: 'Tikkie: tweede deel terugbetaald',
        merchant: 'Voorbeeldrestaurant',
        note: 'Voorbeeld van twee gekoppelde deelbetalingen',
      }
    : {
        expense: 'Dinner with friends',
        first: 'Tikkie: first share reimbursed',
        second: 'Tikkie: second share reimbursed',
        merchant: 'Example restaurant',
        note: 'Example of two linked partial reimbursements',
      };
}
