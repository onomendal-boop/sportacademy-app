'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, MessageCircle, Send } from 'lucide-react';
import Button from '../ui/Button';

function getInputClassName(hasError) {
  return [
    'mt-1.5 h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
      : 'border-blue-100 focus:border-[#0066CC] focus:ring-blue-600/10',
  ].join(' ');
}

function buildWhatsappUrl(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';

  const normalized = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('8')
      ? `62${digits}`
      : digits;
  const message = encodeURIComponent(
    'Halo AAA Sport Academy, saya baru mengisi form pendaftaran di website.'
  );

  return `https://wa.me/${normalized}?text=${message}`;
}

export default function RegistrationCta({
  programs = [],
  venues = [],
  contactPhone = '',
}) {
  const programOptions = useMemo(
    () =>
      programs.map((program) => ({
        value: program.code ?? program.program ?? '',
        label: program.name ?? program.code ?? program.program ?? 'Program',
      })).filter((program) => program.value),
    [programs]
  );
  const venueOptions = useMemo(
    () =>
      venues
        .map((venue) => (typeof venue === 'string' ? venue : venue?.name))
        .filter(Boolean),
    [venues]
  );
  const initialForm = useMemo(
    () => ({
      studentName: '',
      parentName: '',
      parentPhone: '',
      program: programOptions[0]?.value ?? '',
      poolPreference: '',
      website: '',
    }),
    [programOptions]
  );

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedProgramLabel =
    programOptions.find((program) => program.value === formData.program)?.label ??
    'yang diminati';
  const whatsappUrl = buildWhatsappUrl(contactPhone);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    const cleanedPhone = formData.parentPhone.replace(/[\s-]/g, '');

    if (formData.studentName.trim().length < 3) {
      nextErrors.studentName = 'Nama calon siswa minimal 3 karakter.';
    }
    if (formData.parentName.trim().length < 3) {
      nextErrors.parentName = 'Nama orang tua minimal 3 karakter.';
    }
    if (!/^(?:\+62|62|0)8\d{7,13}$/.test(cleanedPhone)) {
      nextErrors.parentPhone = 'Masukkan nomor WhatsApp Indonesia yang valid.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: formData.studentName.trim(),
          parentName: formData.parentName.trim(),
          parentPhone: cleanedPhone,
          program: formData.program || null,
          poolPreference: formData.poolPreference || null,
          website: formData.website,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const serverFieldErrors = Object.fromEntries(
          Object.entries(payload.fieldErrors ?? {}).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages[0] : messages,
          ])
        );

        if (Object.keys(serverFieldErrors).length) {
          setErrors(serverFieldErrors);
        }
        throw new Error(
          payload.message || 'Pendaftaran belum dapat dikirim. Silakan coba lagi.'
        );
      }

      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(
        error?.message || 'Pendaftaran belum dapat dikirim. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-[28px] bg-white p-6 text-center shadow-2xl shadow-blue-950/20 sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Check className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-2xl font-extrabold text-slate-900">Pendaftaran Diterima!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Terima kasih, {formData.parentName}. Data sudah tersimpan sebagai lead
          dan tim AAA Sport Academy akan menghubungi WhatsApp {formData.parentPhone}
          {' '}untuk membantu memilih jadwal trial program {selectedProgramLabel}.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {whatsappUrl ? (
            <Button
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              Lanjut via WhatsApp
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData(initialForm);
              setErrors({});
              setSubmitError('');
              setIsSubmitted(false);
            }}
          >
            Isi Form Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] bg-white p-6 shadow-2xl shadow-blue-950/20 sm:p-8"
      noValidate
    >
      <h3 className="text-2xl font-extrabold text-slate-900">Daftar Trial &amp; Konsultasi</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Isi data singkat berikut. Data langsung masuk ke Marketing Leads agar
        admin dapat membantu memilih level dan jadwal yang paling cocok.
      </p>

      {submitError ? (
        <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{submitError}</p>
        </div>
      ) : null}

      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input
            name="website"
            value={formData.website}
            onChange={handleChange}
            autoComplete="off"
            tabIndex="-1"
          />
        </label>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="cta-student-name" className="text-sm font-bold text-slate-700">
            Nama Calon Siswa <span className="text-red-500">*</span>
          </label>
          <input
            id="cta-student-name"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            placeholder="Nama lengkap calon siswa"
            className={getInputClassName(errors.studentName)}
          />
          {errors.studentName ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">{errors.studentName}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cta-parent-name" className="text-sm font-bold text-slate-700">
              Nama Orang Tua <span className="text-red-500">*</span>
            </label>
            <input
              id="cta-parent-name"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              placeholder="Nama orang tua/wali"
              className={getInputClassName(errors.parentName)}
            />
            {errors.parentName ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.parentName}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="cta-phone" className="text-sm font-bold text-slate-700">
              No. WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              id="cta-phone"
              name="parentPhone"
              type="tel"
              value={formData.parentPhone}
              onChange={handleChange}
              placeholder="08xxxxxxxxxx"
              className={getInputClassName(errors.parentPhone)}
            />
            {errors.parentPhone ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.parentPhone}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cta-program" className="text-sm font-bold text-slate-700">
              Program Diminati
            </label>
            <div className="relative">
              <select
                id="cta-program"
                name="program"
                value={formData.program}
                onChange={handleChange}
                className={`${getInputClassName(false)} appearance-none pr-10`}
              >
                <option value="">Belum menentukan</option>
                {programOptions.map((program) => (
                  <option key={program.value} value={program.value}>
                    {program.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1 text-slate-400" />
            </div>
          </div>

          <div>
            <label htmlFor="cta-pool" className="text-sm font-bold text-slate-700">
              Preferensi Kolam
            </label>
            <div className="relative">
              <select
                id="cta-pool"
                name="poolPreference"
                value={formData.poolPreference}
                onChange={handleChange}
                className={`${getInputClassName(false)} appearance-none pr-10`}
              >
                <option value="">Belum Memilih</option>
                {venueOptions.map((venue) => (
                  <option key={venue} value={venue}>
                    {venue}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={isSubmitting}
        leftIcon={<Send className="h-5 w-5" />}
        className="mt-6 rounded-full"
      >
        {isSubmitting ? 'Mengirim Pendaftaran...' : 'Kirim & Minta Dihubungi'}
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
        Data hanya digunakan untuk follow-up pendaftaran AAA Sport Academy.
      </p>
    </form>
  );
}
