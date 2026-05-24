interface Props {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  lines?: number
}

function SkeletonBar({ width = '100%', height = 16, borderRadius = 8 }: Omit<Props, 'lines'>) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, var(--line-soft) 25%, var(--line) 50%, var(--line-soft) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  )
}

export function Skeleton({ lines = 1, ...props }: Props) {
  return (
    <>
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
      {lines === 1 ? (
        <SkeletonBar {...props} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: lines }).map((_, i) => <SkeletonBar key={i} {...props} />)}
        </div>
      )}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', padding: 24, boxShadow: 'var(--shadow-md)' }}>
      <Skeleton height={20} width="60%" />
      <div style={{ marginTop: 12 }}><Skeleton lines={3} height={14} /></div>
    </div>
  )
}
