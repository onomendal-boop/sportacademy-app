import {
  LayoutDashboard,
  Database,
  Briefcase,
  Dumbbell,
  GraduationCap,
  MapPin,
  CalendarDays,
  CalendarRange,
  Sprout,
  TrendingUp,
  Trophy,
  User,
  FileText,
  Wallet,
  Receipt,
  Package,
  ClipboardList,
  Megaphone,
  Target,
  Newspaper,
  Filter,
  Settings,
  SlidersHorizontal,
  Landmark,
  BellRing,
  HardDrive,
  CircleUserRound,
} from 'lucide-react';
import { canAccessFeature } from '@/lib/auth/permissions';

// Konfigurasi dan helper navigasi dashboard dipisahkan dari komponen tampilan.
// Setiap item memiliki `feature` yang dipetakan ke matriks role di
// lib/auth/permissions.js; menu untuk role yang tidak berhak disembunyikan
// melalui filterMenuByRole().
export const menuItems = [
  {
    label: 'Ringkasan',
    href: '/dashboard',
    icon: LayoutDashboard,
    feature: 'dashboard',
  },
  {
    label: 'Data Master',
    icon: Database,
    children: [
      { label: 'Staff', href: '/dashboard/data-master/staff', icon: Briefcase, feature: 'dataMasterStaff' },
      { label: 'Pelatih', href: '/dashboard/data-master/pelatih', icon: Dumbbell, feature: 'dataMasterCoaches' },
      { label: 'Siswa', href: '/dashboard/students', icon: GraduationCap, feature: 'dataMasterStudents' },
      { label: 'Tempat Latihan', href: '/dashboard/data-master/tempat-latihan', icon: MapPin, feature: 'dataMasterVenues' },
    ],
  },
  {
    label: 'Operasional',
    icon: CalendarDays,
    children: [
      { label: 'Jadwal Keseluruhan', href: '/dashboard/operasional/jadwal', icon: CalendarRange, feature: 'operationalOverview' },
      { label: 'Pemula (AAA)', href: '/dashboard/schedule/aaa', icon: Sprout, feature: 'scheduleLevels' },
      { label: 'Menengah (A3)', href: '/dashboard/schedule/a3', icon: TrendingUp, feature: 'scheduleLevels' },
      { label: 'Atlet (SWDC)', href: '/dashboard/schedule/swdc', icon: Trophy, feature: 'scheduleLevels' },
      { label: 'Private', href: '/dashboard/schedule/private', icon: User, feature: 'scheduleLevels' },
      { label: 'Raport Siswa', href: '/dashboard/operasional/raport', icon: FileText, feature: 'studentReports' },
    ],
  },
  {
    label: 'Finance',
    icon: Wallet,
    children: [
      { label: 'Transaksi', href: '/dashboard/finance?tab=transactions', icon: Receipt, feature: 'finance' },
      { label: 'Langganan / Paket', href: '/dashboard/finance?tab=subscriptions', icon: Package, feature: 'finance' },
      { label: 'Laporan', href: '/dashboard/finance?tab=reports', icon: ClipboardList, feature: 'finance' },
    ],
  },
  {
    label: 'Paket Saya',
    href: '/dashboard/my-package',
    icon: Package,
    feature: 'myPackage',
  },
  {
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { label: 'Campaign Manager', href: '/dashboard/marketing/campaign', icon: Target, feature: 'marketing' },
      { label: 'Content Hub', href: '/dashboard/marketing/content', icon: Newspaper, feature: 'marketing' },
      { label: 'Leads / Funnel', href: '/dashboard/marketing/leads', icon: Filter, badge: '12', feature: 'marketing' },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'Profil & Keamanan', href: '/dashboard/settings?tab=profile', icon: CircleUserRound, feature: 'settingsProfile' },
      { label: 'General', href: '/dashboard/settings?tab=general', icon: SlidersHorizontal, feature: 'settingsSystem' },
      { label: 'Financial Rules', href: '/dashboard/settings?tab=financial', icon: Landmark, feature: 'settingsSystem' },
      { label: 'Notification Templates', href: '/dashboard/settings?tab=notifications', icon: BellRing, feature: 'settingsSystem' },
      { label: 'Backup', href: '/dashboard/settings?tab=backup', icon: HardDrive, feature: 'settingsSystem' },
    ],
  },
];

/**
 * Saring menu sesuai role user yang login. Grup yang seluruh anaknya
 * tersembunyi ikut dihilangkan. Item tanpa `feature` selalu tampil.
 */
export function filterMenuByRole(items, role) {
  return items
    .map((item) => {
      if (item.children) {
        const children = item.children.filter(
          (child) => !child.feature || canAccessFeature(role, child.feature)
        );

        return children.length > 0 ? { ...item, children } : null;
      }

      return !item.feature || canAccessFeature(role, item.feature)
        ? item
        : null;
    })
    .filter(Boolean);
}

export function isActivePath(pathname, href) {
  if (!href) return false;

  const cleanHref = href.split('?')[0];
  if (cleanHref === '/dashboard') return pathname === cleanHref;
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

export function hasActiveChild(pathname, item) {
  return item.children?.some((child) => isActivePath(pathname, child.href));
}

export function getInitialOpenMenus(pathname) {
  const initialState = {};

  menuItems.forEach((item) => {
    if (item.children && hasActiveChild(pathname, item)) {
      initialState[item.label] = true;
    }
  });

  return initialState;
}

export function getPageTitle(pathname) {
  for (const item of menuItems) {
    if (item.href && isActivePath(pathname, item.href)) return item.label;

    const activeChild = item.children?.find((child) => isActivePath(pathname, child.href));
    if (activeChild) return activeChild.label;
  }

  return 'Dashboard';
}
