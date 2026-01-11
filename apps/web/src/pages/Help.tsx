import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Upload,
  PieChart,
  Target,
  Tags,
  Wallet,
  ArrowLeftRight,
  HelpCircle,
  Code,
  Users,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/layout/PageHeader';

export default function Help() {
  const { t } = useLanguage();
  useDocumentTitle(t.help.title);

  const featureIcons = [
    Upload,
    ArrowLeftRight,
    PieChart,
    Target,
    Tags,
    Wallet,
    Users,
  ];

  return (
    <div className='space-y-0 sm:space-y-6'>
      <PageHeader
        title={t.help.title}
        subtitle={t.help.subtitle}
        dataOnboarding='help-greeting'
      />

      {/* Features Overview */}
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='help-features'
        >
          <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
            <CardTitle className='text-base sm:text-lg'>
              {t.help.features}
            </CardTitle>
            <CardDescription className='text-xs sm:text-sm'>
              {t.help.featuresDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {t.help.featureList.map((feature, index) => {
                const Icon = featureIcons[index];
                return (
                  <div
                    key={feature.title}
                    className='flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50'
                  >
                    <div className='h-fit rounded-lg bg-primary/10 p-2 text-primary'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <div>
                      <h3 className='font-medium'>{feature.title}</h3>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start */}
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='help-quickstart'
        >
          <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
            <CardTitle className='text-base sm:text-lg'>
              {t.help.quickStart}
            </CardTitle>
            <CardDescription className='text-xs sm:text-sm'>
              {t.help.quickStartDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
            <div className='space-y-6'>
              {t.help.steps.map((step, index) => (
                <div key={index} className='flex gap-4'>
                  <div className='flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground'>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className='font-medium'>{step.title}</h3>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='help-faq'
        >
          <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
            <CardTitle className='text-base sm:text-lg'>{t.help.faq}</CardTitle>
          </CardHeader>
          <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
            <Accordion type='single' collapsible className='w-full'>
              {t.help.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className='text-left'>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className='text-muted-foreground'>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* External Links */}
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='help-external-links'
        >
          <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
            <CardTitle className='text-base sm:text-lg'>
              {t.help.externalLinks}
            </CardTitle>
            <CardDescription className='text-xs sm:text-sm'>
              {t.help.externalLinksDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <a
                href='/help'
                className='inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50'
              >
                <HelpCircle className='h-4 w-4 text-primary' />
                {t.help.helpCenterLink}
              </a>
              <a
                href='/docs'
                className='inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50'
              >
                <Code className='h-4 w-4 text-primary' />
                {t.help.developerDocsLink}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
