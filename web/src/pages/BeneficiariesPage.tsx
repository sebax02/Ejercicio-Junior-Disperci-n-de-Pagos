import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, api } from '../api.ts'
import type { Beneficiary } from '../types.ts'
import { validateBeneficiary } from '../validation.ts'

const EMPTY_FORM = {
  name: '',
  document_id: '',
  bank: '',
  account_number: '',
  email: '',
}

export function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listBeneficiaries()
      .then(setBeneficiaries)
      .catch((error: unknown) => {
        setFormError(error instanceof Error ? error.message : 'No se pudo cargar')
      })
      .finally(() => setLoading(false))
  }, [])

  function update(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateBeneficiary(form)
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      const created = await api.createBeneficiary({
        name: form.name.trim(),
        document_id: form.document_id.trim(),
        bank: form.bank.trim(),
        account_number: form.account_number.trim(),
        email: form.email.trim() || undefined,
      })
      setBeneficiaries((current) => [created, ...current])
      setForm(EMPTY_FORM)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError(error.message)
        return
      }
      setFormError(error instanceof Error ? error.message : 'No se pudo crear')
    }
  }

  return (
    <section>
      <h1>Beneficiarios</h1>
      <form className="card form-grid" onSubmit={onSubmit} noValidate>
        <label>
          Nombre
          <input
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>
        <label>
          Documento
          <input
            value={form.document_id}
            onChange={(event) => update('document_id', event.target.value)}
            aria-invalid={Boolean(errors.document_id)}
          />
          {errors.document_id ? (
            <span className="field-error">{errors.document_id}</span>
          ) : null}
        </label>
        <label>
          Banco
          <input
            value={form.bank}
            onChange={(event) => update('bank', event.target.value)}
            aria-invalid={Boolean(errors.bank)}
          />
          {errors.bank ? <span className="field-error">{errors.bank}</span> : null}
        </label>
        <label>
          Número de cuenta
          <input
            value={form.account_number}
            onChange={(event) => update('account_number', event.target.value)}
            aria-invalid={Boolean(errors.account_number)}
          />
          {errors.account_number ? (
            <span className="field-error">{errors.account_number}</span>
          ) : null}
        </label>
        <label className="span-2">
          Correo (opcional)
          <input
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </label>
        {formError ? <p className="banner error span-2">{formError}</p> : null}
        <button className="span-2" type="submit">
          Crear beneficiario
        </button>
      </form>

      {loading ? <p>Cargando…</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Banco</th>
              <th>Cuenta</th>
              <th>Correo</th>
            </tr>
          </thead>
          <tbody>
            {beneficiaries.map((beneficiary) => (
              <tr key={beneficiary.id}>
                <td>{beneficiary.name}</td>
                <td>{beneficiary.document_id}</td>
                <td>{beneficiary.bank}</td>
                <td>{beneficiary.account_number}</td>
                <td>{beneficiary.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
