import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      {icon && <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--ink-400)', display: 'flex', justifyContent: 'center' }}>{icon}</div>}
      <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>{title}</h3>
      {description && <p style={{ fontSize: 14, color: 'var(--ink-400)', marginBottom: 20 }}>{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-btn)', padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
