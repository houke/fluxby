import { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ExternalLink, Download, Copy, Check, FolderOpen } from 'lucide-react';

export default function DocsOpenAPI() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [spec, setSpec] = useState<object | null>(null);

  useEffect(() => {
    fetch('/openapi.json')
      .then((res) => res.json())
      .then(setSpec)
      .catch(() => setSpec(null));
  }, []);

  const handleCopy = () => {
    if (spec) {
      navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (spec) {
      const blob = new Blob([JSON.stringify(spec, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fluxby-openapi.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.openapi.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.openapi.subtitle}
      </p>

      <div className='not-prose mt-8 flex flex-wrap gap-4'>
        <button
          onClick={handleDownload}
          disabled={!spec}
          className='inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50'
        >
          <Download className='h-4 w-4' />
          {t.docs.openapi.download}
        </button>

        <button
          onClick={handleCopy}
          disabled={!spec}
          className='inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        >
          {copied ? (
            <>
              <Check className='h-4 w-4 text-green-600' />
              {t.common.copied}
            </>
          ) : (
            <>
              <Copy className='h-4 w-4' />
              {t.docs.openapi.copy}
            </>
          )}
        </button>

        <a
          href='https://editor.swagger.io/'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        >
          <ExternalLink className='h-4 w-4' />
          {t.docs.openapi.openInSwagger}
        </a>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.openapi.howToUse}
      </h2>

      <div className='mt-6 space-y-6'>
        <div className='rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
          <h3 className='mt-0 mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
            {t.docs.openapi.withSwagger}
          </h3>
          <ol className='mb-0 list-decimal space-y-2 pl-5 text-gray-600 dark:text-gray-400'>
            <li>{t.docs.openapi.swaggerStep1}</li>
            <li>{t.docs.openapi.swaggerStep2}</li>
            <li>{t.docs.openapi.swaggerStep3}</li>
            <li>{t.docs.openapi.swaggerStep4}</li>
          </ol>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
          <h3 className='mt-0 mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
            {t.docs.openapi.withPostman}
          </h3>
          <ol className='mb-0 list-decimal space-y-2 pl-5 text-gray-600 dark:text-gray-400'>
            <li>{t.docs.openapi.postmanStep1}</li>
            <li>{t.docs.openapi.postmanStep2}</li>
            <li>{t.docs.openapi.postmanStep3}</li>
            <li>{t.docs.openapi.postmanStep4}</li>
          </ol>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
          <h3 className='mt-0 mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
            {t.docs.openapi.withCode}
          </h3>
          <p className='mb-4 text-gray-600 dark:text-gray-400'>
            {t.docs.openapi.codeDescription}
          </p>
          <pre className='overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100'>
            <code>
              {`# Using OpenAPI Generator
npx @openapitools/openapi-generator-cli generate \\
  -i fluxby-openapi.json \\
  -g typescript-fetch \\
  -o ./generated-api`}
            </code>
          </pre>
        </div>

        <div className='rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-700 dark:bg-purple-900/20'>
          <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
            <FolderOpen className='h-5 w-5 text-purple-600' />
            {t.docs.openapi.withBruno}
          </h3>
          <p className='mb-4 text-gray-600 dark:text-gray-400'>
            {t.docs.openapi.brunoDescription}
          </p>
          <ol className='mb-4 list-decimal space-y-2 pl-5 text-gray-600 dark:text-gray-400'>
            <li>{t.docs.openapi.brunoStep1}</li>
            <li>{t.docs.openapi.brunoStep2}</li>
            <li>{t.docs.openapi.brunoStep3}</li>
            <li>{t.docs.openapi.brunoStep4}</li>
          </ol>
          <div className='flex flex-wrap gap-3'>
            <a
              href='https://www.usebruno.com/'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700'
            >
              <Download className='h-4 w-4' />
              {t.docs.openapi.downloadBruno}
            </a>
            <a
              href='https://github.com/houke/fluxby/tree/main/apps/api/bruno'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            >
              <ExternalLink className='h-4 w-4' />
              {t.docs.openapi.viewCollection}
            </a>
          </div>
        </div>
      </div>

      {spec && (
        <>
          <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
            {t.docs.openapi.specPreview}
          </h2>
          <pre className='mt-6 max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100'>
            <code>{JSON.stringify(spec, null, 2)}</code>
          </pre>
        </>
      )}
    </article>
  );
}
