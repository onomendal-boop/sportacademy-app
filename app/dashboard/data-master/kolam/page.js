import { redirect } from 'next/navigation';

// Route lama "Kolam Partner" dipertahankan sebagai redirect agar bookmark
// atau link lama tidak menjadi 404 setelah diganti menjadi Tempat Latihan.
export default function LegacyPoolPage() {
  redirect('/dashboard/data-master/tempat-latihan');
}
