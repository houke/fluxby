import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export default function CodeBlock({
  code,
  language = 'typescript',
  title,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900'>
      {title && (
        <div className='flex items-center justify-between border-b border-gray-700 bg-gray-800/50 px-4 py-2'>
          <span className='truncate text-sm text-gray-400'>{title}</span>
          <span className='shrink-0 rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-400'>
            {language}
          </span>
        </div>
      )}
      <div className='relative overflow-x-auto'>
        <pre className='p-4 text-sm'>
          <code className='block whitespace-pre text-gray-300'>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className='absolute top-2 right-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600'
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
