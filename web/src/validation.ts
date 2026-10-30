const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type FieldErrors = Record<string, string>

export function required(value: string, label: string): string | undefined {
  if (!value.trim()) {
    return `${label} es obligatorio`
  }
  return undefined
}

export function validateBeneficiary(form: {
  name: string
  document_id: string
  bank: string
  account_number: string
  email: string
}): FieldErrors {
  const errors: FieldErrors = {}
  const name = required(form.name, 'El nombre')
  const documentId = required(form.document_id, 'El documento')
  const bank = required(form.bank, 'El banco')
  const account = required(form.account_number, 'El número de cuenta')

  if (name) errors.name = name
  if (documentId) errors.document_id = documentId
  if (bank) errors.bank = bank
  if (account) errors.account_number = account
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'El correo no es válido'
  }

  return errors
}

export function validateBatchName(name: string): FieldErrors {
  const error = required(name, 'El nombre del lote')
  return error ? { name: error } : {}
}

export function validateItem(form: {
  beneficiary_id: string
  amount: string
}): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.beneficiary_id) {
    errors.beneficiary_id = 'Selecciona un beneficiario'
  }
  if (!form.amount.trim()) {
    errors.amount = 'El monto es obligatorio'
  } else if (!AMOUNT_PATTERN.test(form.amount.trim())) {
    errors.amount = 'Usa un monto positivo con máximo 2 decimales'
  } else if (Number(form.amount) <= 0) {
    errors.amount = 'El monto debe ser mayor a 0'
  }
  return errors
}
