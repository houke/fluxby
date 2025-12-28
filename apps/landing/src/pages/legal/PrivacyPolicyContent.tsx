import { useLanguage } from '../../contexts/LanguageContext';

const PrivacyPolicyContent = () => {
  const { t } = useLanguage();
  const legal = t.legal?.privacy;

  return (
    <>
      <p className='text-sm text-gray-500 dark:text-gray-500'>
        <strong>{legal?.lastUpdated || 'Laatst bijgewerkt:'}</strong> 04 januari
        2026
      </p>

      <h2>{legal?.introTitle || '1. Introductie'}</h2>
      <p>
        {legal?.introText ||
          'Dit Privacybeleid beschrijft hoe Fluxby ("wij", "ons" of "de App") met jouw gegevens omgaat.'}
      </p>
      <p>
        {legal?.introPhilosophy ||
          'Wij geloven dat jouw financiële gegevens alleen van jou zijn. De kernfilosofie van deze App is absolute privacy. Wij beheren geen servers, wij vereisen geen gebruikersaccounts, en wij volgen jouw gedrag niet.'}
      </p>

      <h2>{legal?.localFirstTitle || '2. De "Local-First" Architectuur'}</h2>
      <p>
        <strong>
          {legal?.localFirstSubtitle ||
            'Alle gegevens blijven op jouw apparaat.'}
        </strong>
      </p>
      <p>
        {legal?.localFirstText ||
          'Deze App werkt als een standalone hulpmiddel. Wanneer je uitgaven invoert, transacties categoriseert, of bankafschriften importeert, wordt die informatie lokaal opgeslagen in de interne opslag van jouw apparaat.'}
      </p>
      <ul>
        <li>
          <strong>{legal?.noCloudTitle || 'Geen Cloud Sync:'}</strong>{' '}
          {legal?.noCloudText ||
            'Wij synchroniseren jouw gegevens niet naar cloudservers.'}
        </li>
        <li>
          <strong>{legal?.noAccountsTitle || 'Geen Accounts:'}</strong>{' '}
          {legal?.noAccountsText ||
            'Je hoeft geen gebruikersnaam of wachtwoord bij ons aan te maken.'}
        </li>
        <li>
          <strong>{legal?.noAITitle || 'Geen Third-Party AI:'}</strong>{' '}
          {legal?.noAIText ||
            'Wij sturen jouw financiële beschrijvingen of adresboekgegevens niet naar externe AI-modellen (zoals OpenAI of Google Gemini) voor verwerking. Alle logica wordt lokaal uitgevoerd op de processor van je apparaat.'}
        </li>
      </ul>

      <h2>{legal?.dataAccessTitle || '3. Gegevens Die We Benaderen'}</h2>
      <p>
        {legal?.dataAccessText ||
          'Om functionaliteit te bieden, kan de App toestemming vragen om specifieke gegevens op jouw apparaat te benaderen. Deze toegang wordt uitsluitend gebruikt voor de volgende doeleinden:'}
      </p>

      <h3>
        {legal?.transactionDataTitle || 'A. Financiële Transactiegegevens'}
      </h3>
      <p>
        {legal?.transactionDataText ||
          "Wanneer je handmatig gegevens invoert of bestanden importeert (zoals CSV's of bankafschriften), verwerkt de App deze informatie om grafieken en categorieën te maken. Deze verwerking gebeurt direct op jouw apparaat. Wij zien (en kunnen) deze gegevens niet zien."}
      </p>

      <h3>{legal?.localStorageTitle || 'B. Lokale Opslag'}</h3>
      <p>
        {legal?.localStorageText ||
          'De App slaat alle gegevens op in een lokale database op jouw apparaat. Dit omvat transacties, categorieën, budgetten en instellingen. Deze database verlaat nooit jouw apparaat en is alleen toegankelijk voor de App zelf.'}
      </p>

      <h2>{legal?.aiDisclosureTitle || '4. AI-Ontwikkeling Disclosure'}</h2>
      <p>
        {legal?.aiDisclosureText ||
          'Let op: de codebase voor deze App is volledig gegenereerd met behulp van Kunstmatige Intelligentie.'}
      </p>
      <p>
        {legal?.aiDisclosureDetails ||
          'Vanuit een privacyperspectief betekent dit dat de app is ontworpen om te functioneren op basis van logica gegenereerd door AI-prompts. Hoewel we de AI hebben geïnstrueerd om strikt vast te houden aan lokale opslagprincipes, is er geen menselijk toezichtteam dat een backend database monitort—omdat er geen backend database is.'}
      </p>

      <h2>{legal?.securityTitle || '5. Gegevensbeveiliging en Back-ups'}</h2>
      <p>
        {legal?.securityText ||
          'Omdat wij jouw gegevens niet opslaan, kunnen wij jouw gegevens niet herstellen als ze verloren gaan.'}
      </p>
      <ul>
        <li>
          <strong>
            {legal?.yourResponsibilityTitle || 'Jouw Verantwoordelijkheid:'}
          </strong>{' '}
          {legal?.yourResponsibilityText ||
            'Jij bent verantwoordelijk voor de beveiliging van je fysieke apparaat.'}
        </li>
        <li>
          <strong>{legal?.backupsTitle || 'Back-ups:'}</strong>{' '}
          {legal?.backupsText ||
            'Als je de App verwijdert of je telefoon verliest, zijn je financiële gegevens verloren, tenzij je gebruik hebt gemaakt van de ingebouwde back-upfuncties van je apparaat (bijv. iCloud Backup of Android Backup) of handmatig je gegevens hebt geëxporteerd.'}
        </li>
      </ul>

      <h2>{legal?.thirdPartyTitle || '6. Third-Party Diensten'}</h2>
      <p>
        {legal?.thirdPartyText ||
          'De App integreert niet met third-party analytics of advertentienetwerken.'}
      </p>
      <p>
        {legal?.thirdPartyOS ||
          'De App draait echter op een besturingssysteem (iOS of Android) dat mogelijk gebruiksstatistieken verzamelt onafhankelijk van onze App. Raadpleeg het privacybeleid van Apple of Google over hoe zij app-gebruiksgegevens verwerken.'}
      </p>

      <h2>{legal?.changesTitle || '7. Wijzigingen in Dit Beleid'}</h2>
      <p>
        {legal?.changesText ||
          'We kunnen dit Privacybeleid van tijd tot tijd bijwerken. Aangezien we geen e-mailadressen verzamelen, kunnen we je niet direct informeren over wijzigingen. Je wordt geadviseerd deze pagina periodiek te bekijken voor eventuele wijzigingen.'}
      </p>

      <h2>{legal?.contactTitle || '8. Contact'}</h2>
      <p>
        {legal?.contactText ||
          'Als je vragen hebt over hoe de App lokaal werkt op jouw apparaat, kun je contact opnemen met de ontwikkelaar via:'}{' '}
        <a href='#' className='text-fluxby-purple hover:underline'>
          {legal?.contactGithub || 'contact me on GitHub'}
        </a>
      </p>
    </>
  );
};

export default PrivacyPolicyContent;
