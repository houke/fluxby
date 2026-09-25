import { useLanguage } from '../../contexts/LanguageContext';

const TermsOfUseContent = () => {
  const { t } = useLanguage();
  const legal = t.legal?.terms;

  return (
    <>
      <p className='text-sm text-gray-500 dark:text-gray-500'>
        <strong>{legal?.lastUpdated}</strong> {legal?.lastUpdatedDate}
      </p>

      <h2>{legal?.aiDisclaimerTitle}</h2>
      <p>
        <strong>{legal?.aiDisclaimerImportant}</strong>
      </p>
      <ul>
        <li>
          <strong>{legal?.experimentalNatureTitle}</strong>{' '}
          {legal?.experimentalNatureText}
        </li>
        <li>
          <strong>{legal?.noHumanReviewTitle}</strong>{' '}
          {legal?.noHumanReviewText}
        </li>
        <li>
          <strong>{legal?.unpredictabilityTitle}</strong>{' '}
          {legal?.unpredictabilityText}
        </li>
      </ul>
      <p className='font-semibold'>{legal?.useAtOwnRisk}</p>

      <h2>{legal?.noFinancialAdviceTitle}</h2>
      <p>{legal?.noFinancialAdviceText}</p>
      <ul>
        <li>
          <strong>{legal?.calculationErrorsTitle}</strong>{' '}
          {legal?.calculationErrorsText}
        </li>
        <li>
          <strong>{legal?.noRelianceTitle}</strong> {legal?.noRelianceText}
        </li>
      </ul>

      <h2>{legal?.licenseTitle}</h2>
      <p>{legal?.licenseText}</p>

      <h2>{legal?.userDataTitle}</h2>
      <p>{legal?.userDataText}</p>
      <ul>
        <li>
          <strong>{legal?.dataControllerTitle}</strong>{' '}
          {legal?.dataControllerText}
        </li>
        <li>
          <strong>{legal?.dataLossTitle}</strong> {legal?.dataLossText}
        </li>
      </ul>

      <h2>{legal?.liabilityTitle}</h2>
      <p>
        <strong>{legal?.liabilityText}</strong>
      </p>
      <p>{legal?.liabilityIncludes}</p>
      <ol>
        <li>
          <strong>{legal?.directDamagesTitle}</strong>{' '}
          {legal?.directDamagesText}
        </li>
        <li>
          <strong>{legal?.financialDiscrepanciesTitle}</strong>{' '}
          {legal?.financialDiscrepanciesText}
        </li>
        <li>
          <strong>{legal?.bugsTitle}</strong> {legal?.bugsText}
        </li>
      </ol>
      <p className='font-semibold'>{legal?.soleRemedy}</p>

      <h2>{legal?.asIsTitle}</h2>
      <p>{legal?.asIsText}</p>
      <p>{legal?.noGuarantee}</p>
      <ul>
        <li>{legal?.requirementsGuarantee}</li>
        <li>{legal?.uninterruptedGuarantee}</li>
        <li>{legal?.resultsGuarantee}</li>
      </ul>

      <h2>{legal?.indemnificationTitle}</h2>
      <p>{legal?.indemnificationText}</p>

      <h2>{legal?.governingLawTitle}</h2>
      <p>{legal?.governingLawText}</p>

      <div className='mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800'>
        <p className='mb-0 text-center font-medium text-gray-700 dark:text-gray-300'>
          {legal?.acknowledgement}
        </p>
      </div>
    </>
  );
};

export default TermsOfUseContent;
