/** Demo names are resolved when data is created, never relocalized in place. */
export function getImportProfileDemoData(language: 'nl' | 'en') {
  const headers = ['Datum', 'Bedrag', 'Omschrijving', 'Rekening'];
  return {
    name:
      language === 'nl'
        ? 'Mijn Nederlandse bankexport'
        : 'My Dutch bank export',
    headers,
    settings: {
      bank: 'generic',
      mapping: {
        date: 'Datum',
        amount: 'Bedrag',
        description: 'Omschrijving',
        iban: 'Rekening',
      },
      options: {
        delimiter: ';' as const,
        skipRows: 0,
        dateFormat: 'day-first' as const,
        decimal: ',' as const,
        invertSign: false,
        debitColumn: '',
        creditColumn: '',
      },
    },
  };
}
