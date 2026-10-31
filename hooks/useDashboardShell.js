'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getInitialOpenMenus,
  getPageTitle,
} from '@/components/dashboard/dashboardMenu';
import { logoutRequest } from '@/lib/auth/authClient';

/**
 * Semua state dan fungsi interaktif dashboard berada di hook ini:
 * sidebar mobile, submenu, dropdown profil, judul halaman, dan logout.
 * DashboardShell.jsx hanya menampilkan UI berdasarkan nilai dari hook.
 */
export default function useDashboardShell() {
  const pathname = usePathname() ?? '/dashboard';
  const router = useRouter();
  const profileRef = useRef(null);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openMenus, setOpenMenus] = useState(() => getInitialOpenMenus(pathname));

  const pageTitle = getPageTitle(pathname);

  // Selalu buka parent menu dari halaman aktif saat route berubah.
  useEffect(() => {
    setOpenMenus((prev) => ({ ...prev, ...getInitialOpenMenus(pathname) }));
    setIsMobileSidebarOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  // Kunci scroll body saat sidebar mobile terbuka.
  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  // Tutup dropdown profil saat klik di luar area atau menekan Escape.
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsMobileSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleToggleMenu(label) {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const success = await logoutRequest();

    if (!success) {
      setIsLoggingOut(false);
      toast.error('Logout gagal. Periksa koneksi lalu coba lagi.');
      return;
    }

    setIsProfileOpen(false);
    setIsMobileSidebarOpen(false);
    toast.success('Logout berhasil. Sampai jumpa!');

    // Cookie sudah dihapus server. Refresh memastikan guard dashboard
    // membaca state session terbaru apabila user menekan tombol Back.
    router.replace('/login');
    router.refresh();
  }

  return {
    pathname,
    pageTitle,
    profileRef,
    isMobileSidebarOpen,
    isProfileOpen,
    isLoggingOut,
    openMenus,
    onOpenMobileSidebar: () => setIsMobileSidebarOpen(true),
    onCloseMobileSidebar: () => setIsMobileSidebarOpen(false),
    onToggleProfile: () => setIsProfileOpen((current) => !current),
    onToggleMenu: handleToggleMenu,
    onLogout: handleLogout,
  };
}
