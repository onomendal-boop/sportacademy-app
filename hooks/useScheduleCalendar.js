'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  addDaysToDateKey,
  dateKeyFromLocalDate,
  formatWeekRange,
  getMondayDateKey,
  getWeekDateKeys,
} from '@/lib/operational/dateUtils';
import {
  assignCoachToOccurrence,
  cancelPrivateBooking,
  createPrivateBooking,
  fetchOccurrences,
  removeCoachAssignment,
} from '@/lib/operational/operationalClient';
import {
  coachAssignmentSchema,
  getOperationalFieldErrors,
  privateBookingSchema,
} from '@/lib/validations/operational';

function mapApiFieldErrors(error) {
  if (!error?.fieldErrors) return {};

  return Object.fromEntries(
    Object.entries(error.fieldErrors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : messages,
    ])
  );
}

export default function useScheduleCalendar({
  program,
  canManage = false,
  canBook = false,
  currentStudentId = null,
} = {}) {
  const [todayKey, setTodayKey] = useState('');
  const [weekStartKey, setWeekStartKey] = useState('');
  const [occurrences, setOccurrences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [assignmentTarget, setAssignmentTarget] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    coachId: '',
    role: 'LEAD',
  });
  const [assignmentErrors, setAssignmentErrors] = useState({});
  const [isAssigning, setIsAssigning] = useState(false);

  const [bookingTarget, setBookingTarget] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    studentId: '',
    coachId: '',
    notes: '',
  });
  const [bookingErrors, setBookingErrors] = useState({});
  const [isBooking, setIsBooking] = useState(false);

  const [cancelBookingTarget, setCancelBookingTarget] = useState(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);

  useEffect(() => {
    const today = new Date();
    setTodayKey(dateKeyFromLocalDate(today));
    setWeekStartKey(getMondayDateKey(today));
  }, [program]);

  useEffect(() => {
    if (!weekStartKey || !program) return undefined;

    let ignore = false;

    async function loadOccurrences() {
      setIsLoading(true);
      setLoadError('');

      try {
        const data = await fetchOccurrences({ program, weekStart: weekStartKey });
        if (!ignore) setOccurrences(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!ignore) {
          setOccurrences([]);
          setLoadError(
            error?.message ?? 'Gagal memuat jadwal dari server. Silakan coba lagi.'
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadOccurrences();

    return () => {
      ignore = true;
    };
  }, [program, weekStartKey, reloadKey]);

  const weekDateKeys = useMemo(
    () => (weekStartKey ? getWeekDateKeys(weekStartKey) : []),
    [weekStartKey]
  );

  const occurrencesByDate = useMemo(
    () =>
      Object.fromEntries(
        weekDateKeys.map((dateKey) => [
          dateKey,
          occurrences.filter((occurrence) => occurrence.dateKey === dateKey),
        ])
      ),
    [occurrences, weekDateKeys]
  );

  const stats = useMemo(() => {
    const totalCapacity = occurrences.reduce(
      (total, occurrence) => total + (occurrence.capacity ?? 0),
      0
    );
    const totalBooked = occurrences.reduce(
      (total, occurrence) => total + (occurrence.bookedCount ?? 0),
      0
    );

    return {
      totalSlots: occurrences.length,
      totalCapacity,
      totalBooked,
      totalRemaining: Math.max(0, totalCapacity - totalBooked),
      availableSlots: occurrences.filter(
        (occurrence) => occurrence.bookedCount < occurrence.capacity
      ).length,
      utilization:
        totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
      assignedCoaches: new Set(
        occurrences.map((occurrence) => occurrence.coachId).filter(Boolean)
      ).size,
    };
  }, [occurrences]);

  function replaceOccurrence(updatedOccurrence) {
    if (!updatedOccurrence) {
      setReloadKey((current) => current + 1);
      return;
    }

    setOccurrences((current) =>
      current.map((occurrence) =>
        occurrence.occurrenceId === updatedOccurrence.occurrenceId
          ? updatedOccurrence
          : occurrence
      )
    );
  }

  function changeWeek(offset) {
    if (!weekStartKey) return;
    setWeekStartKey((current) => addDaysToDateKey(current, offset * 7));
  }

  function goToCurrentWeek() {
    const today = new Date();
    setTodayKey(dateKeyFromLocalDate(today));
    setWeekStartKey(getMondayDateKey(today));
  }

  function openAssignment(occurrence) {
    if (!canManage) return;
    setAssignmentTarget(occurrence);
    setAssignmentForm({
      coachId: occurrence.coachId ?? '',
      role: occurrence.coachRole ?? 'LEAD',
    });
    setAssignmentErrors({});
  }

  function closeAssignment() {
    if (isAssigning) return;
    setAssignmentTarget(null);
    setAssignmentErrors({});
  }

  function updateAssignmentField(name, value) {
    setAssignmentForm((current) => ({ ...current, [name]: value }));
    setAssignmentErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submitAssignment(event) {
    event.preventDefault();
    if (!canManage || !assignmentTarget || isAssigning) return;

    const payload = {
      scheduleId: assignmentTarget.scheduleId,
      date: assignmentTarget.dateKey,
      coachId: assignmentForm.coachId,
      role: assignmentForm.role,
    };

    const parsed = coachAssignmentSchema.safeParse(payload);
    if (!parsed.success) {
      setAssignmentErrors(getOperationalFieldErrors(parsed.error));
      return;
    }

    setIsAssigning(true);

    try {
      const updated = await assignCoachToOccurrence(parsed.data);
      replaceOccurrence(updated);
      toast.success('Pelatih berhasil ditugaskan pada slot ini.');
      setAssignmentTarget(null);
    } catch (error) {
      setAssignmentErrors(mapApiFieldErrors(error));
      toast.error(error?.message ?? 'Gagal menyimpan penugasan pelatih.');
    } finally {
      setIsAssigning(false);
    }
  }

  async function removeAssignment() {
    if (!canManage || !assignmentTarget || isAssigning) return;

    setIsAssigning(true);

    try {
      const updated = await removeCoachAssignment({
        scheduleId: assignmentTarget.scheduleId,
        date: assignmentTarget.dateKey,
      });
      replaceOccurrence(updated);
      toast.success('Override pelatih untuk tanggal ini berhasil dihapus.');
      setAssignmentTarget(null);
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menghapus penugasan pelatih.');
    } finally {
      setIsAssigning(false);
    }
  }

  function openBooking(occurrence) {
    if (!canBook) return;
    setBookingTarget(occurrence);
    setBookingForm({
      studentId: currentStudentId ?? '',
      coachId: occurrence.coachId ?? '',
      notes: '',
    });
    setBookingErrors({});
  }

  function closeBooking() {
    if (isBooking) return;
    setBookingTarget(null);
    setBookingErrors({});
  }

  function updateBookingField(name, value) {
    setBookingForm((current) => ({ ...current, [name]: value }));
    setBookingErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (!canBook || !bookingTarget || isBooking) return;

    const payload = {
      scheduleId: bookingTarget.scheduleId,
      date: bookingTarget.dateKey,
      studentId: bookingForm.studentId,
      coachId: bookingForm.coachId,
      notes: bookingForm.notes,
    };

    const parsed = privateBookingSchema.safeParse(payload);
    if (!parsed.success) {
      setBookingErrors(getOperationalFieldErrors(parsed.error));
      return;
    }

    setIsBooking(true);

    try {
      const updated = await createPrivateBooking(parsed.data);
      replaceOccurrence(updated);
      toast.success('Slot Private berhasil dibooking.');
      setBookingTarget(null);
    } catch (error) {
      setBookingErrors(mapApiFieldErrors(error));
      toast.error(error?.message ?? 'Gagal membuat booking Private.');
    } finally {
      setIsBooking(false);
    }
  }

  async function confirmCancelBooking() {
    const bookingId = cancelBookingTarget?.bookedStudent?.bookingId;
    const canCancelBooking =
      canManage ||
      (Boolean(currentStudentId) &&
        cancelBookingTarget?.bookedStudent?.id === currentStudentId);

    if (!canCancelBooking || !bookingId || isCancellingBooking) return;

    setIsCancellingBooking(true);

    try {
      const updated = await cancelPrivateBooking(bookingId);
      replaceOccurrence(updated);
      toast.success('Booking Private berhasil dibatalkan.');
      setCancelBookingTarget(null);
    } catch (error) {
      toast.error(error?.message ?? 'Gagal membatalkan booking.');
    } finally {
      setIsCancellingBooking(false);
    }
  }

  return {
    canManage,
    canBook,
    currentStudentId,
    todayKey,
    weekStartKey,
    weekDateKeys,
    weekRangeLabel: formatWeekRange(weekStartKey),
    occurrences,
    occurrencesByDate,
    stats,
    isLoading: isLoading || !weekStartKey,
    loadError,
    assignmentTarget,
    assignmentForm,
    assignmentErrors,
    isAssigning,
    bookingTarget,
    bookingForm,
    bookingErrors,
    isBooking,
    cancelBookingTarget,
    isCancellingBooking,
    onPreviousWeek: () => changeWeek(-1),
    onNextWeek: () => changeWeek(1),
    onCurrentWeek: goToCurrentWeek,
    onReload: () => setReloadKey((current) => current + 1),
    onOpenAssignment: openAssignment,
    onCloseAssignment: closeAssignment,
    onAssignmentFieldChange: updateAssignmentField,
    onSubmitAssignment: submitAssignment,
    onRemoveAssignment: removeAssignment,
    onOpenBooking: openBooking,
    onCloseBooking: closeBooking,
    onBookingFieldChange: updateBookingField,
    onSubmitBooking: submitBooking,
    onCancelBookingRequest: setCancelBookingTarget,
    onCancelBookingCancel: () =>
      !isCancellingBooking && setCancelBookingTarget(null),
    onCancelBookingConfirm: confirmCancelBooking,
  };
}
