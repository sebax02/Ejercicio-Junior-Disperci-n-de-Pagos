import type { BatchDetail, Beneficiary, DisbursementBatch } from './types.ts'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const body: { message?: string | string[] } = await response
    .json()
    .catch(() => ({}))

  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join('. ')
      : (body.message ?? 'Ocurrió un error')
    throw new ApiError(message, response.status)
  }

  return body as T
}

export const api = {
  listBeneficiaries: () => request<Beneficiary[]>('/beneficiaries'),
  createBeneficiary: (payload: {
    name: string
    document_id: string
    bank: string
    account_number: string
    email?: string
  }) =>
    request<Beneficiary>('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listBatches: () => request<DisbursementBatch[]>('/batches'),
  createBatch: (payload: { name: string }) =>
    request<DisbursementBatch>('/batches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getBatch: (id: string) => request<BatchDetail>(`/batches/${id}`),
  addItem: (
    batchId: string,
    payload: { beneficiary_id: string; amount: string },
  ) =>
    request(`/batches/${batchId}/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeItem: (batchId: string, itemId: string) =>
    request<void>(`/batches/${batchId}/items/${itemId}`, { method: 'DELETE' }),
  processBatch: (id: string) =>
    request<BatchDetail>(`/batches/${id}/process`, { method: 'POST' }),
}
