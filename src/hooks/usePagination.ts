import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  offset: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (pageNum: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export const usePagination = (options: UsePaginationOptions = {}): UsePaginationReturn => {
  const { initialPage = 1, pageSize: initialPageSize = 10 } = options;
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const offset = (page - 1) * pageSize;
  const hasNextPage = true;
  const hasPreviousPage = page > 1;

  const nextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const previousPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const goToPage = useCallback((pageNum: number) => {
    setPage(Math.max(1, pageNum));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    offset,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    reset,
  };
};

export default usePagination;
