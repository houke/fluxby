import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpWebMcp() {
  const { t } = useLanguage();
  const copy = t.webMcp.help;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1>{copy.title}</h1>
      <p className='text-xl'>{copy.intro}</p>

      <h2>{copy.requirementsTitle}</h2>
      <p>{copy.requirements}</p>

      <h2>{copy.stepsTitle}</h2>
      <ol>
        {copy.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h2>{copy.accessTitle}</h2>
      <p>{copy.access}</p>

      <h2>{copy.privacyTitle}</h2>
      <p>{copy.privacy}</p>

      <h2>{copy.limitsTitle}</h2>
      <p>{copy.limits}</p>

      <p>
        <Link to='/docs/webmcp'>{copy.developerLink}</Link>
      </p>
    </article>
  );
}
