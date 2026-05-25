import { useState, useMemo } from 'react'
import { FilterChips } from '../../components/ui/FilterChips'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'

interface Doc {
  id: number
  name: string
  type: 'memo' | 'contract' | 'payment'
  course: string
  person: string
  date: string
  status: 'draft' | 'pending' | 'approved'
}

const TYPE_OPTIONS = [
  { value: '', label: 'ทุกประเภท' },
  { value: 'memo', label: 'บันทึกข้อความ' },
  { value: 'contract', label: 'สัญญาจ้าง' },
  { value: 'payment', label: 'การจ่ายเงิน' },
]
const STATUS_OPTIONS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'draft', label: 'ร่าง' },
  { value: 'pending', label: 'รออนุมัติ' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
]
const COURSE_OPTIONS = [
  { value: 'CS101', label: 'CS101' },
  { value: 'CS221', label: 'CS221' },
  { value: 'CS321', label: 'CS321' },
]
const PERSON_OPTIONS = [
  { value: 'ปกป้อง วงศ์ไทย', label: 'ปกป้อง วงศ์ไทย' },
  { value: 'ภูมิพัฒน์ สีเขียว', label: 'ภูมิพัฒน์ สีเขียว' },
  { value: 'นภัสรา จันทรเดช', label: 'นภัสรา จันทรเดช' },
]

const typeLabel: Record<string, string> = { memo: 'บันทึกข้อความ', contract: 'สัญญาจ้าง', payment: 'การจ่ายเงิน' }
const statusToCustom: Record<string, string> = { draft: 'draft', pending: 'closing_soon', approved: 'open' }

const INITIAL_DOCS: Doc[] = [
  { id:1, name:'บันทึกข้อความ TA CS101/1/2567',       type:'memo',     course:'CS101', person:'ปกป้อง วงศ์ไทย',     date:'2567-09-15', status:'approved' },
  { id:2, name:'สัญญาจ้าง TA CS221/1/2567',           type:'contract', course:'CS221', person:'ภูมิพัฒน์ สีเขียว',  date:'2567-09-10', status:'pending'  },
  { id:3, name:'หลักฐานจ่ายเงิน CS101 เดือน ก.ย.',   type:'payment',  course:'CS101', person:'ปกป้อง วงศ์ไทย',     date:'2567-09-30', status:'draft'    },
  { id:4, name:'บันทึกข้อความ LabBoy CS221',          type:'memo',     course:'CS221', person:'นภัสรา จันทรเดช',   date:'2567-09-12', status:'approved' },
]

const FORM_EMPTY = { type: '', course: '', person: '', note: '' }

export default function StaffDocs() {
  const [docs, setDocs] = useState<Doc[]>(INITIAL_DOCS)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(FORM_EMPTY)
  const showToast = useToast()

  const filtered = useMemo(() => {
    let list = [...docs]
    if (typeFilter)   list = list.filter((d) => d.type === typeFilter)
    if (statusFilter) list = list.filter((d) => d.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.course.toLowerCase().includes(q))
    }
    return list
  }, [docs, typeFilter, statusFilter, search])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.type || !form.course || !form.person) return
    const label = typeLabel[form.type]
    const newDoc: Doc = {
      id: Date.now(),
      name: `${label} ${form.course} — ${form.person}`,
      type: form.type as Doc['type'],
      course: form.course,
      person: form.person,
      date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
      status: 'draft',
    }
    setDocs((prev) => [newDoc, ...prev])
    setForm(FORM_EMPTY)
    setShowCreate(false)
    showToast(`สร้างเอกสาร "${newDoc.name}" สำเร็จ`, 'success')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-900)' }}>จัดการเอกสาร</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 4 }}>{docs.length} เอกสาร</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ สร้างเอกสาร</Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <FilterChips options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />
        <div style={{ width: 1, height: 28, background: 'var(--line)' }} />
        <FilterChips options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อหรือรายวิชา..."
          style={{
            padding: '7px 12px', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-input)',
            fontSize: 13, color: 'var(--ink-900)', outline: 'none', minWidth: 200,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', overflow: 'auto', boxShadow: 'var(--shadow-md)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: 'var(--bg)', borderBottom: '1.5px solid var(--line)' }}>
              {['ชื่อเอกสาร', 'ประเภท', 'รายวิชา', 'ชื่อบุคคล', 'วันที่', 'สถานะ', ''].map((h) => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>ไม่พบเอกสาร</td></tr>
            ) : filtered.map((doc, i) => (
              <tr key={doc.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--line-soft)' : 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: 'var(--ink-900)', maxWidth: 280 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                </td>
                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 12, background: 'var(--line-soft)', padding: '2px 8px', borderRadius: 999, color: 'var(--ink-700)', fontWeight: 600 }}>
                    {typeLabel[doc.type]}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>{doc.course}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-700)' }}>{doc.person}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{doc.date}</td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusBadge value={statusToCustom[doc.status]} />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button title="ดู" style={iconBtn} onClick={() => showToast(`กำลังเปิด: ${doc.name}`, 'info')}>
                      <EyeIcon />
                    </button>
                    {doc.status === 'draft' && (
                      <button title="แก้ไข" style={iconBtn} onClick={() => showToast('ฟีเจอร์นี้กำลังพัฒนา', 'info')}>
                        <EditIcon />
                      </button>
                    )}
                    <button title="ดาวน์โหลด" style={iconBtn} onClick={() => showToast(`กำลังดาวน์โหลด: ${doc.name}`, 'info')}>
                      <DownloadIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="สร้างเอกสารใหม่" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select
            label="ประเภทเอกสาร *"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            options={[{ value: '', label: '— เลือกประเภท —' }, { value: 'memo', label: 'บันทึกข้อความ' }, { value: 'contract', label: 'สัญญาจ้าง' }, { value: 'payment', label: 'การจ่ายเงิน' }]}
            required
          />
          <Select
            label="รายวิชา *"
            value={form.course}
            onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
            options={[{ value: '', label: '— เลือกวิชา —' }, ...COURSE_OPTIONS]}
            required
          />
          <Select
            label="ชื่อบุคคล *"
            value={form.person}
            onChange={(e) => setForm((f) => ({ ...f, person: e.target.value }))}
            options={[{ value: '', label: '— เลือกบุคคล —' }, ...PERSON_OPTIONS]}
            required
          />
          <Textarea
            label="หมายเหตุ"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={3}
            placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
            <Button type="submit">สร้างเอกสาร</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--line)', borderRadius: 6,
  cursor: 'pointer', color: 'var(--ink-500)', padding: '4px 6px',
  display: 'flex', alignItems: 'center',
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}
