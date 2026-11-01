'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  Dumbbell,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Package,
  Receipt,
  Search,
} from 'lucide-react';
import useGlobalSearch from '@/hooks/useGlobalSearch';

const TYPE_ICONS = {
  STUDENT: GraduationCap,
  STAFF: Briefcase,
  COACH: Dumbbell,
  VENUE: MapPin,
  SCHEDULE: CalendarDays,
  REPORT: FileText,
  PACKAGE: Package,
  SUBSCRIPTION: Package,
  TRANSACTION: Receipt,
};

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function SearchResults({ search, idPrefix, onSelect, className = '' }) {
  if (!search.isOpen || search.trimmedQuery.length === 0) return null;

  let flatIndex = -1;

  return (
    <div
      id={`${idPrefix}-listbox`}
      role="listbox"
      aria-label="Hasil pencarian dashboard"
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10',
        className
      )}
    >
      {search.trimmedQuery.length < 2 ? (
        <div className="px-4 py-5 text-center text-sm text-slate-500">
          Ketik minimal 2 karakter untuk mulai mencari.
        </div>
      ) : search.isLoading && search.totalResults === 0 ? (
        <div className="space-y-3 px-4 py-4" aria-label="Memuat hasil pencarian">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-slate-100" />
              <span className="min-w-0 flex-1 space-y-2">
                <span className="block h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                <span className="block h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
              </span>
            </div>
          ))}
        </div>
      ) : search.error ? (
        <div className="flex items-start gap-3 px-4 py-4 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{search.error}</span>
        </div>
      ) : search.totalResults === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Tidak ada hasil untuk “{search.trimmedQuery}”
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Coba nama siswa, pelatih, jadwal, paket, atau nomor invoice lain.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[min(65vh,28rem)] overflow-y-auto py-2">
            {search.groups.map((group) => (
              <div key={group.key} className="py-1">
                <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {group.label}
                </p>
                <ul>
                  {group.items.map((item) => {
                    flatIndex += 1;
                    const currentIndex = flatIndex;
                    const Icon = TYPE_ICONS[item.type] ?? Search;
                    const isActive = search.activeIndex === currentIndex;

                    return (
                      <li key={item.id}>
                        <button
                          id={`${idPrefix}-option-${currentIndex}`}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() =>
                            search.setActiveIndex(currentIndex)
                          }
                          onMouseDown={(event) => {
                            event.preventDefault();
                            onSelect(item);
                          }}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            isActive
                              ? 'bg-blue-50 text-[#0066CC]'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              isActive
                                ? 'bg-[#0066CC] text-white'
                                : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {item.title}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {item.subtitle}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-medium text-slate-500">
            <span>{search.totalResults} hasil</span>
            <span className="hidden lg:inline">Enter untuk membuka</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function GlobalSearch() {
  const search = useGlobalSearch();
  const pathname = usePathname();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const reactId = useId().replace(/:/g, '');
  const searchId = `dashboard-search-${reactId}`;
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        search.close();
        setIsExpanded(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [search.close]);

  const collapse = () => {
    search.close();
    setIsExpanded(false);
    inputRef.current?.blur();
  };

  const handleSelect = (item) => {
    setIsExpanded(false);
    search.selectResult(item);
  };

  const handleFocus = () => {
    setIsExpanded(true);
    search.onFocus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsExpanded(false);
    }

    search.onKeyDown(event);
  };

  return (
    <div
      ref={rootRef}
      className="relative h-10 w-10 shrink-0 lg:w-64 xl:w-80"
    >
      <div
        className={cn(
          'absolute right-0 top-0 z-50 transition-[width] duration-300 ease-in-out lg:relative lg:z-auto lg:w-full',
          isExpanded
            ? 'w-[min(24rem,calc(100vw_-_9.5rem))]'
            : 'w-10'
        )}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            id={searchId}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            role="combobox"
            aria-label="Pencarian dashboard"
            aria-expanded={search.isOpen}
            aria-controls={`${searchId}-listbox`}
            aria-activedescendant={
              search.activeIndex >= 0
                ? `${searchId}-option-${search.activeIndex}`
                : undefined
            }
            autoComplete="off"
            value={search.query}
            onChange={(event) => search.onQueryChange(event.target.value)}
            onFocus={handleFocus}
            onClick={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder="Cari siswa, pelatih, jadwal, invoice..."
            className={cn(
              'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm outline-none transition focus:border-[#0066CC] focus:bg-white focus:ring-4 focus:ring-blue-600/10 [&::-webkit-search-cancel-button]:hidden',
              isExpanded
                ? 'text-slate-900 placeholder:text-slate-400'
                : 'cursor-pointer text-transparent caret-transparent placeholder:text-transparent lg:cursor-text lg:text-slate-900 lg:caret-auto lg:placeholder:text-slate-400'
            )}
          />

          {search.isLoading ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#0066CC]" />
          ) : null}
        </div>

        <SearchResults
          search={search}
          idPrefix={searchId}
          onSelect={handleSelect}
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(24rem,calc(100vw_-_9.5rem))] lg:w-[min(30rem,calc(100vw_-_2rem))]"
        />
      </div>
    </div>
  );
}
