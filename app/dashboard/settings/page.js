import { Suspense } from 'react';
import ProfileSettingsSection from '@/components/settings/ProfileSettingsSection';
import SystemSettingsManager from '@/components/settings/SystemSettingsManager';
import Card from '@/components/ui/Card';
import { requireCurrentUser } from '@/lib/auth/authService';
import { listDatabaseBackups } from '@/lib/settings/backupService';
import {
  getFinancialPreviewSample,
  getSystemSettings,
  getTemplatePreviewContext,
} from '@/lib/settings/settingsService';

export const metadata = {
  title: 'Pengaturan | AAA Sport Academy',
  description: 'Kelola profil akun dan pengaturan sistem AAA Sport Academy.',
};

function SettingsPageSkeleton() {
  return (
    <div role="status" aria-label="Memuat pengaturan" className="space-y-4 sm:space-y-6">
      <span className="sr-only">Memuat pengaturan dari database...</span>
      <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card padded className="xl:col-span-2">
          <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-11 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        </Card>
        <Card padded>
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        </Card>
      </div>
    </div>
  );
}

function ProfileOnlySettings() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Profil &amp; Keamanan
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
          Perbarui data akun dan password login Anda. Pengaturan sistem hanya
          tersedia untuk Superadmin.
        </p>
      </section>
      <ProfileSettingsSection />
    </div>
  );
}

function SettingsDatabaseAlert() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-amber-900">
        <h2 className="text-xl font-extrabold">Pengaturan sistem belum tersedia di database</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Jalankan migration dan seeder terbaru terlebih dahulu agar tabel
          pengaturan sistem, template notifikasi, konten landing, campaign,
          artikel, dan lead awal dibuat di MySQL. Tab profil akun tetap dapat
          digunakan di bawah ini.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-relaxed text-white">
{`npx prisma migrate dev --name full_database
npx prisma generate
npm run seed`}
        </pre>
      </div>
      <ProfileSettingsSection />
    </div>
  );
}

async function SettingsContent() {
  const currentUser = await requireCurrentUser('/dashboard/settings');

  if (currentUser.role !== 'SUPERADMIN') {
    return <ProfileOnlySettings />;
  }

  try {
    const [settings, backupHistory, templatePreviewContext, financialPreviewSample] =
      await Promise.all([
        getSystemSettings(),
        listDatabaseBackups(currentUser),
        getTemplatePreviewContext(),
        getFinancialPreviewSample(),
      ]);

    if (!settings) return <SettingsDatabaseAlert />;

    return (
      <SystemSettingsManager
        initialSettings={settings}
        initialBackupHistory={backupHistory}
        templatePreviewContext={templatePreviewContext}
        financialPreviewSample={financialPreviewSample}
      />
    );
  } catch (error) {
    console.error('[settings-page]', error);
    return <SettingsDatabaseAlert />;
  }
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
