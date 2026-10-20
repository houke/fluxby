import { householdPlanningHelp } from '../../lib/i18n/household-planning-help';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpPlanning() {
  const { t, language } = useLanguage();
  const copy = t.helpCenter.planning;
  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1>{copy.title}</h1>
      <p className='text-xl'>{copy.intro}</p>
      {[...copy.sections, ...householdPlanningHelp[language]].map(
        (section: { title: string; text: string }) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        )
      )}
    </article>
  );
}
