'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Anak saya belum pernah belajar renang. Program apa yang cocok?',
    answer:
      'Program AAA Pemula adalah titik awal yang paling umum. Pada sesi pertama, pelatih akan menilai keberanian anak di air, kemampuan mengapung, dan kontrol napas, lalu merekomendasikan kelompok yang paling aman.',
  },
  {
    question: 'Apakah tersedia kelas trial sebelum membeli paket?',
    answer:
      'Ya. Calon siswa dapat mengikuti trial/asesmen sesuai ketersediaan slot. Setelah trial, orang tua menerima rekomendasi level dan pilihan jadwal sebelum memutuskan paket yang akan diambil.',
  },
  {
    question: 'Apa saja yang perlu dibawa saat latihan pertama?',
    answer:
      'Siapkan pakaian renang, topi renang, kacamata renang, handuk, pakaian ganti, botol minum, dan kantong pakaian basah. Untuk anak dengan kondisi kesehatan tertentu, mohon informasikan kepada admin dan pelatih sebelum sesi dimulai.',
  },
  {
    question: 'Bagaimana jika anak berhalangan hadir pada jadwal kelas?',
    answer:
      'Kebijakan penggantian kelas mengikuti syarat paket dan ketersediaan slot. Hubungi admin sesegera mungkin sebelum jadwal dimulai agar tim dapat membantu memeriksa opsi reschedule.',
  },
  {
    question: 'Apa perbedaan kelas grup dan Private?',
    answer:
      'Kelas grup melatih anak dalam kelompok kecil sesuai level sehingga ada unsur sosial dan permainan bersama. Private bersifat satu siswa dengan satu pelatih, jadwalnya lebih fleksibel, dan materi difokuskan pada kebutuhan individu.',
  },
  {
    question: 'Bagaimana orang tua memantau progres anak?',
    answer:
      'Pelatih mencatat perkembangan teknik dan keberanian anak secara berkala. Orang tua dapat berkonsultasi dengan pelatih/admin untuk mengetahui target berikutnya dan kesiapan naik level.',
  },
];

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div
            key={faq.question}
            className={cn(
              'overflow-hidden rounded-2xl border bg-white transition-colors',
              isOpen ? 'border-blue-200 shadow-lg shadow-blue-950/5' : 'border-slate-200'
            )}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
              >
                <span className="font-bold leading-snug text-slate-900">{faq.question}</span>
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                    isOpen ? 'rotate-180 bg-[#0066CC] text-white' : 'bg-blue-50 text-[#0066CC]'
                  )}
                >
                  <ChevronDown className="h-5 w-5" />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                'grid transition-all duration-300 ease-in-out',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6 sm:text-base">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex flex-col gap-3 rounded-2xl bg-blue-50 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-bold text-slate-900">Masih ada pertanyaan?</span>{' '}
          Tim admin siap membantu memilih jadwal dan level.
        </p>
        <a
          href="https://wa.me/6281234567890?text=Halo%20AAA%20Sport%20Academy%2C%20saya%20ingin%20bertanya%20tentang%20les%20renang."
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#0066CC] px-4 py-2.5 font-bold text-white transition-colors hover:bg-[#0052A3]"
        >
          <MessageCircle className="h-4 w-4" />
          Chat Admin
        </a>
      </div>
    </div>
  );
}
