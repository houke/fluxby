import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './button';

export const HISTORY_ROWS_PER_PAGE = 20;

export function PaginatedHistoryList<T>({
  items,
  renderItem,
  className,
  previousLabel,
  nextLabel,
  page,
  totalItems,
  onPageChange,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  className: string;
  previousLabel: string;
  nextLabel: string;
  page?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}) {
  const [localPage, setLocalPage] = useState(0);
  useEffect(() => setLocalPage(0), [items]);
  const count = totalItems ?? items.length;
  const lastPage = Math.max(0, Math.ceil(count / HISTORY_ROWS_PER_PAGE) - 1);
  const currentPage = Math.min(page ?? localPage, lastPage);
  const start = currentPage * HISTORY_ROWS_PER_PAGE;
  const end = Math.min(start + HISTORY_ROWS_PER_PAGE, count);
  const changePage = onPageChange ?? setLocalPage;
  const visibleItems = page === undefined ? items.slice(start, end) : items;

  return (
    <>
      <div className={className}>{visibleItems.map(renderItem)}</div>
      {lastPage > 0 && (
        <div className='mt-3 flex items-center justify-between gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={currentPage === 0}
            onClick={() => changePage(currentPage - 1)}
          >
            {previousLabel}
          </Button>
          <span className='text-sm text-muted-foreground'>
            {start + 1}–{end} / {count}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={currentPage === lastPage}
            onClick={() => changePage(currentPage + 1)}
          >
            {nextLabel}
          </Button>
        </div>
      )}
    </>
  );
}
