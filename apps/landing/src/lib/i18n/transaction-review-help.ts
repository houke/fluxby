export const transactionReviewHelpNl = {
  compactTitle: 'Compacte weergave',
  compactText:
    'Kies Compacte weergave in de actierij onder de transactiefilters om meer transacties tegelijk te zien. Met Ruime weergave herstel je de gebruikelijke rijhoogte.',
  reviewTitle: 'Transacties controleren en terugbetalingen',
  reviewText:
    'Open Transacties en kies Transacties controleren. Controleer ontbrekende categorieën, mogelijke dubbele betalingen, ongebruikelijke bedragen en eigen overboekingen. Afwijkingen tonen de historische mediaan of het maandgemiddelde, de vergelijkingsperiode en het aantal betalingen of maanden. Nieuwe handelaars worden vanaf € 100 voorgesteld na ten minste tien eerdere uitgaven; de herkenning volgt de aangeleverde naam of omschrijving. Een suggestie verandert niets vanzelf. Kies Gecontroleerd of stel de suggestie zeven dagen uit. In het controleoverzicht werken J/K voor navigatie, L voor later, D voor gecontroleerd en U voor herstellen. De laatste beslissing kun je direct herstellen.',
  linksText:
    'Onder Handmatig koppelen kies je een ontvangen betaling, de oorspronkelijke uitgave en het deelbedrag. Kies of het een terugbetaling of kostenvergoeding is, bijvoorbeeld via Tikkie. Meerdere terugbetalingen en deelbedragen zijn mogelijk; samen mogen ze het ontvangen bedrag of de uitgave niet overschrijden. De oorspronkelijke uitgave telt netto mee in budgetten en statistieken. Je banksaldo verandert niet. Onder Bestaande koppelingen kun je expliciet de categorie van de oorspronkelijke uitgave overnemen als alle gekoppelde uitgaven dezelfde categorie hebben. Herstellen zet de vorige categorie en categoriekeuze terug; de koppeling blijft bestaan. Verwijder een verkeerde koppeling in hetzelfde overzicht.',
  billsText:
    'Onder Vaste last maken kun je één uitgave aanwijzen als wekelijkse, tweewekelijkse, maandelijkse, kwartaal- of jaarlijkse betaling. Bekijk en wijzig deze daarna bij Abonnementen. Bij eigen overboekingen bevestig je beide transacties. Suggesties gebruiken gelijke tegengestelde bedragen op verschillende rekeningen binnen drie dagen. Elke transactie komt maar eenmaal in een voorgestelde koppeling voor: een overeenkomende eigen IBAN krijgt voorrang, daarna de dichtstbijzijnde beschikbare datum. Als je de koppeling verwijdert, herstellen de oorspronkelijke typen.',
  exportText:
    'Kies Gefilterde CSV downloaden om alle transacties die aan de huidige filters voldoen te exporteren, inclusief categorie, rekening en notities. De Nederlandse export gebruikt puntkomma’s en een decimale komma. Bedragen staan in EUR. Tekstvelden worden veilig gequote voor gebruik in een spreadsheet.',
  analyticsTitle: 'Geldstroom en vergelijkbare maanden',
  analyticsText:
    'De geldstroom toont voor de geselecteerde eindmaand hoe inkomsten via categorie-uitgaven uitkomen op wat overblijft. Gekoppelde terugbetalingen worden één keer verwerkt. Kies een basis van 3, 6 of 12 eerdere maanden. Voor de huidige maand vergelijkt Fluxby dezelfde verstreken dagen. De eerste geïmporteerde maand telt niet mee, omdat die onvolledig kan zijn. Ontbrekende afschriften kunnen de vergelijking beïnvloeden.',
};
export type TransactionReviewHelp = typeof transactionReviewHelpNl;
export const transactionReviewHelpEn: TransactionReviewHelp = {
  compactTitle: 'Compact view',
  compactText:
    'Choose Compact view in the action row below the transaction filters to see more transactions at once. Comfortable view restores the usual row height.',
  reviewTitle: 'Review transactions and reimbursements',
  reviewText:
    'Open Transactions and choose Review transactions. Check missing categories, possible duplicate payments, unusual amounts and own-account transfers. Alerts show the historical median or monthly average, comparison period and number of payments or months. New merchants are suggested from €100 after at least ten earlier expenses; recognition follows the supplied name or description. Suggestions never change records automatically. Mark an item Reviewed or snooze it for seven days. While the review is focused, use J/K to navigate, L for later, D for reviewed and U to undo. You can immediately undo the last decision.',
  linksText:
    'Under Link manually, select an incoming payment, the original expense and a partial amount. Choose whether it is a refund or expense reimbursement, for example a Tikkie. Multiple partial reimbursements are supported; their total cannot exceed the received payment or expense. Budgets and statistics use the net original expense. Your bank balance does not change. Under Existing links, explicitly copy the original expense category when all linked expenses share that category. Undo restores your previous category and category decision while retaining the link. Remove incorrect links in the same panel.',
  billsText:
    'Under Create recurring bill, select a single expense and a weekly, fortnightly, monthly, quarterly or annual schedule. Then view and edit it under Subscriptions. Confirm both sides of an own-account transfer. Suggestions use equal opposite amounts on different accounts within three days. Each transaction appears in one proposed pair: a matching own-account IBAN takes priority, then the closest available date. Removing its link restores the original transaction types.',
  exportText:
    'Choose Download filtered CSV to export every transaction matching the current filters, including its category, account and notes. Dutch exports use semicolons and decimal commas. Amounts are in EUR. Text fields are safely quoted for spreadsheet use.',
  analyticsTitle: 'Cash flow and comparable months',
  analyticsText:
    'Cash flow shows how income becomes remaining money after category expenses in the selected end month. Linked reimbursements are counted once. Select a baseline of 3, 6 or 12 prior months. For the current month, Fluxby compares the same elapsed days. The first imported month is excluded because it may be incomplete. Missing statements may affect the comparison.',
};
