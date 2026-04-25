export default function DataTable({ columns, rows, emptyMessage = "No records found." }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-glass">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.22em] text-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-ivory">
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={row.id || row._id || index} className="hover:bg-white/[0.03]">
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-4 align-top">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-10 text-center text-muted" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

