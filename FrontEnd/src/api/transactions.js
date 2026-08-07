import { apiFetch } from './client.js'
import { toCamelCase } from '../utils/caseConverter.js'

export async function listTransactions() {
  const data = await apiFetch('/api/transactions')
  return toCamelCase(data)
}

export async function createTransaction({
  categoryId,
  type,
  date,
  amount,
  reference,
  notes,
  paymentMethod,
}) {
  const data = await apiFetch('/api/transactions', {
    method: 'POST',
    body: {
      category_id: categoryId,
      type,
      date,
      amount,
      reference,
      notes,
      payment_method: paymentMethod,
    },
  })
  return toCamelCase(data)
}

export async function updateTransaction(id, patch) {
  const body = {}
  if (patch.categoryId !== undefined) body.category_id = patch.categoryId
  if (patch.type !== undefined) body.type = patch.type
  if (patch.date !== undefined) body.date = patch.date
  if (patch.amount !== undefined) body.amount = patch.amount
  if (patch.reference !== undefined) body.reference = patch.reference
  if (patch.notes !== undefined) body.notes = patch.notes
  if (patch.paymentMethod !== undefined) body.payment_method = patch.paymentMethod

  const data = await apiFetch(`/api/transactions/${id}`, {
    method: 'PUT',
    body,
  })
  return toCamelCase(data)
}

export async function deleteTransaction(id) {
  const data = await apiFetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  })
  return toCamelCase(data)
}

export async function getPaymentSplit(startDate, endDate) {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const data = await apiFetch(`/api/transactions/payment-split${queryString}`)
  return toCamelCase(data)
}

export async function getPaymentSplit({ startDate, endDate } = {}) {
  const params = new URLSearchParams()

  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const data = await apiFetch(`/api/transactions/payment-split${queryString}`)
  return toCamelCase(data)
}