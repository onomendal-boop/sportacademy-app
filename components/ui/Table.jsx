/**
 * Table - AAA Sport Academy
 *
 * Mode 1 - Data-driven (disarankan untuk halaman CRUD):
 * <Table
 *   loading={isLoading}
 *   data={students}
 *   columns={[
 *     { key: 'name', label: 'Nama Siswa' },
 *     { key: 'program', label: 'Program' },
 *     {
 *       key: 'status',
 *       label: 'Status',
 *       render: (row) => <Badge status={row.status} />,
 *     },
 *     {
 *       key: 'actions',
 *       label: 'Aksi',
 *       align: 'right',
 *       render: (row) => <Button size="sm" variant="secondary">Detail</Button>,
 *     },
 *   ]}
 * />
 *
 * Mode 2 - Compose dengan children (gaya Shadcn/UI):
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Nama</TableHead>
 *       <TableHead align="right">Aksi</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>Budi Santoso</TableCell>
 *       <TableCell align="right">...</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 */

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function getAlignClass(align = 'left') {
  return alignStyles[align] ?? alignStyles.left;
}

function getRowKey(row, rowKey, index) {
  if (typeof rowKey === 'function') return rowKey(row, index);
  if (rowKey && row?.[rowKey] !== undefined && row?.[rowKey] !== null) return row[rowKey];
  return index;
}

function getCellValue(row, column, index) {
  if (typeof column.render === 'function') return column.render(row, index);
  if (typeof column.accessor === 'function') return column.accessor(row, index);

  const key = column.accessor ?? column.key;
  const value = key ? row?.[key] : undefined;

  return value === undefined || value === null || value === '' ? '-' : value;
}

export function Table({
  children,
  className = '',
  containerClassName = '',
  columns = [],
  data = [],
  rowKey = 'id',
  loading = false,
  loadingRows = 5,
  emptyMessage = 'Tidak ada data',
  emptyDescription = 'Data akan muncul di sini setelah ditambahkan.',
  emptyState,
  onRowClick,
  striped = false,
  minWidthClassName = 'min-w-[720px]',
  ...props
}) {
  const columnCount = columns.length || 4;
  const showEmpty = !loading && !children && (!data || data.length === 0);

  return (
    <div
      aria-busy={loading || undefined}
      className={cn(
        'relative w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]',
        containerClassName
      )}
    >
      <table
        className={cn('w-full caption-bottom border-collapse text-left text-sm', minWidthClassName, className)}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.key ?? column.label}
                    align={column.align}
                    className={column.headClassName}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: loadingRows }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                    {Array.from({ length: columnCount }).map((__, colIndex) => (
                      <TableCell key={`skeleton-${rowIndex}-${colIndex}`}>
                        <div
                          className={cn(
                            'h-4 animate-pulse rounded bg-slate-200',
                            colIndex === 0 ? 'w-3/4' : colIndex === columnCount - 1 ? 'ml-auto w-16' : 'w-1/2'
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : showEmpty ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columnCount} className="px-6 py-12 text-center">
                    {emptyState ?? (
                      <div className="mx-auto max-w-sm">
                        <p className="text-sm font-bold text-slate-900">{emptyMessage}</p>
                        {emptyDescription ? (
                          <p className="mt-1 text-sm leading-relaxed text-slate-500">{emptyDescription}</p>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => (
                  <TableRow
                    key={getRowKey(row, rowKey, rowIndex)}
                    onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      striped && rowIndex % 2 === 1 && 'bg-slate-50/60'
                    )}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key ?? column.label}
                        align={column.align}
                        className={column.cellClassName}
                      >
                        {getCellValue(row, column, rowIndex)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </>
        )}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={cn('bg-slate-50 [&_tr]:border-b [&_tr]:border-slate-200', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableFooter({ children, className = '', ...props }) {
  return (
    <tfoot
      className={cn('border-t border-slate-200 bg-slate-50 font-medium text-slate-700 [&>tr]:last:border-b-0', className)}
      {...props}
    >
      {children}
    </tfoot>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr
      className={cn('border-b border-slate-100 transition-colors hover:bg-blue-50/60', className)}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', align = 'left', ...props }) {
  return (
    <th
      scope="col"
      className={cn(
        'h-11 whitespace-nowrap px-4 align-middle text-xs font-bold uppercase tracking-wider text-slate-500',
        getAlignClass(align),
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', align = 'left', ...props }) {
  return (
    <td
      className={cn('px-4 py-3.5 align-middle text-sm text-slate-600', getAlignClass(align), className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableCaption({ children, className = '', ...props }) {
  return (
    <caption className={cn('mt-4 text-sm text-slate-500', className)} {...props}>
      {children}
    </caption>
  );
}

export function TableEmpty({ children, className = '', colSpan = 1, ...props }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className={cn('px-6 py-12 text-center', className)} {...props}>
        {children ?? (
          <div className="mx-auto max-w-sm">
            <p className="text-sm font-bold text-slate-900">Tidak ada data</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Data akan muncul di sini setelah ditambahkan.
            </p>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export default Table;
