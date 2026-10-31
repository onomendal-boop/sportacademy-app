import { redirect } from 'next/navigation';

// Root grup Operasional diarahkan ke halaman Jadwal Keseluruhan.
export default function OperationalIndexPage() {
  redirect('/dashboard/operasional/jadwal');
}
