'use client';

import { useState } from 'react';
import { Check, ChevronDown, MessageCircle, Send } from 'lucide-react';
import Button from '../ui/Button';

const initialForm = {
  studentName: '',
  parentName: '',
  parentPhone: '',
  program: 'AAA',
  poolPreference: 'Kolam Tirta Segara',
};

function getInputClassName(hasError) {
  return [
    'mt-1.5 h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
      : 'border-blue-100 focus:border-[#0066CC] focus:ring-blue-600/10',
  ].join(' ');
}

export default function RegistrationCta() {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleSubmit(event) {
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

    // TODO: Ganti simulasi ini dengan POST /api/leads atau Server Action.
    // Payload ini sudah mengikuti bentuk model Lead pada schema Prisma.
    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 650);
  }

  if (isSubmitted) {
    return (
      <div className="rounded-[28px] bg-white p-6 text-center shadow-2xl shadow-blue-950/20 sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Check className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-2xl font-extrabold text-slate-900">Pendaftaran Diterima!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Terima kasih, {formData.parentName}. Tim AAA Sport Academy akan menghubungi WhatsApp
          {' '}{formData.parentPhone} untuk membantu memilih jadwal trial program {formData.program}.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            href="https://wa.me/6281234567890?text=Halo%20AAA%20Sport%20Academy%2C%20saya%20baru%20mengisi%20form%20pendaftaran%20di%20website."
            target="_blank"
            rel="noreferrer"
            leftIcon={<MessageCircle className="h-4 w-4" />}
          >
            Lanjut via WhatsApp
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData(initialForm);
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
      <h3 className="text-2xl font-extrabold text-slate-900">Daftar Trial & Konsultasi</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Isi data singkat berikut. Admin akan membantu memilih level dan jadwal yang paling cocok.
      </p>

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
            placeholder="Contoh: Keyla Anindya"
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
              placeholder="Contoh: Ibu Ratna"
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
              placeholder="081234567890"
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
                <option value="AAA">AAA - Pemula</option>
                <option value="A3">A3 - Menengah</option>
                <option value="SWDC">SWDC - Atlet</option>
                <option value="PRIVATE">Private - 1-on-1</option>
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
                <option>Kolam Tirta Segara</option>
                <option>Kolam Aqua Center</option>
                <option>Belum Memilih</option>
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
