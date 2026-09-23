import { ExternalLink, Sparkles } from 'lucide-react';

export default function HelpAI() {
  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        Slimme AI functies
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        Fluxby kan TypeSafe AI optioneel gebruiken om transacties te
        categoriseren, onbekende importkolommen te herkennen, mogelijke
        adresboekmatches te vinden en betaalplatforms te herkennen.
      </p>

      <div className='not-prose mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200'>
        TypeSafe AI werkt in de desktop-app en in de web-app. De webversie
        gebruikt een kleine Fluxby-gateway voor browsercommunicatie; de
        desktop-app maakt rechtstreeks verbinding. In beide versies moet je
        eerst je eigen TypeSafe API-sleutel toevoegen. Zonder sleutel worden
        geen AI-verzoeken gedaan.
      </div>

      {/* What is it */}
      <div className='not-prose mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <Sparkles className='h-5 w-5' />
          Wat is TypeSafe AI?
        </h3>
        <p className='mb-2 text-purple-800 dark:text-purple-300'>
          TypeSafe AI is een dienst die gerichte AI-beslissingen teruggeeft als
          gestructureerde antwoorden — geen chatbot, geen automatische acties.
          Fluxby gebruikt het als intelligente vervanger voor de fragiele
          regex-regels die je transacties proberen te matchen.
        </p>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          <strong>Volledig optioneel.</strong> Zonder API-sleutel werkt Fluxby
          precies zoals altijd. Met een sleutel worden bepaalde functies
          slimmer.
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Wat verbetert AI?
      </h2>

      <div className='not-prose mt-6 grid gap-4 md:grid-cols-2'>
        {[
          {
            emoji: '🏷️',
            title: 'Automatisch categoriseren',
            desc: 'Pas bestaande regels toe en laat de AI daarna een categorie kiezen op basis van winkelnaam, omschrijving en bedrag. Alleen automatisch toegewezen bij meer dan 60% zekerheid.',
          },
          {
            emoji: '🧠',
            title: 'Categorisatieregels vinden',
            desc: 'TypeSafe beoordeelt terugkerende winkels zonder categorie. Fluxby maakt alleen een herbruikbare regel als de categorie met meer dan 60% zekerheid past.',
          },
          {
            emoji: '📊',
            title: 'Importkolommen voorstellen',
            desc: 'Als verplichte CSV-velden ontbreken of dubbelzinnig zijn, kan Jev een kolom voorstellen. Controleer de koppeling en het transactievoorbeeld voordat je importeert. Excel-bestanden (.xlsx) worden ook ondersteund.',
          },
          {
            emoji: '📒',
            title: 'Adresboekmatches voorstellen',
            desc: 'Jev vergelijkt onbekende tegenpartijen met bestaande contacten. Jij bevestigt elke IBAN-koppeling; contacten worden nooit automatisch samengevoegd.',
          },
          {
            emoji: '📥',
            title: 'CSV-import: richting detecteren',
            desc: 'Niet-Nederlandse banken gebruiken soms vreemde codes voor "debet/credit" (bijv. Duits: Belastung/Gutschrift). De AI herkent deze automatisch, zodat imports altijd het goede teken krijgen.',
          },
          {
            emoji: '📅',
            title: 'CSV-import: datumformaat',
            desc: 'Is "01/02/2024" nu 1 februari of 2 januari? De AI herkent het datumformaat van je bank uit een paar voorbeelden, zodat er nooit stille datumfouten ontstaan.',
          },
          {
            emoji: '💳',
            title: 'Betaalplatforms herkennen',
            desc: 'Tikkie, PayPal, Mollie en nieuwe platformen worden herkend op basis van IBAN en transactiebeschrijving — ook als ze nog niet in je patroonlijst staan.',
          },
          {
            emoji: '🔄',
            title: 'Abonnementen samenvoegen',
            desc: '"Netflix" en "Netflix Premium" bij hetzelfde IBAN zijn waarschijnlijk hetzelfde abonnement. De AI groepeert zulke variaties zodat de patroondetectie de volledige transactiegeschiedenis ziet.',
          },
          {
            emoji: '🔍',
            title: 'Dubbele transacties opsporen',
            desc: 'Transacties met hetzelfde bedrag en bijna dezelfde datum maar een licht afwijkende omschrijving worden ter review aangeboden. Fluxby verwijdert nooit automatisch — jij beslist.',
          },
          {
            emoji: '🔄',
            title: 'Interne overboekingen controleren',
            desc: 'Jev beoordeelt mogelijke tegenboekingen op verschillende rekeningen. Jij bevestigt een paar voordat Fluxby beide transacties als overboeking markeert.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50'
          >
            <div className='mb-2 text-2xl'>{item.emoji}</div>
            <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
              {item.title}
            </h4>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Hoe schakel ik het in?
      </h2>
      <ol className='text-gray-600 dark:text-gray-400'>
        <li>
          Ga naar <strong>Instellingen → App-instellingen → TypeSafe AI</strong>
        </li>
        <li>
          Haal een gratis API-sleutel op via{' '}
          <a
            href='https://console.typesafe.ai/keys'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1'
          >
            console.typesafe.ai/keys
            <ExternalLink className='h-3 w-3' />
          </a>
        </li>
        <li>Plak de sleutel in het invoerveld en sla op</li>
        <li>
          Gebruik de knoppen voor categoriseren, regels vinden, betaalplatforms
          detecteren, dubbele transacties en mogelijke overboekingen
          controleren. Jev kan ook kolommen voorstellen tijdens het importeren
          en contactmatches voorstellen in het adresboek.
        </li>
      </ol>
      <p className='text-gray-600 dark:text-gray-400'>
        Je kunt de sleutel op elk moment verwijderen. Daarna worden er geen
        AI-verzoeken meer gedaan.
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Privacy — welke gegevens worden verstuurd?
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        Fluxby verstuurt alleen de minimale gegevens die nodig zijn voor de
        beslissing. Volledige transactielijsten worden nooit verstuurd. Je
        persoonlijke IBAN&apos;s blijven lokaal; providerherkenning kan wel een
        tegenpartij-IBAN meesturen wanneer je die actie start.
      </p>
      <div className='not-prose mt-4 overflow-x-auto rounded-lg border'>
        <table className='w-full border-collapse text-sm'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-2 text-left font-medium'>Functie</th>
              <th className='px-4 py-2 text-left font-medium'>
                Wat wordt verstuurd
              </th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {[
              ['Categoriseren', 'Winkelnaam, omschrijving, bedrag'],
              ['CSV richting', 'Unieke richting-waarden uit het bestand'],
              ['CSV datum', 'Max. 10 datumstrings uit de CSV'],
              [
                'CSV-kolommen',
                'Kolomnamen en maximaal twee beperkte voorbeeldregels',
              ],
              ['Betaalplatform', 'IBAN en winkelnamen'],
              [
                'Adresboekmatch',
                'Tegenpartijnaam, aantal transacties en mogelijke contactnamen; geen IBAN',
              ],
              ['Abonnementen', 'IBAN en genormaliseerde winkelnamen'],
              ['Dubbele transacties', 'Datum, bedrag, omschrijving per paar'],
              [
                'Overboekingen',
                'Rekeningnamen, datum, bedrag en omschrijving per paar',
              ],
            ].map(([feat, data]) => (
              <tr key={feat}>
                <td className='px-4 py-2 font-medium'>{feat}</td>
                <td className='px-4 py-2 text-gray-500 dark:text-gray-400'>
                  {data}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className='text-gray-600 dark:text-gray-400'>
        Bekijk het{' '}
        <a
          href='https://typesafe.ai/legal/privacy-policy'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1'
        >
          TypeSafe privacybeleid
          <ExternalLink className='h-3 w-3' />
        </a>{' '}
        voor details over hoe TypeSafe met je gegevens omgaat.
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        Veelgestelde vragen
      </h2>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        Werkt Fluxby zonder AI?
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        Ja, volledig. Alle AI-functies zijn een optionele laag bovenop de
        bestaande logica. Zonder API-sleutel gedraagt de app zich precies
        hetzelfde als voorheen.
      </p>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        Kan de AI mijn transacties verwijderen?
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        Nee. De AI suggereert alleen — code en jij nemen alle beslissingen.
        Dubbele transacties worden ter review aangeboden, nooit automatisch
        verwijderd.
      </p>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        Kost TypeSafe geld?
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        TypeSafe geeft nieuwe accounts $5,- tegoed om mee te starten (op het
        moment van schrijven). Je kunt daarna zelf extra budget toevoegen. Kijk
        op{' '}
        <a
          href='https://typesafe.ai'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1'
        >
          typesafe.ai
          <ExternalLink className='h-3 w-3' />
        </a>{' '}
        voor de actuele prijzen.
      </p>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        Wat is &ldquo;Jev&rdquo;?
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        Jev is TypeSafe&apos;s vlaggenschip System One model. Het geeft
        gestructureerde antwoorden terug (kansen, keuzes) in plaats van vrije
        tekst. Fluxby gebruikt Jev via de TypeSafe HTTP API.
      </p>
    </article>
  );
}
