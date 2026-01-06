interface PlaceholderProps {
  title: string;
  instruction: string;
  height?: string;
}

export default function ScreenshotPlaceholder({
  title,
  instruction,
  height = '300px',
}: PlaceholderProps) {
  return (
    <div
      className='my-6 flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-gray-600 dark:bg-gray-800'
      style={{ minHeight: height }}
    >
      <div className='mb-2 text-4xl'>📷</div>
      <h4 className='m-0 text-lg font-bold text-gray-700 dark:text-gray-200'>
        {title}
      </h4>
      <p className='mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400'>
        <span className='mb-1 block text-xs font-semibold tracking-wider text-red-500 uppercase dark:text-red-400'>
          Missing Asset
        </span>
        {instruction}
      </p>
    </div>
  );
}
