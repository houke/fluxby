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
  ExternalLink,
  HelpCircle,
  Code,
  Users,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>{t.help.title}</h1>
        <p className='mt-1 text-muted-foreground'>{t.help.subtitle}</p>
      </div>

      {/* Features Overview */}
      <Card data-onboarding='help-features'>
        <CardHeader>
          <CardTitle>{t.help.features}</CardTitle>
          <CardDescription>{t.help.featuresDescription}</CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* Quick Start */}
      <Card data-onboarding='help-quickstart'>
        <CardHeader>
          <CardTitle>{t.help.quickStart}</CardTitle>
          <CardDescription>{t.help.quickStartDescription}</CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* FAQ */}
      <Card data-onboarding='help-faq'>
        <CardHeader>
          <CardTitle>{t.help.faq}</CardTitle>
        </CardHeader>
        <CardContent>
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

      {/* External Links */}
      <Card data-onboarding='help-external-links'>
        <CardHeader>
          <CardTitle>{t.help.externalLinks}</CardTitle>
          <CardDescription>{t.help.externalLinksDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <a
              href='https://fluxby.app/help'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50'
            >
              <HelpCircle className='h-4 w-4 text-primary' />
              {t.help.helpCenterLink}
              <ExternalLink className='h-3.5 w-3.5 text-muted-foreground' />
            </a>
            <a
              href='https://fluxby.app/docs'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50'
            >
              <Code className='h-4 w-4 text-primary' />
              {t.help.developerDocsLink}
              <ExternalLink className='h-3.5 w-3.5 text-muted-foreground' />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
