import { apiFetch } from './client.js'
import { toCamelCase } from '../utils/caseConverter.js'

export async function getBudgetsByYear(year) {
  const queryString = year ? `?year=${year}` : ''
  const data = await apiFetch(`/api/budgets${queryString}`)
  return toCamelCase(data)
}

export async function setBudget({ categoryId, year, amount }) {
  const data = await apiFetch('/api/budgets', {
    method: 'PUT',
    body: {
      category_id: categoryId || null,
      year: Number(year),
      amount: Number(amount),
    },
  })
  return toCamelCase(data)
}

export async function deleteBudget(year, categoryId) {
  const params = new URLSearchParams()
  if (year) params.append('year', year)
  if (categoryId) params.append('categoryId', categoryId)

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const data = await apiFetch(`/api/budgets${queryString}`, {
    method: 'DELETE',
  })
  return toCamelCase(data)
}