'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleUserRound,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FormField,
  StatusBadge,
  inputClassName,
} from '@/components/data-master/DataMasterUI';
import {
  changePasswordRequest,
  updateProfileRequest,
} from '@/lib/auth/authClient';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import {
  changePasswordSchema,
  getAuthFieldErrors,
  profileUpdateSchema,
} from '@/lib/validations/auth';

// Tab Profil & Keamanan pada Settings. Tersedia untuk semua role dan
// hanya mengubah akun sendiri (endpoint memakai userId dari session).

const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-heading text-lg font-extrabold text-slate-900">
            {title}
          </h3>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function ProfileSettingsSection() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((response) => response.json().catch(() => null))
      .then((data) => {
        if (!isMounted) return;
        const user = data?.user ?? null;
        setAccount(user);
        if (user) {
          setProfileForm({
            name: user.name ?? '',
            email: user.email ?? '',
            phone: user.phone ?? '',
          });
        }
      })
      .catch(() => {
        if (isMounted) setAccount(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingAccount(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateProfileField(name, value) {
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileErrors((current) => ({ ...current, [name]: undefined }));
  }

  function updatePasswordField(name, value) {
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submitProfile(event) {
    event.preventDefault();
    if (isSavingProfile) return;

    const parsed = profileUpdateSchema.safeParse(profileForm);

    if (!parsed.success) {
      setProfileErrors(getAuthFieldErrors(parsed.error));
      return;
    }

    setIsSavingProfile(true);

    try {
      const result = await updateProfileRequest(parsed.data);

      if (!result.ok) {
        setProfileErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }

      setAccount(result.user);
      setProfileForm({
        name: result.user.name ?? '',
        email: result.user.email ?? '',
        phone: result.user.phone ?? '',
      });
      toast.success('Profil berhasil diperbarui.');
      router.refresh();
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    if (isChangingPassword) return;

    const parsed = changePasswordSchema.safeParse(passwordForm);

    if (!parsed.success) {
      setPasswordErrors(getAuthFieldErrors(parsed.error));
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePasswordRequest(parsed.data);

      if (!result.ok) {
        setPasswordErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }

      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordErrors({});
      toast.success(
        'Password berhasil diubah. Gunakan password baru pada login berikutnya.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoadingAccount) {
    return (
      <div className="grid gap-6 xl:grid-cols-2" aria-busy="true">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
          >
            <div className="h-5 w-40 rounded bg-slate-100" />
            <div className="mt-6 space-y-4">
              <div className="h-11 rounded-xl bg-slate-100" />
              <div className="h-11 rounded-xl bg-slate-100" />
              <div className="h-11 rounded-xl bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!account) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">
        Data akun tidak dapat dimuat. Muat ulang halaman atau login kembali.
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <SectionCard
        icon={CircleUserRound}
        title="Profil Akun"
        description="Nama tampil, email, dan nomor WhatsApp yang terhubung ke akun Anda."
      >
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <StatusBadge
            label={ROLE_LABELS[account.role] ?? account.role}
            tone="blue"
          />
          <span className="font-semibold text-slate-600">
            Username login: <strong className="text-slate-900">@{account.username}</strong>
          </span>
          <span className="text-xs text-slate-400">
            (username tidak dapat diubah)
          </span>
        </div>

        <form onSubmit={submitProfile} className="space-y-4" noValidate>
          <FormField label="Nama Lengkap" htmlFor="profile-name" error={profileErrors.name} required>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="profile-name"
                value={profileForm.name}
                onChange={(event) => updateProfileField('name', event.target.value)}
                disabled={isSavingProfile}
                className={`${inputClassName(Boolean(profileErrors.name))} pl-10`}
                autoComplete="name"
              />
            </div>
          </FormField>

          <FormField label="Email" htmlFor="profile-email" error={profileErrors.email} required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={(event) => updateProfileField('email', event.target.value)}
                disabled={isSavingProfile}
                className={`${inputClassName(Boolean(profileErrors.email))} pl-10`}
                autoComplete="email"
              />
            </div>
          </FormField>

          <FormField label="Nomor WhatsApp / HP" htmlFor="profile-phone" error={profileErrors.phone}>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="profile-phone"
                type="tel"
                value={profileForm.phone}
                onChange={(event) => updateProfileField('phone', event.target.value)}
                placeholder="081234567890"
                disabled={isSavingProfile}
                className={`${inputClassName(Boolean(profileErrors.phone))} pl-10`}
                autoComplete="tel"
              />
            </div>
          </FormField>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-5 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProfile ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        icon={ShieldCheck}
        title="Keamanan & Password"
        description="Ganti password login Anda. Password baru minimal 8 karakter dan berbeda dari password saat ini."
      >
        <form onSubmit={submitPassword} className="space-y-4" noValidate>
          <FormField label="Password Saat Ini" htmlFor="profile-current-password" error={passwordErrors.currentPassword} required>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="profile-current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
                disabled={isChangingPassword}
                className={`${inputClassName(Boolean(passwordErrors.currentPassword))} pl-10`}
                autoComplete="current-password"
              />
            </div>
          </FormField>

          <FormField label="Password Baru" htmlFor="profile-new-password" error={passwordErrors.newPassword} required>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="profile-new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                disabled={isChangingPassword}
                className={`${inputClassName(Boolean(passwordErrors.newPassword))} pl-10`}
                autoComplete="new-password"
              />
            </div>
          </FormField>

          <FormField label="Konfirmasi Password Baru" htmlFor="profile-confirm-password" error={passwordErrors.confirmPassword} required>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="profile-confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
                disabled={isChangingPassword}
                className={`${inputClassName(Boolean(passwordErrors.confirmPassword))} pl-10`}
                autoComplete="new-password"
              />
            </div>
          </FormField>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChangingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            )}
            {isChangingPassword ? 'Memproses...' : 'Ganti Password'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
