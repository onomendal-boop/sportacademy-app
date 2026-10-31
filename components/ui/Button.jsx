/**
 * Button - AAA Sport Academy
 *
 * Variant utama: primary | secondary | danger
 * Variant tambahan: outline | ghost
 * Size: sm | md | lg | icon
 *
 * Contoh:
 * <Button variant="primary">Simpan</Button>
 * <Button variant="secondary">Batal</Button>
 * <Button variant="danger" loading>Menghapus...</Button>
 * <Button href="/dashboard/data-master/siswa/tambah" leftIcon={<Plus className="h-4 w-4" />}>
 *   Tambah Siswa
 * </Button>
 */

import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const variantStyles = {
  primary:
    'bg-[#0066CC] text-white shadow-sm shadow-blue-600/25 hover:bg-[#0052A3] active:bg-[#004B94] focus-visible:ring-blue-600/30 disabled:bg-blue-300 disabled:shadow-none',
  secondary:
    'bg-blue-50 text-[#0066CC] hover:bg-blue-100 active:bg-blue-100 focus-visible:ring-blue-600/20 disabled:bg-slate-100 disabled:text-slate-400',
  danger:
    'bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-600/25 disabled:bg-red-300 disabled:shadow-none',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:border-[#0066CC]/40 hover:bg-blue-50 hover:text-[#0066CC] focus-visible:ring-blue-600/20 disabled:border-slate-100 disabled:text-slate-300',
  ghost:
    'bg-transparent text-slate-600 hover:bg-blue-50 hover:text-[#0066CC] focus-visible:ring-blue-600/20 disabled:text-slate-300',
};

const sizeStyles = {
  sm: 'h-9 rounded-lg px-3 text-[13px]',
  md: 'h-10 rounded-xl px-4 text-sm',
  lg: 'h-11 rounded-xl px-6 text-sm sm:h-12 sm:text-base',
  icon: 'h-10 w-10 shrink-0 rounded-xl p-0',
};

export const Button = forwardRef(function Button(
  {
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    type = 'button',
    href,
    disabled = false,
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  const classes = cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold outline-none transition-all duration-150 focus-visible:ring-4 disabled:pointer-events-none disabled:cursor-not-allowed',
    variantStyles[variant] ?? variantStyles.primary,
    sizeStyles[size] ?? sizeStyles.md,
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : leftIcon ? (
        <span className="flex shrink-0 items-center" aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}

      {children}

      {!loading && rightIcon ? (
        <span className="flex shrink-0 items-center" aria-hidden="true">
          {rightIcon}
        </span>
      ) : null}
    </>
  );

  // Mode link: cocok untuk CTA/navigasi, contoh "Tambah Data".
  if (href) {
    if (isDisabled) {
      return (
        <span ref={ref} aria-disabled="true" className={cn(classes, 'pointer-events-none opacity-60')}>
          {content}
        </span>
      );
    }

    return (
      <Link ref={ref} href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button;
