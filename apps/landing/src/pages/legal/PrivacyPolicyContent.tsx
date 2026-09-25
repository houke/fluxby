import { useLanguage } from '../../contexts/LanguageContext';

const PrivacyPolicyContent = () => {
  const { t } = useLanguage();
  const legal = t.legal?.privacy;

  return (
    <>
      <p className='text-sm text-gray-500 dark:text-gray-500'>
        <strong>{legal?.lastUpdated}</strong> {legal?.lastUpdatedDate}
      </p>

      <h2>{legal?.introTitle}</h2>
      <p>{legal?.introText}</p>
      <p>{legal?.introPhilosophy}</p>

      <h2>{legal?.localFirstTitle}</h2>
      <p>
        <strong>{legal?.localFirstSubtitle}</strong>
      </p>
      <p>{legal?.localFirstText}</p>
      <ul>
        <li>
          <strong>{legal?.noCloudTitle}</strong> {legal?.noCloudText}
        </li>
        <li>
          <strong>{legal?.noAccountsTitle}</strong> {legal?.noAccountsText}
        </li>
        <li>
          <strong>{legal?.noAITitle}</strong> {legal?.noAIText}
        </li>
      </ul>

      <h2>{legal?.dataAccessTitle}</h2>
      <p>{legal?.dataAccessText}</p>

      <h3>{legal?.transactionDataTitle}</h3>
      <p>{legal?.transactionDataText}</p>

      <h3>{legal?.localStorageTitle}</h3>
      <p>{legal?.localStorageText}</p>

      <h2>{legal?.aiDisclosureTitle}</h2>
      <p>{legal?.aiDisclosureText}</p>
      <p>{legal?.aiDisclosureDetails}</p>

      <h2>{legal?.securityTitle}</h2>
      <p>{legal?.securityText}</p>
      <ul>
        <li>
          <strong>{legal?.yourResponsibilityTitle}</strong>{' '}
          {legal?.yourResponsibilityText}
        </li>
        <li>
          <strong>{legal?.backupsTitle}</strong> {legal?.backupsText}
        </li>
      </ul>

      <h2>{legal?.thirdPartyTitle}</h2>
      <p>{legal?.thirdPartyText}</p>
      <p>{legal?.thirdPartyOS}</p>

      <h2>{legal?.changesTitle}</h2>
      <p>{legal?.changesText}</p>

      <h2>{legal?.contactTitle}</h2>
      <p>
        {legal?.contactText}{' '}
        <a
          href='https://github.com/houke'
          target='_blank'
          rel='noopener noreferrer'
          className='text-fluxby-purple hover:underline'
        >
          {legal?.contactGithub}
        </a>
      </p>
    </>
  );
};

export default PrivacyPolicyContent;
