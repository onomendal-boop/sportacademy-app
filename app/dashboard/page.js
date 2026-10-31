'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Dumbbell,
  ClipboardList,
  GraduationCap,
  Wallet,
  CalendarDays,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  Check,
  BellRing,
  MessageCircle,
  ArrowRight,
  Receipt,
  UserCheck,
  Waves,
} from 'lucide-react';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';

/* -------------------------------------------------------------------------- */
/* MOCK DATA                                                                  */
/* -------------------------------------------------------------------------- */

// TODO: Di production, role diambil dari session user yang login.
// Role switcher di halaman ini hanya untuk preview Phase 1 (mock data).
const mockUsersByRole = {
  admin: {
    name: 'Nadia Prasetyo',
    roleLabel: 'Admin',
    description: 'Pantau pertumbuhan siswa, pendapatan, dan member yang perlu ditindaklanjuti.',
  },
  coach: {
    name: 'Coach Andi Pratama',
    roleLabel: 'Coach',
    description: 'Lihat jadwal mengajar hari ini dan siapkan daftar hadir kelas berikutnya.',
  },
  staff: {
    name: 'Sarah Wijaya',
    roleLabel: 'Staff',
    description: 'Kelola antrean kedatangan siswa dan verifikasi pembayaran yang masih pending.',
  },
};

const roleOptions = [
  { value: 'admin', label: 'Admin', icon: ShieldCheck },
  { value: 'coach', label: 'Coach', icon: Dumbbell },
  { value: 'staff', label: 'Staff', icon: ClipboardList },
];

const revenueTrend = [
  { label: 'Kam', amount: 2400000 },
  { label: 'Jum', amount: 3150000 },
  { label: 'Sab', amount: 2850000 },
  { label: 'Min', amount: 4200000 },
  { label: 'Sen', amount: 3600000 },
  { label: 'Sel', amount: 5100000 },
  { label: 'Rab', amount: 3750000 },
];

const expiredMembers = [
  {
    id: 1,
    name: 'Alya',
    program: 'AAA Pemula',
    packageName: 'Paket 8x Pertemuan',
    expiryLabel: 'Expired 2 hari lalu',
    status: 'cancelled',
    statusLabel: 'Expired',
  },
  {
    id: 2,
    name: 'Raka Aditya',
    program: 'A3 Menengah',
    packageName: 'Paket Bulanan',
    expiryLabel: 'Berakhir hari ini',
    status: 'pending',
    statusLabel: 'Hari ini',
  },
  {
    id: 3,
    name: 'Nadia Putri',
    program: 'SWDC Atlet',
    packageName: 'Paket 3 Bulan',
    expiryLabel: 'Berakhir dalam 2 hari',
    status: 'pending',
    statusLabel: 'H-2',
  },
  {
    id: 4,
    name: 'Dimas Aryo',
    program: 'Private',
    packageName: 'Paket 4x Private',
    expiryLabel: 'Berakhir dalam 3 hari',
    status: 'pending',
    statusLabel: 'H-3',
  },
];

const coachScheduleToday = [
  {
    id: 1,
    startTime: '08.00',
    endTime: '09.00',
    program: 'AAA Pemula',
    groupName: 'Kelompok Lumba-Lumba',
    pool: 'Kolam Tirta Segara',
    students: 8,
    capacity: 10,
    status: 'completed',
    statusLabel: 'Selesai',
  },
  {
    id: 2,
    startTime: '10.00',
    endTime: '11.30',
    program: 'A3 Menengah',
    groupName: 'Kelompok Hiu',
    pool: 'Kolam Tirta Segara',
    students: 9,
    capacity: 12,
    status: 'completed',
    statusLabel: 'Selesai',
  },
  {
    id: 3,
    startTime: '14.00',
    endTime: '15.00',
    program: 'Private',
    groupName: 'Bimo (1-on-1)',
    pool: 'Kolam Aqua Center',
    students: 1,
    capacity: 1,
    status: 'active',
    statusLabel: 'Berlangsung',
  },
  {
    id: 4,
    startTime: '16.00',
    endTime: '17.00',
    program: 'AAA Pemula',
    groupName: 'Kelompok Bintang Laut',
    pool: 'Kolam Tirta Segara',
    students: 8,
    capacity: 10,
    status: 'pending',
    statusLabel: 'Berikutnya',
  },
];

const nextClassStudents = [
  { id: 1, name: 'Aira', age: '6 th', groupName: 'Bintang Laut A', memberStatus: 'active' },
  { id: 2, name: 'Raka Aditya', age: '7 th', groupName: 'Bintang Laut A', memberStatus: 'active' },
  { id: 3, name: 'Putri Ayu', age: '5 th', groupName: 'Bintang Laut A', memberStatus: 'active' },
  { id: 4, name: 'Zahira', age: '6 th', groupName: 'Bintang Laut B', memberStatus: 'pending' },
  { id: 5, name: 'Raka Pratama', age: '8 th', groupName: 'Bintang Laut B', memberStatus: 'active' },
  { id: 6, name: 'Keira', age: '7 th', groupName: 'Bintang Laut B', memberStatus: 'active' },
  { id: 7, name: 'Dafa Alfarizi', age: '6 th', groupName: 'Bintang Laut C', memberStatus: 'active' },
  { id: 8, name: 'Laras Putri', age: '5 th', groupName: 'Bintang Laut C', memberStatus: 'pending' },
];

const initialStaffQueue = [
  {
    id: 1,
    queueNo: 'A-01',
    studentName: 'Aira',
    purpose: 'Check-in kelas AAA',
    arrivalTime: '07.45',
    status: 'completed',
    statusLabel: 'Selesai',
  },
  {
    id: 2,
    queueNo: 'A-02',
    studentName: 'Bimo Saputra',
    purpose: 'Perpanjangan paket Private',
    arrivalTime: '08.10',
    status: 'active',
    statusLabel: 'Diproses',
  },
  {
    id: 3,
    queueNo: 'A-03',
    studentName: 'Kayla',
    purpose: 'Pendaftaran trial A3',
    arrivalTime: '08.25',
    status: 'pending',
    statusLabel: 'Menunggu',
  },
  {
    id: 4,
    queueNo: 'A-04',
    studentName: 'Rafi Hidayat',
    purpose: 'Check-in kelas SWDC',
    arrivalTime: '08.40',
    status: 'pending',
    statusLabel: 'Menunggu',
  },
  {
    id: 5,
    queueNo: 'A-05',
    studentName: 'Meisya',
    purpose: 'Konsultasi jadwal Private',
    arrivalTime: '08.55',
    status: 'pending',
    statusLabel: 'Menunggu',
  },
];

const initialPendingPayments = [
  {
    id: 1,
    studentName: 'Alya',
    packageName: 'AAA - 8x Pertemuan',
    amount: 650000,
    dueDate: 'Hari ini',
    method: 'Transfer BCA',
    status: 'pending',
  },
  {
    id: 2,
    studentName: 'Raka Aditya',
    packageName: 'A3 - Bulanan',
    amount: 450000,
    dueDate: 'Besok',
    method: 'QRIS',
    status: 'pending',
  },
  {
    id: 3,
    studentName: 'Zeline Nathania',
    packageName: 'SWDC - 3 Bulan',
    amount: 2850000,
    dueDate: '2 hari lagi',
    method: 'Transfer Mandiri',
    status: 'pending',
  },
  {
    id: 4,
    studentName: 'Raka Pratama',
    packageName: 'AAA - 4x Pertemuan',
    amount: 375000,
    dueDate: '3 hari lagi',
    method: 'E-Wallet',
    status: 'pending',
  },
];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRupiahShort(amount) {
  return `Rp ${(amount / 1000000).toLocaleString('id-ID', {
    minimumFractionDigits: amount % 1000000 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} jt`;
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function AvatarInitials({ name, className = '' }) {
  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#0066CC] ring-1 ring-blue-100',
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* SHARED SMALL COMPONENTS                                                    */
/* -------------------------------------------------------------------------- */

function StatCard({ icon: Icon, label, value, description, trend, progress }) {
  return (
    <Card padded hover>
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0066CC] text-white shadow-sm shadow-blue-600/25">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>

        {trend ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
            <TrendingUp className="h-3.5 w-3.5" />
            {trend}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">
        {value}
      </p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}

      {typeof progress === 'number' ? (
        <div className="mt-4" aria-hidden="true">
          <div className="h-2 overflow-hidden rounded-full bg-blue-50">
            <div
              className="h-full rounded-full bg-[#0066CC] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function SkeletonBlock({ className = '' }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-200', className)} aria-hidden="true" />;
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Memuat data dashboard" className="space-y-4 sm:space-y-6">
      <span className="sr-only">Memuat data dashboard...</span>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} padded>
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-11 w-11 rounded-2xl" />
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
            <SkeletonBlock className="mt-5 h-4 w-28" />
            <SkeletonBlock className="mt-2 h-8 w-36" />
            <SkeletonBlock className="mt-2 h-4 w-44" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <Card padded className="xl:col-span-2">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="mt-2 h-4 w-64" />
          <SkeletonBlock className="mt-6 h-64 w-full" />
        </Card>

        <Card padded>
          <SkeletonBlock className="h-5 w-40" />
          <div className="mt-6 space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <SkeletonBlock className="h-4 w-3/4" />
                  <SkeletonBlock className="mt-2 h-3 w-1/2" />
                </div>
                <SkeletonBlock className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ADMIN WIDGETS                                                              */
/* -------------------------------------------------------------------------- */

function RevenueTrendChart({ data }) {
  const width = 720;
  const height = 260;
  const padding = { top: 28, right: 44, bottom: 36, left: 44 };
  const maxAmount = Math.max(...data.map((item) => item.amount)) * 1.15;

  const getX = (index) =>
    padding.left + (index * (width - padding.left - padding.right)) / (data.length - 1);
  const getY = (amount) =>
    height -
    padding.bottom -
    (amount / maxAmount) * (height - padding.top - padding.bottom);

  const points = data.map((item, index) => ({
    ...item,
    x: getX(index),
    y: getY(item.amount),
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
  const totalRevenue = data.reduce((sum, item) => sum + item.amount, 0);
  const averageRevenue = Math.round(totalRevenue / data.length);

  return (
    <div>
      <div className="flex flex-wrap gap-4 sm:gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total 7 Hari
          </p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">
            {formatRupiah(totalRevenue)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rata-rata / Hari
          </p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">
            {formatRupiah(averageRevenue)}
          </p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Grafik tren pendapatan selama tujuh hari terakhir"
        className="mt-4 h-60 w-full sm:h-64"
      >
        <defs>
          <linearGradient id="revenue-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0066CC" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#0066CC" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + ratio * (height - padding.top - padding.bottom);
          return (
            <line
              key={ratio}
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray="4 5"
            />
          );
        })}

        <path d={areaPath} fill="url(#revenue-area-gradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="#0066CC"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#0066CC" strokeWidth="3">
              <title>{`${point.label}: ${formatRupiah(point.amount)}`}</title>
            </circle>
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#0066CC"
            >
              {formatRupiahShort(point.amount)}
            </text>
            <text
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#64748B"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Ringkasan KPI Admin">
        <StatCard
          icon={GraduationCap}
          label="Total Siswa"
          value="248"
          description="231 siswa aktif • 12 pendaftar baru bulan ini"
          trend="+5,2%"
        />
        <StatCard
          icon={Wallet}
          label="Pendapatan Hari Ini"
          value={formatRupiah(3750000)}
          description="Dari 18 transaksi berhasil hari ini"
          trend="+12,5%"
        />
        <StatCard
          icon={CalendarDays}
          label="Kelas Terisi"
          value="86%"
          description="37 dari 43 slot kelas terisi minggu ini"
          progress={86}
        />
      </section>

      <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-3">
        <Card
          title="Tren Pendapatan"
          description="Pendapatan harian selama 7 hari terakhir."
          action={
            <Button
              href="/dashboard/finance?tab=reports"
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Laporan
            </Button>
          }
          className="xl:col-span-2"
        >
          <RevenueTrendChart data={revenueTrend} />
        </Card>

        <Card
          title="er Expired"
          description="Perlu pengingat perpanjangan paket."
          action={<Badge status="pending">{expiredMembers.length} siswa</Badge>}
          contentClassName="p-0 sm:p-0"
          footer={
            <Button
              href="/dashboard/settings?tab=notifications"
              variant="secondary"
              fullWidth
              leftIcon={<BellRing className="h-4 w-4" />}
            >
              Kirim Pengingat Perpanjangan
            </Button>
          }
        >
          <ul className="divide-y divide-slate-100">
            {expiredMembers.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                <AvatarInitials name={member.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{member.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {member.program} • {member.packageName}
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-xs font-semibold',
                      member.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'
                    )}
                  >
                    {member.expiryLabel}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge status={member.status} size="sm">
                    {member.statusLabel}
                  </Badge>
                  <Button
                    href="/dashboard/students"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    leftIcon={<MessageCircle className="h-3.5 w-3.5" />}
                  >
                    Hubungi
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COACH WIDGETS                                                              */
/* -------------------------------------------------------------------------- */

function CoachDashboard() {
  const [attendance, setAttendance] = useState(() =>
    Object.fromEntries(nextClassStudents.map((student) => [student.id, 'unmarked']))
  );
  const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);

  const attendanceSummary = useMemo(() => {
    const values = Object.values(attendance);
    return {
      present: values.filter((value) => value === 'present').length,
      excused: values.filter((value) => value === 'excused').length,
      unmarked: values.filter((value) => value === 'unmarked').length,
    };
  }, [attendance]);

  function setStudentAttendance(studentId, status) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? 'unmarked' : status,
    }));
    setIsAttendanceSaved(false);
  }

  function markAllPresent() {
    setAttendance(Object.fromEntries(nextClassStudents.map((student) => [student.id, 'present'])));
    setIsAttendanceSaved(false);
  }

  const attendanceColumns = [
    {
      key: 'student',
      label: 'Siswa',
      render: (row) => (
        <div className="flex items-center gap-3">
          <AvatarInitials name={row.name} className="h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.age}</p>
          </div>
        </div>
      ),
    },
    { key: 'groupName', label: 'Kelompok' },
    {
      key: 'memberStatus',
      label: 'Member',
      render: (row) => (
        <Badge status={row.memberStatus}>{row.memberStatus === 'active' ? 'Aktif' : 'Perlu Cek'}</Badge>
      ),
    },
    {
      key: 'attendance',
      label: 'Kehadiran',
      align: 'right',
      render: (row) => {
        const status = attendance[row.id] ?? 'unmarked';

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setStudentAttendance(row.id, 'excused')}
              aria-pressed={status === 'excused'}
              className={cn(
                'h-9 rounded-lg px-3 text-[13px] font-semibold transition-colors',
                status === 'excused'
                  ? 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                  : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'
              )}
            >
              Izin
            </button>
            <Button
              size="sm"
              variant={status === 'present' ? 'primary' : 'secondary'}
              onClick={() => setStudentAttendance(row.id, 'present')}
              aria-pressed={status === 'present'}
              leftIcon={status === 'present' ? <Check className="h-4 w-4" /> : undefined}
            >
              {status === 'present' ? 'Hadir' : 'Tandai Hadir'}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Ringkasan Coach">
        <StatCard
          icon={CalendarDays}
          label="Kelas Hari Ini"
          value={coachScheduleToday.length}
          description="2 selesai • 1 berlangsung • 1 berikutnya"
        />
        <StatCard
          icon={Users}
          label="Siswa Diajar Hari Ini"
          value="26"
          description="Dari program AAA, A3, dan Private"
        />
        <StatCard
          icon={Clock}
          label="Kelas Berikutnya"
          value="16.00"
          description="AAA Pemula • Kolam Tirta Segara"
        />
      </section>

      <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-5">
        <Card
          title="Jadwal Mengajar Hari Ini"
          description="Urutan kelas Anda dari pagi sampai sore."
          action={
            <Button href="/dashboard/operasional/jadwal" variant="ghost" size="sm">
              Semua Jadwal
            </Button>
          }
          contentClassName="space-y-3"
          className="xl:col-span-2"
        >
          {coachScheduleToday.map((schedule) => (
            <article
              key={schedule.id}
              className={cn(
                'flex gap-3 rounded-2xl border p-3 sm:p-4',
                schedule.status === 'active'
                  ? 'border-blue-200 bg-blue-50/70'
                  : 'border-slate-100 bg-white'
              )}
            >
              <div className="w-[68px] shrink-0 rounded-xl bg-white px-2 py-2 text-center ring-1 ring-slate-100">
                <p className="text-sm font-extrabold text-[#0066CC]">{schedule.startTime}</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  s/d {schedule.endTime}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-900">{schedule.program}</h3>
                    <p className="truncate text-xs text-slate-500">{schedule.groupName}</p>
                  </div>
                  <Badge status={schedule.status} size="sm">
                    {schedule.statusLabel}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#0066CC]" />
                    {schedule.pool}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#0066CC]" />
                    {schedule.students}/{schedule.capacity} siswa
                  </span>
                </div>
              </div>
            </article>
          ))}
        </Card>

        <Card
          title="Daftar Hadir Kelas Berikutnya"
          description="AAA Pemula • Kelompok Bintang Laut"
          action={<Badge status="active">16.00 - 17.00</Badge>}
          contentClassName="p-0 sm:p-0"
          footer={
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                <span className="font-bold text-slate-900">{attendanceSummary.present}</span> hadir •{' '}
                <span className="font-bold text-slate-900">{attendanceSummary.excused}</span> izin •{' '}
                <span className="font-bold text-slate-900">{attendanceSummary.unmarked}</span> belum ditandai
                {isAttendanceSaved ? (
                  <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 sm:mt-0 sm:inline-flex sm:pl-2">
                    <Check className="h-3.5 w-3.5" /> Absensi mock tersimpan
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={markAllPresent}>
                  Tandai Semua Hadir
                </Button>
                <Button size="sm" onClick={() => setIsAttendanceSaved(true)}>
                  Simpan Absensi
                </Button>
              </div>
            </div>
          }
          className="xl:col-span-3"
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-blue-100 bg-blue-50/60 px-5 py-3 text-xs font-medium text-slate-600 sm:px-6">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#0066CC]" /> 16.00 - 17.00 WIB
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#0066CC]" /> Kolam Tirta Segara
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Waves className="h-4 w-4 text-[#0066CC]" /> Jalur 1-2 • Kolam Anak
            </span>
          </div>

          <Table
            data={nextClassStudents}
            columns={attendanceColumns}
            containerClassName="rounded-none border-0 shadow-none"
            minWidthClassName="min-w-[640px]"
            emptyMessage="Belum ada siswa di kelas berikutnya"
          />
        </Card>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STAFF WIDGETS                                                              */
/* -------------------------------------------------------------------------- */

function StaffDashboard() {
  const [queueItems, setQueueItems] = useState(initialStaffQueue);
  const [payments, setPayments] = useState(initialPendingPayments);

  const queueSummary = useMemo(
    () => ({
      waiting: queueItems.filter((item) => item.status === 'pending').length,
      processing: queueItems.filter((item) => item.status === 'active').length,
      completed: queueItems.filter((item) => item.status === 'completed').length,
    }),
    [queueItems]
  );

  const pendingPaymentsData = useMemo(() => {
    const pending = payments.filter((payment) => payment.status === 'pending');
    return {
      count: pending.length,
      total: pending.reduce((sum, payment) => sum + payment.amount, 0),
    };
  }, [payments]);

  function advanceQueue(itemId) {
    setQueueItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.status === 'pending') return { ...item, status: 'active', statusLabel: 'Diproses' };
        if (item.status === 'active') return { ...item, status: 'completed', statusLabel: 'Selesai' };
        return item;
      })
    );
  }

  function verifyPayment(paymentId) {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === paymentId ? { ...payment, status: 'completed' } : payment
      )
    );
  }

  const paymentColumns = [
    {
      key: 'student',
      label: 'Siswa',
      render: (row) => (
        <div className="flex items-center gap-3">
          <AvatarInitials name={row.studentName} className="h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{row.studentName}</p>
            <p className="truncate text-xs text-slate-500">{row.method}</p>
          </div>
        </div>
      ),
    },
    { key: 'packageName', label: 'Paket' },
    {
      key: 'amount',
      label: 'Nominal',
      align: 'right',
      render: (row) => <span className="font-bold text-slate-900">{formatRupiah(row.amount)}</span>,
    },
    { key: 'dueDate', label: 'Jatuh Tempo' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge status={row.status}>{row.status === 'pending' ? 'Pending' : 'Terverifikasi'}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'right',
      render: (row) =>
        row.status === 'pending' ? (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label={`Ingatkan ${row.studentName}`}
              title="Kirim pengingat"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => verifyPayment(row.id)}>
              Verifikasi
            </Button>
          </div>
        ) : (
          <span className="inline-flex items-center justify-end gap-1 text-xs font-bold text-emerald-600">
            <Check className="h-4 w-4" /> Selesai
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Ringkasan Staff">
        <StatCard
          icon={ClipboardList}
          label="Antrean Menunggu"
          value={queueSummary.waiting}
          description={`${queueSummary.processing} sedang diproses saat ini`}
        />
        <StatCard
          icon={UserCheck}
          label="Selesai Dilayani"
          value={queueSummary.completed}
          description={`Dari total ${queueItems.length} antrean hari ini`}
        />
        <StatCard
          icon={Receipt}
          label="Pembayaran Pending"
          value={formatRupiahShort(pendingPaymentsData.total)}
          description={`${pendingPaymentsData.count} pembayaran belum terverifikasi`}
        />
      </section>

      <section className="grid items-start gap-4 sm:gap-6 xl:grid-cols-5">
        <Card
          title="Antrean Siswa Hari Ini"
          description="Panggil dan selesaikan antrean secara berurutan."
          action={<Badge status="pending">{queueSummary.waiting} menunggu</Badge>}
          contentClassName="p-0 sm:p-0"
          className="xl:col-span-2"
        >
          <ul className="divide-y divide-slate-100">
            {queueItems.map((item) => (
              <li key={item.id} className="px-5 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-extrabold',
                      item.status === 'completed'
                        ? 'bg-slate-100 text-slate-400'
                        : item.status === 'active'
                          ? 'bg-[#0066CC] text-white'
                          : 'bg-blue-50 text-[#0066CC]'
                    )}
                  >
                    {item.queueNo}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{item.studentName}</p>
                      <Badge status={item.status} size="sm">
                        {item.statusLabel}
                          </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{item.purpose}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" /> Datang {item.arrivalTime} WIB
                    </p>

                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant={item.status === 'pending' ? 'primary' : 'secondary'}
                        disabled={item.status === 'completed'}
                        onClick={() => advanceQueue(item.id)}
                      >
                        {item.status === 'pending'
                          ? 'Panggil & Proses'
                          : item.status === 'active'
                            ? 'Selesaikan'
                            : 'Selesai'}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Pembayaran Pending"
          description="Verifikasi bukti bayar atau kirim pengingat ke orang tua."
          action={
            <Button href="/dashboard/finance?tab=transactions" variant="ghost" size="sm">
              Semua Transaksi
            </Button>
          }
          contentClassName="p-0 sm:p-0"
          footer={
            <p className="w-full text-sm text-slate-500">
              Total yang belum terverifikasi:{' '}
              <span className="font-extrabold text-slate-900">
                {formatRupiah(pendingPaymentsData.total)}
              </span>
            </p>
          }
          className="xl:col-span-3"
        >
          <Table
            data={payments}
            columns={paymentColumns}
            containerClassName="rounded-none border-0 shadow-none"
            minWidthClassName="min-w-[760px]"
            emptyMessage="Tidak ada pembayaran pending"
            emptyDescription="Semua pembayaran hari ini sudah terverifikasi."
          />
        </Card>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const [currentRole, setCurrentRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('Selamat datang');
  const [todayLabel, setTodayLabel] = useState('Ringkasan aktivitas hari ini');

  const currentUser = mockUsersByRole[currentRole] ?? mockUsersByRole.admin;

  // Sapaan & tanggal dihitung di client untuk menghindari hydration mismatch.
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    setGreeting(
      hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'
    );
    setTodayLabel(
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now)
    );
  }, []);

  // Simulasi loading fetch data setiap halaman dibuka / role diganti.
  useEffect(() => {
    setIsLoading(true);

    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 850);

    return () => window.clearTimeout(timer);
  }, [currentRole]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge status="active">{currentUser.roleLabel}</Badge>
            <span className="text-xs font-medium text-slate-400">{todayLabel}</span>
          </div>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {greeting}, {currentUser.name}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            {currentUser.description}
          </p>
        </div>

        {/* Role Preview Switcher - hanya untuk mock/demo Phase 1 */}
        <div className="shrink-0">
          <div
            role="tablist"
            aria-label="Pilih preview role"
            className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm shadow-slate-900/[0.02] sm:inline-grid"
          >
            {roleOptions.map((role) => {
              const Icon = role.icon;
              const isSelected = currentRole === role.value;

              return (
                <button
                  key={role.value}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setCurrentRole(role.value)}
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors sm:px-4',
                    isSelected
                      ? 'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25'
                      : 'text-slate-500 hover:bg-blue-50 hover:text-[#0066CC]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {role.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-right text-[11px] leading-relaxed text-slate-400">
            Preview mock role • Di production mengikuti user login
          </p>
        </div>
      </section>

      {/* Content per Role */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : currentRole === 'coach' ? (
        <CoachDashboard />
      ) : currentRole === 'staff' ? (
        <StaffDashboard />
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
}

}
