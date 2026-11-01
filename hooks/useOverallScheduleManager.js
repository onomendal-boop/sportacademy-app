'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DAY_OF_WEEK_VALUES } from '@/lib/operational/constants';
import { scheduleApi } from '@/lib/operational/operationalClient';
import {
  getOperationalFieldErrors,
  scheduleSchema,
} from '@/lib/validations/operational';

const EMPTY_FORM = {
  title: '',
  program: 'AAA',
  dayOfWeek: 'MONDAY',
  startTime: '16:00',
  endTime: '17:00',
  capacity: '10',
  trainingVenueId: '',
  lane: '',
  status: 'ACTIVE',
  notes: '',
  effectiveStartDate: '',
  effectiveEndDate: '',
  leadCoachId: '',
};

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

function sortSchedules(first, second) {
  const dayDifference =
    DAY_OF_WEEK_VALUES.indexOf(first.dayOfWeek) -
    DAY_OF_WEEK_VALUES.indexOf(second.dayOfWeek);

  if (dayDifference !== 0) return dayDifference;
  if (first.startTime !== second.startTime) {
    return first.startTime.localeCompare(second.startTime);
  }
  return first.title.localeCompare(second.title);
}

function mapApiFieldErrors(error) {
  if (!error?.fieldErrors) return {};

  return Object.fromEntries(
    Object.entries(error.fieldErrors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : messages,
    ])
  );
}

export default function useOverallScheduleManager(
  initialSchedules = [],
  canManage = false,
  canDelete = false,
  programScope = null,
  initialSearch = ''
) {
  const scopedEmptyForm = {
    ...EMPTY_FORM,
    program: programScope ?? EMPTY_FORM.program,
  };
  const [schedules, setSchedules] = useState(() =>
    [...initialSchedules].sort(sortSchedules)
  );
  const [search, setSearch] = useState(initialSearch);
  const [programFilter, setProgramFilter] = useState('ALL');
  const [dayFilter, setDayFilter] = useState('ALL');
  const [venueFilter, setVenueFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [coachFilter, setCoachFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('board');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState(scopedEmptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSchedules = useMemo(() => {
    const keyword = normalize(search).trim();

    return schedules.filter((schedule) => {
      const matchesSearch =
        !keyword ||
        [
          schedule.title,
          schedule.program,
          schedule.venueName,
          schedule.trainingVenue?.location,
          schedule.lane,
          schedule.leadAssignment?.coach?.name,
        ]
          .map(normalize)
          .some((value) => value.includes(keyword));

      const matchesProgram =
        programFilter === 'ALL' || schedule.program === programFilter;
      const matchesDay = dayFilter === 'ALL' || schedule.dayOfWeek === dayFilter;
      const matchesVenue =
        venueFilter === 'ALL' || schedule.trainingVenueId === venueFilter;
      const matchesStatus =
        statusFilter === 'ALL' || schedule.status === statusFilter;
      const matchesCoach =
        coachFilter === 'ALL' ||
        (coachFilter === 'UNASSIGNED'
          ? !schedule.leadCoachId
          : schedule.leadCoachId === coachFilter);

      return (
        matchesSearch &&
        matchesProgram &&
        matchesDay &&
        matchesVenue &&
        matchesStatus &&
        matchesCoach
      );
    });
  }, [schedules, search, programFilter, dayFilter, venueFilter, statusFilter, coachFilter]);

  const schedulesByDay = useMemo(
    () =>
      Object.fromEntries(
        DAY_OF_WEEK_VALUES.map((day) => [
          day,
          filteredSchedules.filter((schedule) => schedule.dayOfWeek === day),
        ])
      ),
    [filteredSchedules]
  );

  const stats = useMemo(() => {
    const active = schedules.filter((schedule) => schedule.status === 'ACTIVE');

    return {
      total: schedules.length,
      active: active.length,
      programs: new Set(active.map((schedule) => schedule.program)).size,
      assignedCoaches: new Set(
        active.map((schedule) => schedule.leadCoachId).filter(Boolean)
      ).size,
      unassigned: active.filter((schedule) => !schedule.leadCoachId).length,
    };
  }, [schedules]);

  function updateField(name, value) {
    setFormData((current) => ({
      ...current,
      [name]: name === 'program' && programScope ? programScope : value,
      ...(name === 'program' && value === 'PRIVATE' ? { capacity: '1' } : {}),
    }));
    setFormErrors((current) => ({ ...current, [name]: undefined }));
  }

  function openCreate() {
    if (!canManage) return;
    setEditingSchedule(null);
    setFormData(scopedEmptyForm);
    setFormErrors({});
    setIsFormOpen(true);
  }

  function openEdit(schedule) {
    if (!canManage) return;
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title ?? '',
      program: schedule.program ?? 'AAA',
      dayOfWeek: schedule.dayOfWeek ?? 'MONDAY',
      startTime: schedule.startTime ?? '16:00',
      endTime: schedule.endTime ?? '17:00',
      capacity: schedule.capacity ? String(schedule.capacity) : '10',
      trainingVenueId: schedule.trainingVenueId ?? '',
      lane: schedule.lane ?? '',
      status: schedule.status ?? 'ACTIVE',
      notes: schedule.notes ?? '',
      effectiveStartDate: schedule.effectiveStartDate ?? '',
      effectiveEndDate: schedule.effectiveEndDate ?? '',
      leadCoachId: schedule.leadCoachId ?? '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingSchedule(null);
    setFormErrors({});
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!canManage || isSaving) return;

    const parsed = scheduleSchema.safeParse({
      ...formData,
      program: programScope ?? formData.program,
    });

    if (!parsed.success) {
      setFormErrors(getOperationalFieldErrors(parsed.error));
      return;
    }

    setIsSaving(true);

    try {
      if (editingSchedule) {
        const updated = await scheduleApi.update(editingSchedule.id, parsed.data);
        setSchedules((current) =>
          current
            .map((schedule) => (schedule.id === updated.id ? updated : schedule))
            .sort(sortSchedules)
        );
        toast.success(`Jadwal ${updated.title} berhasil diperbarui.`);
      } else {
        const created = await scheduleApi.create(parsed.data);
        setSchedules((current) => [created, ...current].sort(sortSchedules));
        toast.success(`Jadwal ${created.title} berhasil ditambahkan.`);
      }

      setIsFormOpen(false);
      setEditingSchedule(null);
      setFormData(scopedEmptyForm);
      setFormErrors({});
    } catch (error) {
      setFormErrors(mapApiFieldErrors(error));
      toast.error(error?.message ?? 'Gagal menyimpan jadwal.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!canDelete || !deleteTarget || isDeleting) return;

    setIsDeleting(true);

    try {
      await scheduleApi.remove(deleteTarget.id);
      setSchedules((current) =>
        current.filter((schedule) => schedule.id !== deleteTarget.id)
      );
      toast.success(`Jadwal ${deleteTarget.title} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menghapus jadwal.');
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    programScope,
    schedules,
    filteredSchedules,
    schedulesByDay,
    stats,
    search,
    programFilter,
    dayFilter,
    venueFilter,
    statusFilter,
    coachFilter,
    viewMode,
    isFormOpen,
    editingSchedule,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
    onSearchChange: setSearch,
    onProgramFilterChange: setProgramFilter,
    onDayFilterChange: setDayFilter,
    onVenueFilterChange: setVenueFilter,
    onStatusFilterChange: setStatusFilter,
    onCoachFilterChange: setCoachFilter,
    onViewModeChange: setViewMode,
    onFieldChange: updateField,
    onCreate: openCreate,
    onEdit: openEdit,
    onCloseForm: closeForm,
    onSubmit: submitForm,
    onDeleteRequest: setDeleteTarget,
    onDeleteCancel: () => !isDeleting && setDeleteTarget(null),
    onDeleteConfirm: confirmDelete,
  };
}
