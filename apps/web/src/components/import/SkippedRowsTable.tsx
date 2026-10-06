import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Currency } from '@/components/ui/currency';
import { useLanguage } from '@/contexts/LanguageContext';

interface SkippedRow {
  rowIndex: number;
  date: string;
  amount: number;
  error: string;
}

const ROWS_PER_PAGE = 20;

export function SkippedRowsTable({
  rows,
  getErrorLabel,
}: {
  rows: SkippedRow[];
  getErrorLabel: (error: string) => string;
}) {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows]);
  const lastPage = Math.max(0, Math.ceil(rows.length / ROWS_PER_PAGE) - 1);
  const currentPage = Math.min(page, lastPage);
  const start = currentPage * ROWS_PER_PAGE;
  const end = Math.min(start + ROWS_PER_PAGE, rows.length);

  if (rows.length === 0) return null;

  return (
    <div className='rounded-lg border'>
      <div className='border-b p-3 text-sm text-muted-foreground'>
        {t.import.skippedRowsDescription}
      </div>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm'>
          <thead className='bg-muted/50'>
            <tr>
              <th className='px-4 py-2 text-left font-medium'>
                {t.import.row}
              </th>
              <th className='px-4 py-2 text-left font-medium'>
                {t.import.dateColumn}
              </th>
              <th className='px-4 py-2 text-left font-medium'>
                {t.import.amountColumn}
              </th>
              <th className='px-4 py-2 text-left font-medium'>
                {t.import.reason}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(start, end).map((row, index) => (
              <tr key={start + index} className='border-t border-muted/50'>
                <td className='px-4 py-2'>{row.rowIndex}</td>
                <td className='px-4 py-2'>{row.date || '-'}</td>
                <td className='px-4 py-2'>
                  {row.amount ? <Currency amount={row.amount} /> : '-'}
                </td>
                <td className='px-4 py-2'>
                  <span className='rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive'>
                    {getErrorLabel(row.error)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lastPage > 0 && (
        <div className='flex items-center justify-between gap-2 border-t p-3'>
          <Button
            variant='outline'
            size='sm'
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            {t.common.previous}
          </Button>
          <span className='text-sm text-muted-foreground'>
            {start + 1}–{end} / {rows.length}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={currentPage === lastPage}
            onClick={() => setPage(currentPage + 1)}
          >
            {t.common.next}
          </Button>
        </div>
      )}
    </div>
  );
}
