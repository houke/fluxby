const nl = {
  title: 'Importprofielen en Nederlandse bankbestanden',
  formats:
    'Gebruik CSV voor ING, ASN en Rabobank. Voor ABN AMRO kun je het tabgescheiden bestand met zeven kolommen uploaden (.tab of .txt). Bankexports kunnen verschillen; controleer altijd de datum, het teken van het bedrag en het saldo in het voorbeeld.',
  profiles:
    'Open Importinstellingen in het toewijzingsvenster. Kies het scheidingsteken, de datumnotatie en het decimaalteken. Je kunt inleidende rijen overslaan, aparte af- en bijkolommen kiezen en het teken omkeren. Klik na wijzigingen aan rijen of het scheidingsteken op Bestand opnieuw lezen. Sla een benoemd importprofiel op om dezelfde kolomindeling later opnieuw te gebruiken.',
  source:
    'De oorspronkelijke kolommen blijven bewaard in de brongegevens, inclusief aanwezige SEPA-machtigingskenmerken, incassant-ID’s en betalingsreferenties. Mogelijke dubbele transacties worden lokaal voorgesteld voor controle; gelijke bedragen zijn op zichzelf geen bewijs van een duplicaat.',
  recoveryTitle: 'Herstellen na een import',
  recovery:
    'Fluxby bewaart maximaal drie lokale herstelbestanden van vóór een import. Onder Herstel en import ongedaan maken kun je een herstelbestand downloaden. Open daarna Instellingen → Back-up om het bestand te herstellen. Een herstelbestand bevat alle profielen en vervangt de financiële gegevens bij herstel.',
  undo: 'Import ongedaan maken verwijdert alleen transacties uit de gekozen import en berekent saldi opnieuw. Later gewijzigde transacties blokkeren deze actie, zodat bewerkingen niet stil verdwijnen. Categorieën en contacten worden behouden. Bij Actualiteit per rekening zie je wanneer een rekening voor het laatst is geïmporteerd en wat de nieuwste transactiedatum is.',
};
const en: typeof nl = {
  title: 'Import profiles and Dutch bank files',
  formats:
    'Use CSV for ING, ASN and Rabobank. For ABN AMRO, upload the seven-column tab-separated file (.tab or .txt). Bank exports can vary; always check the date, amount sign and balance in the preview.',
  profiles:
    'Open Import settings in the mapping dialog. Choose the delimiter, date format and decimal separator. You can skip introductory rows, choose separate debit and credit columns and reverse the sign. After changing rows or the delimiter, click Read file again. Save a named import profile to reuse the same column layout later.',
  source:
    'Original columns are retained in the source data, including any SEPA mandate identifiers, creditor IDs and payment references. Possible duplicate transactions are suggested locally for review; matching amounts alone do not prove a duplicate.',
  recoveryTitle: 'Recovering after an import',
  recovery:
    'Fluxby keeps up to three local recovery files from before an import. Download a recovery file under Recovery and import undo. Then open Settings → Backup to restore the file. A recovery file contains all profiles and replaces financial data when restored.',
  undo: 'Undo import removes only transactions from the selected import and recalculates balances. Subsequent transaction edits block the action, so those changes cannot silently disappear. Categories and contacts are retained. Account freshness shows when an account was last imported and its latest transaction date.',
};
export const importWorkflowHelp = { nl, en };
