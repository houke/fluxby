import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpBulkDelete() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.title || 'Meerdere transacties beheren'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.subtitle ||
          'Selecteer en verwijder meerdere transacties tegelijk voor snelle administratie.'}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>💡</span>
          {t.helpCenter?.bulkDelete?.tipTitle || 'Handig om te weten'}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.helpCenter?.bulkDelete?.tipText ||
            'Je kunt transacties ongedaan maken tot 5 minuten na verwijdering. Hierdoor kun je rustig experimenteren zonder angst voor dataverlies.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.selectionModeTitle ||
          'Selectiemodus activeren'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.selectionModeText ||
          'Om meerdere transacties te selecteren, moet je eerst de selectiemodus inschakelen:'}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.step1 ||
            'Ga naar de Transacties pagina via het menu'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.step2 ||
            'Klik op het vinkje-icoon naast een transactie om selectiemodus te starten'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.step3 ||
            'Er verschijnt een actiebalk onderin met opties voor de geselecteerde transacties'}
        </li>
      </ol>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.selectingTitle || 'Transacties selecteren'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.selectingText ||
          'Er zijn verschillende manieren om transacties te selecteren:'}
      </p>
      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>☑️</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.bulkDelete?.singleSelect || 'Individueel selecteren'}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.bulkDelete?.singleSelectDesc ||
              'Klik op het vinkje bij elke transactie die je wilt selecteren.'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>⇧</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.bulkDelete?.rangeSelect || 'Bereik selecteren'}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.bulkDelete?.rangeSelectDesc ||
              'Houd Shift ingedrukt en klik op een andere transactie om alles ertussen te selecteren (alleen op desktop).'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>✅</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.bulkDelete?.selectAll || 'Alles selecteren'}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.bulkDelete?.selectAllDesc ||
              'Gebruik de "Alles selecteren" knop in de actiebalk om alle zichtbare transacties te selecteren.'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>❌</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.bulkDelete?.deselectAll || 'Selectie opheffen'}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.bulkDelete?.deselectAllDesc ||
              'Klik op "Annuleren" of druk op Escape om de selectiemodus te verlaten en alle selecties op te heffen.'}
          </p>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.deletingTitle ||
          'Geselecteerde transacties verwijderen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.deletingText ||
          'Zodra je transacties hebt geselecteerd, kun je ze verwijderen:'}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.deleteStep1 ||
            'Klik op de "Verwijderen" knop in de actiebalk onderaan'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.deleteStep2 ||
            'Bevestig de verwijdering in het dialoogvenster'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.deleteStep3 ||
            'De transacties worden verwijderd en het rekeningsaldo wordt automatisch herberekend'}
        </li>
      </ol>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.dateRangeTitle ||
          'Verwijderen op datumbereik'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.dateRangeText ||
          'Je kunt ook alle transacties binnen een bepaalde periode verwijderen:'}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.dateRangeStep1 ||
            'Klik op de "Verwijder op datum" knop in de actiebalk'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.dateRangeStep2 ||
            'Selecteer de start- en einddatum'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.dateRangeStep3 ||
            'Optioneel: filter op een specifieke rekening'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.dateRangeStep4 ||
            'Bevestig om alle transacties in dat bereik te verwijderen'}
        </li>
      </ol>

      <div className='not-prose mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-200'>
          <span>⚠️</span>
          {t.helpCenter?.bulkDelete?.cautionTitle || 'Let op'}
        </h4>
        <p className='m-0 text-amber-700 dark:text-amber-300'>
          {t.helpCenter?.bulkDelete?.cautionText ||
            'Verwijderen op datumbereik kan veel transacties tegelijk verwijderen. Gebruik de dry-run optie (preview) om eerst te zien hoeveel transacties getroffen worden.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.undoTitle || 'Ongedaan maken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.undoText ||
          'Verwijderde transacties kunnen worden hersteld binnen 5 minuten na verwijdering:'}
      </p>
      <ul className='mt-4 list-inside list-disc text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.undoPoint1 ||
            'Na verwijdering verschijnt een "Ongedaan maken" melding'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.undoPoint2 ||
            'Klik op "Ongedaan maken" om de transacties te herstellen'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.bulkDelete?.undoPoint3 ||
            'De melding verdwijnt automatisch na 5 minuten, waarna herstel niet meer mogelijk is'}
        </li>
      </ul>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.balanceTitle || 'Effect op rekeningsaldo'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.balanceText ||
          'Wanneer je transacties verwijdert, wordt het saldo van de betreffende rekening(en) automatisch herberekend op basis van de resterende transacties. Je hoeft dit niet handmatig te doen.'}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>✅</span>
          {t.helpCenter?.bulkDelete?.bestPracticeTitle || 'Best practice'}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.bulkDelete?.bestPracticeText ||
            'Gebruik filters om eerst de transacties te bekijken die je wilt verwijderen. Zo weet je zeker dat je de juiste selectie maakt voordat je ze verwijdert.'}
        </p>
      </div>
    </article>
  );
}
