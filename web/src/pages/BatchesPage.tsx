import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.ts'
import { Badge } from '../components/Badge.tsx'
import type { DisbursementBatch } from '../types.ts'
import { validateBatchName } from '../validation.ts'

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CO')
}

function formatAmount(value: string | number) {
  return Number(value).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function BatchesPage() {
  const [batches, setBatches] = useState<DisbursementBatch[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listBatches()
      .then(setBatches)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se pudo cargar')
      })
      .finally(() => setLoading(false))
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateBatchName(name)
    setFieldError(errors.name ?? '')
    setError('')
    if (errors.name) {
      return
    }

    try {
      const created = await api.createBatch({ name: name.trim() })
      setBatches((current) => [created, ...current])
      setName('')
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el lote')
    }
  }

  return (
    <section>
      <div className="page-head">
        <h1>Lotes</h1>
        <button type="button" onClick={() => setOpen((value) => !value)}>
          Nuevo lote
        </button>
      </div>

      {open ? (
        <form className="card form-row" onSubmit={onSubmit} noValidate>
          <label>
            Nombre
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(fieldError)}
            />
            {fieldError ? <span className="field-error">{fieldError}</span> : null}
          </label>
          <button type="submit">Crear</button>
        </form>
      ) : null}

      {error ? <p className="banner error">{error}</p> : null}
      {loading ? <p>Cargando…</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td>
                  <Link to={`/lotes/${batch.id}`}>{batch.name}</Link>
                </td>
                <td>
                  <Badge status={batch.status} />
                </td>
                <td>{formatAmount(batch.total_amount)}</td>
                <td>{formatDate(batch.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
