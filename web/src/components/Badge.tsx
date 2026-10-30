import type { BatchStatus, ItemStatus } from '../types.ts'

const LABELS: Record<BatchStatus | ItemStatus, string> = {
  DRAFT: 'Borrador',
  COMPLETED: 'Completado',
  PARTIAL: 'Parcial',
  FAILED: 'Fallido',
  PENDING: 'Pendiente',
  PAID: 'Pagado',
}

export function Badge({ status }: { status: BatchStatus | ItemStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{LABELS[status]}</span>
}
