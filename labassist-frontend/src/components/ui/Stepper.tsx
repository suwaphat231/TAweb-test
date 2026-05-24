interface Props {
  steps: { label: string }[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
      {steps.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? 'var(--green)' : active ? 'var(--primary)' : 'var(--line)',
                color: done || active ? '#fff' : 'var(--ink-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                boxShadow: active ? '0 0 0 4px var(--primary-100)' : 'none',
                transition: 'background .2s, box-shadow .2s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: active ? 'var(--primary)' : done ? 'var(--green)' : 'var(--ink-400)' }}>
                {step.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? 'var(--green)' : 'var(--line)', marginBottom: 26, transition: 'background .2s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
