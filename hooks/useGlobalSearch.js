'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchDashboardSearch } from '@/lib/dashboard/dashboardClient';

export default function useGlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const requestRef = useRef(0);

  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = useMemo(
    () => groups.flatMap((group) => group.items ?? []),
    [groups]
  );
  const trimmedQuery = query.trim();

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const clear = useCallback(() => {
    requestRef.current += 1;
    setQuery('');
    setGroups([]);
    setError(null);
    setIsLoading(false);
    close();
  }, [close]);

  useEffect(() => {
    requestRef.current += 1;
    setQuery('');
    setGroups([]);
    setError(null);
    setIsLoading(false);
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setGroups([]);
      setError(null);
      setIsLoading(false);
      setActiveIndex(-1);
      return undefined;
    }

    const controller = new AbortController();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchDashboardSearch(
          trimmedQuery,
          controller.signal
        );

        if (controller.signal.aborted || requestRef.current !== requestId) {
          return;
        }

        const nextGroups = Array.isArray(data?.groups) ? data.groups : [];
        const total = nextGroups.reduce(
          (sum, group) => sum + (group.items?.length ?? 0),
          0
        );

        setGroups(nextGroups);
        setActiveIndex(total > 0 ? 0 : -1);
        setIsOpen(true);
      } catch (fetchError) {
        if (
          controller.signal.aborted ||
          fetchError?.name === 'AbortError' ||
          requestRef.current !== requestId
        ) {
          return;
        }

        setGroups([]);
        setActiveIndex(-1);
        setError(
          fetchError?.message ??
            'Pencarian gagal dimuat. Periksa koneksi lalu coba lagi.'
        );
        setIsOpen(true);
      } finally {
        if (!controller.signal.aborted && requestRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  const onQueryChange = useCallback((value) => {
    setQuery(value);
    setError(null);
    setIsOpen(value.trim().length > 0);
  }, []);

  const onFocus = useCallback(() => {
    if (query.trim().length > 0) setIsOpen(true);
  }, [query]);

  const selectResult = useCallback(
    (item) => {
      if (!item?.href) return;
      clear();
      router.push(item.href);
    },
    [clear, router]
  );

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (results.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((current) =>
          current < results.length - 1 ? current + 1 : 0
        );
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((current) =>
          current > 0 ? current - 1 : results.length - 1
        );
        return;
      }

      if (event.key === 'Enter') {
        const item = results[activeIndex] ?? results[0];
        if (item) {
          event.preventDefault();
          selectResult(item);
        }
      }
    },
    [activeIndex, close, results, selectResult]
  );

  return {
    query,
    trimmedQuery,
    groups,
    results,
    totalResults: results.length,
    isOpen,
    isLoading,
    error,
    activeIndex,
    setActiveIndex,
    onQueryChange,
    onFocus,
    onKeyDown,
    selectResult,
    clear,
    close,
  };
}
