'use client'

export default function AnalyticsError({ error }: { error: Error }) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--danger)' }}>Erro no Analytics</h1>
      <pre className="text-xs p-4 rounded-xl overflow-auto" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
    </div>
  )
}
