import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export default function StaffHome() {
  const { user } = useAuth()
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>
          สวัสดี, {user?.full_name}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 4 }}>ระบบจัดการผู้ช่วยปฏิบัติการ</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>จัดการเอกสาร</div>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 16 }}>อัพโหลดและจัดการเอกสารที่เกี่ยวข้อง</p>
          <Link to="/staff/docs"><Button size="sm">ไปที่เอกสาร</Button></Link>
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>ดูผู้สมัคร</div>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 16 }}>ดูรายชื่อผู้สมัครทุกวิชา</p>
          <Link to="/instructor/select"><Button size="sm" variant="outline">ดูผู้สมัคร</Button></Link>
        </Card>
      </div>
    </div>
  )
}
