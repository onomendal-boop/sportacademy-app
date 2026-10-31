import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan class Tailwind secara aman.
 * Contoh: cn('px-4 text-slate-500', isActive && 'text-[#0066CC]', 'px-6')
 * akan menghasilkan class px-6 terakhir dan warna yang tidak konflik.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
