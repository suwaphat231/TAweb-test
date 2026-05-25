import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Avatar, getInitials } from '../ui/Avatar'

interface Props {
  title?: string
  breadcrumb?: string
  actions?: ReactNode
  onHamburgerClick?: () => void
}

const routeMeta: Record<string, { title: string; breadcrumb: string }> = {
  '/student/home':        { title: 'หน้าหลัก',           breadcrumb: 'นักศึกษา' },
  '/student/apply':       { title: 'ค้นหาและสมัคร',      breadcrumb: 'นักศึกษา' },
  '/student/status':      { title: 'สถานะการสมัคร',      breadcrumb: 'นักศึกษา' },
  '/student/profile':     { title: 'โปรไฟล์ของฉัน',      breadcrumb: 'นักศึกษา' },
  '/instructor/home':     { title: 'ภาพรวม',             breadcrumb: 'อาจารย์' },
  '/instructor/announce': { title: 'จัดการประกาศ',       breadcrumb: 'อาจารย์' },
  '/instructor/select':   { title: 'คัดเลือกผู้สมัคร',   breadcrumb: 'อาจารย์' },
  '/staff/home':          { title: 'ภาพรวม',             breadcrumb: 'เจ้าหน้าที่' },
  '/staff/docs':          { title: 'จัดการเอกสาร',       breadcrumb: 'เจ้าหน้าที่' },
  '/admin/overview':      { title: 'ภาพรวมระบบ',         breadcrumb: 'ผู้ดูแลระบบ' },
  '/admin/courses':       { title: 'จัดการรายวิชา',      breadcrumb: 'ผู้ดูแลระบบ' },
  '/admin/users':         { title: 'จัดการผู้ใช้งาน',    breadcrumb: 'ผู้ดูแลระบบ' },
}

export function Topbar({ title, breadcrumb, actions, onHamburgerClick }: Props) {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const meta = routeMeta[pathname] ?? { title: '', breadcrumb: '' }
  const resolvedTitle = title ?? meta.title
  const resolvedBreadcrumb = breadcrumb ?? meta.breadcrumb

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      height: 'var(--topbar-h)',
      background: '#fff',
      borderBottom: '1.5px solid var(--line)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)',
      flexShrink: 0,
    }}>
      {/* Left: hamburger (mobile) + breadcrumb + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onHamburgerClick && (
          <button
            onClick={onHamburgerClick}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-700)', padding: 6, borderRadius: 8,
              display: 'flex', alignItems: 'center', marginRight: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        {resolvedBreadcrumb && (
          <>
            <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>{resolvedBreadcrumb}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>/</span>
          </>
        )}
        {resolvedTitle && (
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{resolvedTitle}</span>
        )}
      </div>

      {/* Right: actions + bell + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {actions}

        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-500)', padding: 6, borderRadius: 8,
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--red)', border: '1.5px solid #fff',
          }} />
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--line)' }} />

        {/* Avatar */}
        {user && (
          <Avatar initials={getInitials(user.full_name)} color="blue" size={32} />
        )}
      </div>
    </header>
  )
}
