'use client';

import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  CircleUserRound,
  Loader2,
  LogOut,
  Menu,
  Search,
  Settings,
  Waves,
  X,
} from 'lucide-react';
import useDashboardShell from '@/hooks/useDashboardShell';
import {
  filterMenuByRole,
  hasActiveChild,
  isActivePath,
  menuItems,
} from './dashboardMenu';

const ROLE_LABELS = {
  SUPERADMIN: 'Superadmin',
  OWNER: 'Owner',
  ADMIN: 'Admin',
  COACH: 'Coach',
  STUDENT: 'Student',
};

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getInitials(name = '') {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || 'AA';
}

function UserAvatar({ user, className = '' }) {
  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt=""
        referrerPolicy="no-referrer"
        className={cn('h-10 w-10 shrink-0 rounded-full object-cover', className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0066CC] text-sm font-bold text-white',
        className
      )}
    >
      {getInitials(user?.name)}
    </span>
  );
}

function SidebarContent({ user, isLoggingOut, pathname, openMenus, onToggleMenu, onNavigate, onLogout }) {
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? 'User';
  // Fitur yang bukan hak role ini disembunyikan dari sidebar.
  const visibleMenuItems = filterMenuByRole(menuItems, user?.role);
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-100 px-5">
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0066CC] text-white shadow-sm shadow-blue-600/30">
            <Waves className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold leading-tight text-slate-900">
              AAA Sport Academy
            </span>
            <span className="block text-xs font-medium text-slate-500">
              Swimming Academy
            </span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Navigasi dashboard" className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Menu Utama
        </p>

        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isOpen = Boolean(openMenus[item.label]);
            const isParentActive = hasActiveChild(pathname, item);
            const isSingleActive = item.href ? isActivePath(pathname, item.href) : false;

            // Menu tanpa submenu
            if (!item.children) {
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isSingleActive ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isSingleActive
                        ? 'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25'
                        : 'text-slate-600 hover:bg-blue-50 hover:text-[#0066CC]'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            }

            // Menu dengan submenu
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => onToggleMenu(item.label)}
                  aria-expanded={isOpen}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                    isParentActive
                      ? 'bg-blue-50 text-[#0066CC]'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-[#0066CC]'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
                      isOpen && 'rotate-180 text-[#0066CC]'
                    )}
                  />
                </button>

                <div
                  className={cn(
                    'grid transition-all duration-200 ease-in-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <ul className="ml-5 space-y-1 border-l border-slate-100 py-2 pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = isActivePath(pathname, child.href);

                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onNavigate}
                              aria-current={isChildActive ? 'page' : undefined}
                              className={cn(
                                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                                isChildActive
                                  ? 'bg-blue-50 font-semibold text-[#0066CC]'
                                  : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-[#0066CC]'
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 shrink-0 rounded-full',
                                  isChildActive ? 'bg-[#0066CC]' : 'bg-slate-300'
                                )}
                              />
                              <ChildIcon className="h-4 w-4 shrink-0" strokeWidth={2} />
                              <span className="min-w-0 flex-1 truncate">{child.label}</span>

                              {child.badge ? (
                                <span className="shrink-0 rounded-full bg-[#0066CC] px-2 py-0.5 text-[11px] font-bold text-white">
                                  {child.badge}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="shrink-0 border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <UserAvatar user={user} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-900">
              {user.name}
            </span>
            <span className="block truncate text-xs text-slate-500">
              {roleLabel} &bull; @{user.username}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {isLoggingOut ? 'Logout...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}

/**
 * Komponen tampilan dashboard.
 * State dan fungsi interaktif berasal dari useDashboardShell.
 * User berasal dari auth guard Server Component, bukan mock client.
 */
export default function DashboardShell({ user, children }) {
  const {
    pathname,
    pageTitle,
    profileRef,
    isMobileSidebarOpen,
    isProfileOpen,
    isLoggingOut,
    openMenus,
    onOpenMobileSidebar,
    onCloseMobileSidebar,
    onToggleProfile,
    onToggleMenu,
    onLogout,
  } = useDashboardShell();

  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? 'User';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <SidebarContent
          user={user}
          isLoggingOut={isLoggingOut}
          pathname={pathname}
          openMenus={openMenus}
          onToggleMenu={onToggleMenu}
          onNavigate={() => {}}
          onLogout={onLogout}
        />
      </aside>

      {/* Sidebar Mobile */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', !isMobileSidebarOpen && 'pointer-events-none')}>
        {/* Backdrop */}
        <div
          aria-hidden="true"
          onClick={onCloseMobileSidebar}
          className={cn(
            'absolute inset-0 bg-slate-950/50 transition-opacity duration-300',
            isMobileSidebarOpen ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Panel */}
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-in-out',
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            type="button"
            onClick={onCloseMobileSidebar}
            aria-label="Tutup menu"
            className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>

          <SidebarContent
            user={user}
            isLoggingOut={isLoggingOut}
            pathname={pathname}
            openMenus={openMenus}
            onToggleMenu={onToggleMenu}
            onNavigate={onCloseMobileSidebar}
            onLogout={onLogout}
          />
        </aside>
      </div>

      {/* Area Konten */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          {/* Tombol hamburger - hanya mobile/tablet */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Buka menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#0066CC] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Judul halaman aktif */}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
              {pageTitle}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              AAA Sport Academy &bull; Dashboard
            </p>
          </div>

          {/* Search - desktop */}
          <div className="relative hidden w-64 md:block xl:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Cari siswa, pelatih, jadwal..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:bg-white focus:ring-4 focus:ring-blue-600/10"
            />
          </div>

          {/* Notifikasi */}
          <button
            type="button"
            aria-label="Notifikasi"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#0066CC]"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* Avatar + Dropdown Profil */}
          <div ref={profileRef} className="relative shrink-0">
            <button
              type="button"
              onClick={onToggleProfile}
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-3 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-slate-50"
            >
              <UserAvatar user={user} className="ring-2 ring-blue-100" />
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-[140px] truncate text-sm font-semibold text-slate-900">
                  {user.name}
                </span>
                <span className="block text-xs font-medium text-[#0066CC]">
                  {roleLabel}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'hidden h-4 w-4 text-slate-400 transition-transform sm:block',
                  isProfileOpen && 'rotate-180'
                )}
              />
            </button>

            {isProfileOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0066CC]">
                    {roleLabel}
                  </span>
                </div>

                <div className="p-2">
                  <Link
                    href="/dashboard/settings?tab=general"
                    role="menuitem"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#0066CC]"
                  >
                    <CircleUserRound className="h-4 w-4" />
                    Profil Saya
                  </Link>
                  <Link
                    href="/dashboard/settings?tab=general"
                    role="menuitem"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#0066CC]"
                  >
                    <Settings className="h-4 w-4" />
                    Pengaturan
                  </Link>

                  <div className="my-2 border-t border-slate-100" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    {isLoggingOut ? 'Logout...' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
