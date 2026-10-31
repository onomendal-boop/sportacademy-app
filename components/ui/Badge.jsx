/**
 * Badge - AAA Sport Academy
 *
 * Status utama: Active | Pending | Completed
 * Alias Bahasa Indonesia juga diterima: Aktif | Menunggu | Selesai
 * Status tambahan: Inactive | Cancelled
 *
 * Contoh:
 * <Badge status="active" />
 * <Badge status="pending">Menunggu Pembayaran</Badge>
 * <Badge status="completed">Selesai</Badge>
 * <Badge>Active</Badge> // status ditebak dari isi children
 */

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const statusStyles = {
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dotClassName: 'bg-emerald-500',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/25',
    dotClassName: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-50 text-[#0066CC] ring-blue-600/20',
    dotClassName: 'bg-[#0066CC]',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    dotClassName: 'bg-slate-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
    dotClassName: 'bg-red-500',
  },
  default: {
    label: 'Status',
    className: 'bg-slate-50 text-slate-600 ring-slate-500/20',
    dotClassName: 'bg-slate-400',
  },
};

const statusAliases = {
  active: 'active',
  aktif: 'active',
  pending: 'pending',
  menunggu: 'pending',
  processing: 'pending',
  proses: 'pending',
  completed: 'completed',
  complete: 'completed',
  selesai: 'completed',
  success: 'completed',
  berhasil: 'completed',
  inactive: 'inactive',
  nonaktif: 'inactive',
  'non-aktif': 'inactive',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  batal: 'cancelled',
  dibatalkan: 'cancelled',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

function normalizeStatus(value) {
  if (!value || typeof value !== 'string') return 'default';

  const key = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
  return statusAliases[key] ?? statusAliases[key.replace(/-/g, '')] ?? 'default';
}

export function Badge({
  children,
  className = '',
  status,
  variant,
  size = 'md',
  dot = true,
  ...props
}) {
  const rawStatus = status ?? variant ?? (typeof children === 'string' ? children : undefined);
  const normalizedStatus = normalizeStatus(rawStatus);
  const current = statusStyles[normalizedStatus] ?? statusStyles.default;
  const label = children ?? current.label;

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold capitalize ring-1 ring-inset',
        current.className,
        sizeStyles[size] ?? sizeStyles.md,
        className
      )}
      {...props}
    >
      {dot ? (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', current.dotClassName)} aria-hidden="true" />
      ) : null}
      {label}
    </span>
  );
}

export default Badge;
