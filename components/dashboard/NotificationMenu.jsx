'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertCircle,
  Bell,
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCheck,
  Dumbbell,
  FileCheck2,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCcw,
  UserPlus,
  Wallet,
} from 'lucide-react';

const TYPE_ICONS = {
  LEAD_NEW: UserPlus,
  STUDENT_PENDING: GraduationCap,
  TRANSACTION_PENDING: Wallet,
  SUBSCRIPTION_EXPIRING: CalendarClock,
  REPORT_DRAFT: FileText,
  REPORT_PUBLISHED: FileCheck2,
  PRIVATE_BOOKING: CalendarDays,
  COACH_CLASS_TODAY: Dumbbell,
  SYSTEM: AlertCircle,
};

const fullDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatBadge(count) {
  return count > 99 ? '99+' : String(count);
}

function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return `${fullDateFormatter.format(date)} WIB`;
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4" aria-label="Memuat notifikasi">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-start gap-3">
          <span className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-slate-100" />
          <span className="min-w-0 flex-1 space-y-2 pt-1">
            <span className="block h-3 w-4/5 animate-pulse rounded bg-slate-100" />
            <span className="block h-2.5 w-3/5 animate-pulse rounded bg-slate-100" />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NotificationMenu({
  notifications,
  unreadCount,
  isLoading,
  isRefreshing,
  isMarkingAll,
  error,
  refresh,
  markAllAsRead,
  onNotificationClick,
}) {
  const pathname = usePathname();
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);

    if (next && !isLoading) {
      void refresh({ silent: true });
    }
  };

  const handleItemClick = (notification) => {
    onNotificationClick(notification);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={
          unreadCount > 0
            ? `Notifikasi, ${unreadCount} belum dibaca`
            : 'Notifikasi'
        }
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
          isOpen
            ? 'border-blue-200 bg-blue-50 text-[#0066CC]'
            : 'border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0066CC]'
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {formatBadge(unreadCount)}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Daftar notifikasi"
          className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,25rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">Notifikasi</p>
              <p className="text-xs text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} belum dibaca`
                  : 'Semua notifikasi sudah dibaca'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => refresh({ silent: true })}
              disabled={isLoading || isRefreshing}
              aria-label="Muat ulang notifikasi"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-blue-50 hover:text-[#0066CC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || isMarkingAll || isLoading}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-[#0066CC] transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              {isMarkingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Tandai dibaca
            </button>
          </div>

          {error ? (
            <div className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => refresh()}
                className="shrink-0 font-bold underline underline-offset-2"
              >
                Coba lagi
              </button>
            </div>
          ) : null}

          {isLoading && notifications.length === 0 ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-[#0066CC]">
                <BellRing className="h-7 w-7" />
              </span>
              <p className="mt-4 text-sm font-bold text-slate-800">
                Tidak ada notifikasi
              </p>
              <p className="mx-auto mt-1 max-w-64 text-xs leading-relaxed text-slate-500">
                Hal yang perlu ditindaklanjuti akan muncul di sini secara otomatis.
              </p>
            </div>
          ) : (
            <ul className="max-h-[min(68vh,30rem)] divide-y divide-slate-100 overflow-y-auto">
              {notifications.map((notification) => {
                const Icon = TYPE_ICONS[notification.type] ?? Bell;

                return (
                  <li key={notification.key}>
                    <Link
                      href={notification.href}
                      role="menuitem"
                      onClick={() => handleItemClick(notification)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-blue-50/70',
                        !notification.isRead && 'bg-blue-50/50'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                          notification.isRead
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-snug text-slate-800">
                          {notification.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                          {notification.description}
                        </span>
                        <span className="mt-1.5 block text-[11px] font-medium text-slate-400">
                          {formatNotificationTime(notification.occurredAt)}
                        </span>
                      </span>

                      {!notification.isRead ? (
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0066CC]" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
