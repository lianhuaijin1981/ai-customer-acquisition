interface TableColumn<T> {
  key: keyof T | string
  title: string
  width?: string
  render?: (value: unknown, record: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  rowKey?: keyof T | ((record: T) => string)
  loading?: boolean
  emptyText?: string
  onRowClick?: (record: T) => void
}

export function Table<T extends object>({
  columns,
  data,
  rowKey = 'id' as keyof T,
  loading,
  emptyText = '暂无数据',
  onRowClick,
}: TableProps<T>) {
  const getKey = (record: T): string => {
    if (typeof rowKey === 'function') return rowKey(record)
    return String(record[rowKey])
  }

  const getValue = (record: T, key: string): unknown => {
    const keys = key.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return keys.reduce((obj: any, k) => obj?.[k], record)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{ width: col.width }}
                className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>加载中...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span className="text-sm">{emptyText}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((record) => (
              <tr
                key={getKey(record)}
                className={`bg-white hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(record)}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-3 text-gray-700 ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.render
                      ? col.render(getValue(record, String(col.key)), record)
                      : String(getValue(record, String(col.key)) ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// Pagination
interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
      <span className="text-sm text-gray-500">
        显示 {start}-{end} / 共 {total} 条
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          上一页
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
          return (
            <button
              key={pageNum}
              onClick={() => onChange(pageNum)}
              className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                pageNum === page
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          )
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          下一页
        </button>
      </div>
    </div>
  )
}
