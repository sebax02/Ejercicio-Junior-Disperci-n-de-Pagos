import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, api } from '../api.ts'
import { Badge } from '../components/Badge.tsx'
import type { BatchDetail, Beneficiary } from '../types.ts'
import { validateItem } from '../validation.ts'

function formatAmount(value: string | number) {
  return Number(value).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [batch, setBatch] = useState<BatchDetail | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const isDraft = batch?.status === 'DRAFT'

  async function load(batchId: string) {
    const [detail, people] = await Promise.all([
      api.getBatch(batchId),
      api.listBeneficiaries(),
    ])
    setBatch(detail)
    setBeneficiaries(people)
  }

  useEffect(() => {
    if (!id) return
    load(id)
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'No se pudo cargar')
      })
      .finally(() => setLoading(false))
  }, [id])

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id) return
    const nextErrors = validateItem({
      beneficiary_id: beneficiaryId,
      amount,
    })
    setErrors(nextErrors)
    setMessage('')
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      await api.addItem(id, {
        beneficiary_id: beneficiaryId,
        amount: amount.trim(),
      })
      const detail = await api.getBatch(id)
      setBatch(detail)
      setAmount('')
      setBeneficiaryId('')
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message)
        return
      }
      setMessage('No se pudo agregar el pago')
    }
  }

  async function onRemove(itemId: string) {
    if (!id) return
    setMessage('')
    try {
      await api.removeItem(id, itemId)
      setBatch(await api.getBatch(id))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo quitar')
    }
  }

  async function onProcess() {
    if (!id) return
    setMessage('')
    try {
      setBatch(await api.processBatch(id))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo procesar')
    }
  }

  if (loading) {
    return <p>Cargando…</p>
  }
  if (!batch) {
    return <p className="banner error">{message || 'Lote no encontrado'}</p>
  }

  return (
    <section>
      <p>
        <Link to="/lotes">← Lotes</Link>
      </p>
      <div className="page-head">
        <div>
          <h1>{batch.name}</h1>
          <p className="muted">
            Total del lote: <strong>{formatAmount(batch.total_amount)}</strong>
          </p>
        </div>
        <Badge status={batch.status} />
      </div>

      {message ? <p className="banner error">{message}</p> : null}

      {isDraft ? (
        <>
          <form className="card form-row" onSubmit={onAdd} noValidate>
            <label>
              Beneficiario
              <select
                value={beneficiaryId}
                onChange={(event) => setBeneficiaryId(event.target.value)}
                aria-invalid={Boolean(errors.beneficiary_id)}
              >
                <option value="">Selecciona…</option>
                {beneficiaries.map((beneficiary) => (
                  <option key={beneficiary.id} value={beneficiary.id}>
                    {beneficiary.name} ({beneficiary.document_id})
                  </option>
                ))}
              </select>
              {errors.beneficiary_id ? (
                <span className="field-error">{errors.beneficiary_id}</span>
              ) : null}
            </label>
            <label>
              Monto
              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount ? (
                <span className="field-error">{errors.amount}</span>
              ) : null}
            </label>
            <button type="submit">Agregar pago</button>
          </form>
          <button
            type="button"
            onClick={() => void onProcess()}
            disabled={batch.items.length === 0}
          >
            Procesar
          </button>
        </>
      ) : (
        <p className="muted">Este lote ya fue procesado. No se pueden agregar ni quitar pagos.</p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Beneficiario</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Motivo</th>
              {isDraft ? <th></th> : null}
            </tr>
          </thead>
          <tbody>
            {batch.items.map((item) => (
              <tr key={item.id}>
                <td>{item.beneficiary?.name ?? item.beneficiary_id}</td>
                <td>{formatAmount(item.amount)}</td>
                <td>
                  <Badge status={item.status} />
                </td>
                <td>{item.failure_reason ?? '—'}</td>
                {isDraft ? (
                  <td>
                    <button type="button" className="linkish" onClick={() => void onRemove(item.id)}>
                      Quitar
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
