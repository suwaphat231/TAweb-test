import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

const sizeMap = { sm: 400, md: 520, lg: 720 }

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,18,32,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(.95) translateY(8px); } to { opacity:1; transform:none; } }`}</style>
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: sizeMap[size],
          maxHeight: '90vh',
          overflow: 'auto',
          animation: 'modalIn .15s ease',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-900)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', fontSize: 22, lineHeight: 1, padding: '2px 6px', borderRadius: 6 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
        {footer && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
