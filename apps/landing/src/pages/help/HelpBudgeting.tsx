import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpBudgeting() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.budgeting?.title || 'Een maandelijks budget maken'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.budgeting?.subtitle ||
          'Stel uitgavenlimieten in en volg je voortgang met visuele budgetten.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.budgeting?.whatIsTitle || 'Wat is een budget?'}
      </h2>
      <p>
        {t.helpCenter?.budgeting?.whatIsText ||
          'Een budget in Fluxby is een uitgavenlimiet die je instelt voor een specifieke categorie of je totale maandelijkse uitgaven. Terwijl je transacties doet, houdt Fluxby automatisch je uitgaven bij ten opzichte van deze limieten.'}
      </p>

      <HelpAnimation type='budget' />

      <h2>
        {t.helpCenter?.budgeting?.createTitle || 'Je eerste budget maken'}
      </h2>
      <ol>
        <li>
          {t.helpCenter?.budgeting?.step1 ||
            'Navigeer naar de Budgetten pagina via de zijbalk'}
        </li>
        <li>
          {t.helpCenter?.budgeting?.step2 ||
            'Klik op "Nieuw budget" om het aanmaakscherm te openen'}
        </li>
        <li>
          {t.helpCenter?.budgeting?.step3 ||
            'Selecteer een categorie (of laat leeg voor een totaal budget)'}
        </li>
        <li>
          {t.helpCenter?.budgeting?.step4 ||
            'Voer je budgetbedrag in en selecteer de periode'}
        </li>
        <li>
          {t.helpCenter?.budgeting?.step5 ||
            'Klik op Opslaan om je budget te maken'}
        </li>
      </ol>

      <h2>{t.helpCenter?.budgeting?.typesTitle || 'Budget types'}</h2>

      <h3>
        {t.helpCenter?.budgeting?.categoryBudgetTitle || 'Categorie budgetten'}
      </h3>
      <p>
        {t.helpCenter?.budgeting?.categoryBudgetText ||
          'Stel een limiet in voor een specifieke categorie zoals Boodschappen, Entertainment of Vervoer. Dit helpt je om uitgaven in specifieke gebieden te beheersen.'}
      </p>

      <h3>{t.helpCenter?.budgeting?.totalBudgetTitle || 'Totaal budget'}</h3>
      <p>
        {t.helpCenter?.budgeting?.totalBudgetText ||
          'Stel een algemene maandelijkse uitgavenlimiet in over alle categorieën. Dit geeft je een overzicht van je totale uitgaven.'}
      </p>

      <div className='not-prose rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>✅</span>
          {t.helpCenter?.budgeting?.bestPracticeTitle || 'Best practice'}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.budgeting?.bestPracticeText ||
            'Begin met een totaal budget gebaseerd op je typische maandelijkse uitgaven, voeg dan categorie-specifieke budgetten toe voor gebieden waar je wilt bezuinigen.'}
        </p>
      </div>

      <h2>{t.helpCenter?.budgeting?.trackingTitle || 'Je voortgang volgen'}</h2>
      <p>
        {t.helpCenter?.budgeting?.trackingText ||
          'De budget kaarten tonen je uitgaven voortgang in realtime. De circulaire voortgangsindicator vult zich naarmate je je limiet nadert, veranderend van kleur van groen naar geel naar rood.'}
      </p>

      <HelpAnimation type='budget' />
    </article>
  );
}
