import { useQuery } from '@tanstack/react-query'
import { coursesAPI } from '../../services/api'
import { Table } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import type { Course } from '../../types'

export default function AdminCourses() {
  const { data: courses = [], isLoading } = useQuery({ queryKey: ['all-courses'], queryFn: () => coursesAPI.getAll() })

  const columns = [
    { key: 'code',  header: 'รหัสวิชา', render: (c: Course) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.code}</span> },
    { key: 'title', header: 'ชื่อวิชา', render: (c: Course) => <span style={{ fontWeight: 600 }}>{c.title}</span> },
    { key: 'instructor_name', header: 'อาจารย์', render: (c: Course) => <span style={{ fontSize: 13 }}>{c.instructor_name}</span> },
    {
      key: 'slots', header: 'Slots',
      render: (c: Course) => (
        <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>
          TA {c.ta_accepted}/{c.ta_slots} · Lab Boy {c.labboy_accepted}/{c.labboy_slots}
        </span>
      ),
    },
    { key: 'status', header: 'สถานะ', render: (c: Course) => <StatusBadge value={c.status} /> },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>จัดการรายวิชา</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 4 }}>{courses.length} วิชา</p>
      </div>

      {isLoading
        ? <Skeleton lines={6} height={48} />
        : <Table columns={columns as never} data={courses as never} />
      }
    </div>
  )
}
