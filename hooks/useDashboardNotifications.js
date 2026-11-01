'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  fetchDashboardNotifications,
  markDashboardNotificationsRead,
} from '@/lib/dashboard/dashboardClient';

const REFRESH_INTERVAL_MS = 60_000;

export default function useDashboardNotifications({
  initialLeadCount = 0,
} = {}) {
  const pathname = usePathname();
  const abortRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [leadCount, setLeadCount] = useState(
    Number.isFinite(initialLeadCount) ? initialLeadCount : 0
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await fetchDashboardNotifications(controller.signal);
      if (controller.signal.aborted) return;

      setNotifications(
        Array.isArray(data?.notifications) ? data.notifications : []
      );
      setUnreadCount(
        Number.isFinite(data?.unreadCount) ? data.unreadCount : 0
      );
      setLeadCount(Number.isFinite(data?.newLeadCount) ? data.newLeadCount : 0);
      setError(null);
    } catch (fetchError) {
      if (controller.signal.aborted || fetchError?.name === 'AbortError') {
        return;
      }

      setError(
        fetchError?.message ??
          'Notifikasi gagal dimuat. Periksa koneksi lalu coba lagi.'
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh({ silent: true });
      }
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const markAsRead = useCallback(
    async (keys) => {
      const requestedKeys = [...new Set(keys ?? [])].filter(Boolean);
      const unreadKeys = notifications
        .filter(
          (notification) =>
            !notification.isRead && requestedKeys.includes(notification.key)
        )
        .map((notification) => notification.key);

      if (unreadKeys.length === 0) return;

      const previousNotifications = notifications;
      const previousUnreadCount = unreadCount;

      setNotifications((current) =>
        current.map((notification) =>
          unreadKeys.includes(notification.key)
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((current) =>
        Math.max(0, current - unreadKeys.length)
      );

      try {
        await markDashboardNotificationsRead(unreadKeys);
        setError(null);
      } catch (markError) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
        setError(
          markError?.message ??
            'Status dibaca gagal disimpan. Silakan coba lagi.'
        );
      }
    },
    [notifications, unreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadKeys = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.key);

    if (unreadKeys.length === 0) return;

    setIsMarkingAll(true);
    try {
      await markAsRead(unreadKeys);
    } finally {
      setIsMarkingAll(false);
    }
  }, [markAsRead, notifications]);

  const onNotificationClick = useCallback(
    (notification) => {
      if (notification && !notification.isRead) {
        void markAsRead([notification.key]);
      }
    },
    [markAsRead]
  );

  return {
    notifications,
    unreadCount,
    leadCount,
    isLoading,
    isRefreshing,
    isMarkingAll,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    onNotificationClick,
  };
}
