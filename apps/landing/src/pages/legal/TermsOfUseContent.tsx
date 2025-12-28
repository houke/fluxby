import { useLanguage } from '../../contexts/LanguageContext';

const TermsOfUseContent = () => {
  const { t } = useLanguage();
  const legal = t.legal?.terms;

  return (
    <>
      <p className='text-sm text-gray-500 dark:text-gray-500'>
        <strong>{legal?.lastUpdated || 'Laatst bijgewerkt:'}</strong> 04 januari
        2026
      </p>

      <h2>
        {legal?.aiDisclaimerTitle ||
          '1. De "Vibe Coded" Disclaimer (AI-Gegenereerde Software)'}
      </h2>
      <p>
        <strong>
          {legal?.aiDisclaimerImportant ||
            'BELANGRIJK: Je erkent en gaat ermee akkoord dat deze Applicatie volledig is geschreven en ontwikkeld door Kunstmatige Intelligentie (AI) op basis van prompts verstrekt door de ontwikkelaar.'}
        </strong>
      </p>
      <ul>
        <li>
          <strong>
            {legal?.experimentalNatureTitle || 'Experimentele Aard:'}
          </strong>{' '}
          {legal?.experimentalNatureText ||
            'Deze software moet worden beschouwd als experimenteel.'}
        </li>
        <li>
          <strong>
            {legal?.noHumanReviewTitle || 'Geen Menselijke Code Review:'}
          </strong>{' '}
          {legal?.noHumanReviewText ||
            'De code heeft geen professionele menselijke beveiligingsaudit of standaard enterprise-niveau kwaliteitsborging (QA) ondergaan.'}
        </li>
        <li>
          <strong>
            {legal?.unpredictabilityTitle || 'Onvoorspelbaarheid:'}
          </strong>{' '}
          {legal?.unpredictabilityText ||
            'AI-gegenereerde code kan hallucinaties, logische fouten, of onverwacht gedrag bevatten dat een menselijke ontwikkelaar zou vermijden.'}
        </li>
      </ul>
      <p className='font-semibold'>
        {legal?.useAtOwnRisk ||
          'Je gebruikt deze applicatie volledig op eigen risico.'}
      </p>

      <h2>{legal?.noFinancialAdviceTitle || '2. Geen Financieel Advies'}</h2>
      <p>
        {legal?.noFinancialAdviceText ||
          'Deze App is een hulpmiddel voor organisatie en visualisatie. Het is geen financieel adviseur, accountant of belastingprofessional.'}
      </p>
      <ul>
        <li>
          <strong>{legal?.calculationErrorsTitle || 'Rekenfouten:'}</strong>{' '}
          {legal?.calculationErrorsText ||
            'Door de AI-gegenereerde aard van de code, kan de App wiskundige fouten maken, transacties verkeerd categoriseren, of onjuiste totalen weergeven.'}
        </li>
        <li>
          <strong>{legal?.noRelianceTitle || 'Geen Afhankelijkheid:'}</strong>{' '}
          {legal?.noRelianceText ||
            'Je mag nooit uitsluitend op deze App vertrouwen voor belastingaangifte, bedrijfsboekhouding, of kritieke financiële beslissingen. Controleer cijfers altijd met je daadwerkelijke bankafschriften.'}
        </li>
      </ul>

      <h2>{legal?.licenseTitle || '3. Gebruikslicentie'}</h2>
      <p>
        {legal?.licenseText ||
          'Wij verlenen je een persoonlijke, herroepbare, niet-exclusieve, niet-overdraagbare licentie om de App op je apparaat te gebruiken. Wij behouden het recht voor om de App op elk moment zonder kennisgeving stop te zetten.'}
      </p>

      <h2>
        {legal?.userDataTitle ||
          '4. Gebruikersgegevens en Verantwoordelijkheid'}
      </h2>
      <p>
        {legal?.userDataText ||
          'Zoals vermeld in ons Privacybeleid, werkt deze App offline en slaat gegevens lokaal op.'}
      </p>
      <ul>
        <li>
          <strong>
            {legal?.dataControllerTitle || 'Jij bent de Data Controller:'}
          </strong>{' '}
          {legal?.dataControllerText ||
            'Jij bent als enige verantwoordelijk voor het maken van back-ups van je gegevens.'}
        </li>
        <li>
          <strong>{legal?.dataLossTitle || 'Gegevensverlies:'}</strong>{' '}
          {legal?.dataLossText ||
            'De Ontwikkelaar is niet verantwoordelijk voor enig verlies van gegevens, corruptie van bestanden, of onmogelijkheid om je uitgavengeschiedenis te benaderen, ongeacht of dit wordt veroorzaakt door App-bugs, apparaatfalen, of gebruikersfout.'}
        </li>
      </ul>

      <h2>{legal?.liabilityTitle || '5. Beperking van Aansprakelijkheid'}</h2>
      <p>
        <strong>
          {legal?.liabilityText ||
            'VOOR ZOVER WETTELIJK TOEGESTAAN, IS DE ONTWIKKELAAR NIET AANSPRAKELIJK VOOR ENIGE SCHADE.'}
        </strong>
      </p>
      <p>
        {legal?.liabilityIncludes || 'Dit omvat, maar is niet beperkt tot:'}
      </p>
      <ol>
        <li>
          <strong>
            {legal?.directDamagesTitle || 'Directe, Indirecte of Gevolgschade:'}
          </strong>{' '}
          {legal?.directDamagesText ||
            'Verlies van winst, gegevens of goodwill.'}
        </li>
        <li>
          <strong>
            {legal?.financialDiscrepanciesTitle || 'Financiële Discrepanties:'}
          </strong>{' '}
          {legal?.financialDiscrepanciesText ||
            'Eventuele financiële verliezen als gevolg van vertrouwen op de berekeningen of categoriseringen van de App.'}
        </li>
        <li>
          <strong>{legal?.bugsTitle || 'Bugs en Glitches:'}</strong>{' '}
          {legal?.bugsText ||
            'Eventuele problemen voortkomend uit de AI-gegenereerde codebase.'}
        </li>
      </ol>
      <p className='font-semibold'>
        {legal?.soleRemedy ||
          'Je enige remedie voor ontevredenheid met de App is om de App niet meer te gebruiken.'}
      </p>

      <h2>{legal?.asIsTitle || '6. "AS IS" en "AS AVAILABLE"'}</h2>
      <p>
        {legal?.asIsText ||
          'De App wordt geleverd op een "AS IS" basis. De Ontwikkelaar wijst expliciet alle garanties af, expliciet of impliciet, inclusief garanties van verkoopbaarheid, geschiktheid voor een bepaald doel, en niet-inbreuk.'}
      </p>
      <p>{legal?.noGuarantee || 'Wij garanderen niet dat:'}</p>
      <ul>
        <li>
          {legal?.requirementsGuarantee || 'De App aan je eisen zal voldoen.'}
        </li>
        <li>
          {legal?.uninterruptedGuarantee ||
            'De App ononderbroken, tijdig, veilig of foutloos zal zijn.'}
        </li>
        <li>
          {legal?.resultsGuarantee ||
            'De resultaten verkregen uit het gebruik van de App nauwkeurig of betrouwbaar zullen zijn.'}
        </li>
      </ul>

      <h2>{legal?.indemnificationTitle || '7. Vrijwaring'}</h2>
      <p>
        {legal?.indemnificationText ||
          'Je gaat ermee akkoord de Ontwikkelaar te vrijwaren en schadeloos te stellen voor alle claims, schade, aansprakelijkheden, kosten en uitgaven (inclusief juridische kosten) voortvloeiend uit jouw gebruik van de App of jouw schending van deze Voorwaarden.'}
      </p>

      <h2>{legal?.governingLawTitle || '8. Toepasselijk Recht'}</h2>
      <p>
        {legal?.governingLawText ||
          'Deze Voorwaarden worden beheerst door het recht van Nederland, zonder rekening te houden met de bepalingen inzake conflicten van wetgeving.'}
      </p>

      <div className='mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800'>
        <p className='mb-0 text-center font-medium text-gray-700 dark:text-gray-300'>
          {legal?.acknowledgement ||
            'Door Fluxby te gebruiken, erken je dat je deze overeenkomst hebt gelezen, begrijpt, en akkoord gaat met het feit dat dit een AI-gegenereerde tool is die zonder garantie wordt geleverd.'}
        </p>
      </div>
    </>
  );
};

export default TermsOfUseContent;
