import { useState } from 'react'
import type { Course } from '../../types'
import { Card } from '../ui/Card'
import { StatusBadge, Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface Props {
  course: Course
  onApply?: (courseId: number, roleApplied: 'ta' | 'labboy') => void
  isApplied?: boolean
  appliedRole?: 'ta' | 'labboy'
}

export function CourseCard({ course, onApply, isApplied = false, appliedRole }: Props) {
  const [showMenu, setShowMenu] = useState(false)

  const taSlotsAvailable  = course.ta_slots > 0 && course.ta_accepted < course.ta_slots
  const labBoySlotsAvailable = course.labboy_slots > 0 && course.labboy_accepted < course.labboy_slots
  const hasAnySlot = course.ta_slots > 0 || course.labboy_slots > 0
  const allFull = hasAnySlot && !taSlotsAvailable && !labBoySlotsAvailable

  const deadline = course.deadline
    ? new Date(course.deadline).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
    : null

  function handleApply(role: 'ta' | 'labboy') {
    onApply?.(course.id, role)
    setShowMenu(false)
  }

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: 'var(--primary)', background: 'var(--primary-50)',
          padding: '2px 10px', borderRadius: 'var(--radius-pill)',
        }}>
          {course.code}
        </span>
        <StatusBadge value={course.status} />
      </div>

      {/* Title */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.4, marginBottom: 8 }}>
          {course.title}
        </h3>

        {/* Instructor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--ink-500)', marginBottom: 4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          {course.instructor_name}
        </div>

        {/* Deadline */}
        {deadline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--ink-400)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ปิดรับ {deadline}
          </div>
        )}
      </div>

      {/* Slot info */}
      <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', gap: 10 }}>
        {course.ta_slots > 0 && (
          <SlotBar label="TA" filled={course.ta_accepted} total={course.ta_slots} />
        )}
        {course.labboy_slots > 0 && (
          <SlotBar label="Lab Boy" filled={course.labboy_accepted} total={course.labboy_slots} />
        )}
      </div>

      {/* Footer actions */}
      <div style={{ paddingTop: 4, borderTop: '1px solid var(--line-soft)' }}>
        {course.status === 'closed' || course.status === 'draft' ? (
          <Badge variant="gray">ปิดรับ</Badge>
        ) : isApplied ? (
          <Badge variant="green">
            สมัครแล้ว ({appliedRole === 'ta' ? 'TA' : 'Lab Boy'})
          </Badge>
        ) : allFull ? (
          <Button size="sm" variant="outline" disabled style={{ cursor: 'not-allowed' }}>เต็มแล้ว</Button>
        ) : !showMenu ? (
          <Button size="sm" onClick={() => setShowMenu(true)}>สมัคร</Button>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {taSlotsAvailable && (
              <Button size="sm" onClick={() => handleApply('ta')}>สมัคร TA</Button>
            )}
            {labBoySlotsAvailable && (
              <Button size="sm" variant="outline" onClick={() => handleApply('labboy')}>สมัคร Lab Boy</Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setShowMenu(false)}>ยกเลิก</Button>
          </div>
        )}
      </div>
    </Card>
  )
}

function SlotBar({ label, filled, total }: { label: string; filled: number; total: number }) {
  const pct = Math.min((filled / total) * 100, 100)
  const full = filled >= total
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ color: full ? 'var(--red)' : 'var(--ink-400)' }}>{filled}/{total}</span>
      <div style={{ width: 36, height: 4, background: 'var(--line)', borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: full ? 'var(--red)' : 'var(--green)', borderRadius: 4 }} />
      </div>
    </div>
  )
}
