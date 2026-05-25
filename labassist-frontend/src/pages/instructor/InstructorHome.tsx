import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { instructorApi } from '../../services/api'
import { StatCard } from '../../components/ui/StatCard'
import { Skeleton } from '../../components/ui/Skeleton'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export default function InstructorHome() {
  const { user } = useAuth()
  const { data: courses = [], isLoading } = useQuery({ queryKey: ['instructor-courses'], queryFn: instructorApi.courses })

  const openCount   = courses.filter((c) => c.status === 'open' || c.status === 'closing_soon').length
  const totalTA     = courses.reduce((s, c) => s + c.ta_slots, 0)
  const acceptedTA  = courses.reduce((s, c) => s + c.ta_accepted, 0)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>
          สวัสดี, {user?.full_name}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 4 }}>ภาพรวมวิชาที่คุณรับผิดชอบ</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
          {[1,2,3].map(i => <Skeleton key={i} height={88} borderRadius={12} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="วิชาทั้งหมด"   value={courses.length} icon="📚" iconColor="var(--primary)" />
          <StatCard label="กำลังเปิดรับ"  value={openCount}      icon="✅" iconColor="var(--green)" />
          <StatCard label="TA รับแล้ว"    value={`${acceptedTA}/${totalTA}`} icon="👥" iconColor="var(--accent)" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/instructor/announce"><Button>จัดการประกาศ</Button></Link>
        <Link to="/instructor/select"><Button variant="outline">คัดเลือกผู้สมัคร</Button></Link>
      </div>
    </div>
  )
}
