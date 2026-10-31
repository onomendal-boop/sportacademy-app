/**
 * Card - AAA Sport Academy
 *
 * Contoh pemakaian sederhana:
 * <Card title="Total Siswa" description="Data bulan ini" action={<Button>Detail</Button>}>
 *   <p className="text-3xl font-bold">128</p>
 * </Card>
 *
 * Contoh pemakaian compose (gaya Shadcn/UI):
 * <Card>
 *   <CardHeader>
 *     <div>
 *       <CardTitle>Daftar Siswa</CardTitle>
 *       <CardDescription>Kelola data siswa aktif.</CardDescription>
 *     </div>
 *   </CardHeader>
 *   <CardContent>...</CardContent>
 *   <CardFooter>...</CardFooter>
 * </Card>
 */

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function Card({
  children,
  className = '',
  title,
  description,
  action,
  footer,
  contentClassName = '',
  padded = false,
  hover = false,
  ...props
}) {
  const hasHeader = Boolean(title || description || action);
  const shouldWrapChildren = Boolean(hasHeader || footer || padded);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-900/[0.02]',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-600/5',
        className
      )}
      {...props}
    >
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title ? (
              <h3 className="truncate text-base font-bold text-slate-900">{title}</h3>
            ) : null}

            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
            ) : null}
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      {shouldWrapChildren ? (
        <div className={cn('px-5 py-4 sm:px-6 sm:py-5', contentClassName)}>{children}</div>
      ) : (
        children
      )}

      {footer ? (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">{footer}</div>
      ) : null}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={cn('text-base font-bold leading-snug text-slate-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={cn('mt-1 text-sm leading-relaxed text-slate-500', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={cn('px-5 py-4 sm:px-6 sm:py-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
