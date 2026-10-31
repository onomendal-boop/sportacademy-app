'use client';

import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/data-master/DataMasterUI';
import {
  ASSIGNMENT_ROLE_LABELS,
  PROGRAM_CONFIG,
  SCHEDULE_STATUS_LABELS,
} from '@/lib/operational/constants';

export function OperationalHeader({
  title,
  description,
  addLabel,
  canManage,
  onAdd,
  children,
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0066CC]">
          Operasional
        </p>
        <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {children}
        {canManage && addLabel ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] focus:outline-none focus:ring-4 focus:ring-blue-600/20"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {addLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function OperationalReadOnlyNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
      Mode lihat saja: hanya akun Superadmin/Owner/Admin yang dapat mengubah jadwal, menugaskan pelatih,
      atau mengelola booking Private.
    </div>
  );
}

export function ProgramBadge({ program }) {
  const tones = {
    AAA: 'green',
    A3: 'blue',
    SWDC: 'violet',
    PRIVATE: 'amber',
  };

  return (
    <StatusBadge
      label={PROGRAM_CONFIG[program]?.title ?? program}
      tone={tones[program] ?? 'slate'}
    />
  );
}

export function ScheduleStatusBadge({ status }) {
  const tones = {
    ACTIVE: 'green',
    INACTIVE: 'slate',
    CANCELLED: 'red',
  };

  return (
    <StatusBadge
      label={SCHEDULE_STATUS_LABELS[status] ?? status}
      tone={tones[status] ?? 'slate'}
    />
  );
}

export function AssignmentRoleBadge({ role }) {
  return (
    <StatusBadge
      label={ASSIGNMENT_ROLE_LABELS[role] ?? role}
      tone={role === 'LEAD' ? 'blue' : role === 'ASSISTANT' ? 'violet' : 'amber'}
    />
  );
}

export function getSlotStatus(occurrence) {
  const remaining = Math.max(
    0,
    (occurrence.capacity ?? 0) - (occurrence.bookedCount ?? 0)
  );
  const isPrivate = occurrence.program === 'PRIVATE';

  if (occurrence.slotStatus === 'CANCELLED') {
    return {
      label: 'Dibatalkan',
      tone: 'red',
      remaining,
      progressClassName: 'bg-red-500',
    };
  }

  if (occurrence.slotStatus === 'CLOSED') {
    return {
      label: 'Ditutup',
      tone: 'slate',
      remaining,
      progressClassName: 'bg-slate-400',
    };
  }

  if (remaining === 0 || occurrence.slotStatus === 'FULL') {
    return {
      label: isPrivate ? 'Terbooking' : 'Penuh',
      tone: isPrivate ? 'blue' : 'red',
      remaining,
      progressClassName: isPrivate ? 'bg-[#0066CC]' : 'bg-red-500',
    };
  }

  if (!isPrivate && remaining <= Math.max(2, Math.ceil(occurrence.capacity * 0.2))) {
    return {
      label: 'Hampir Penuh',
      tone: 'amber',
      remaining,
      progressClassName: 'bg-amber-500',
    };
  }

  return {
    label: isPrivate ? 'Slot Kosong' : 'Tersedia',
    tone: 'green',
    remaining,
    progressClassName: 'bg-[#0066CC]',
  };
}
