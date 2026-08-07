import { apiFetch } from './client.js'
import { toCamelCase } from '../utils/caseConverter.js'

export async function getSummary({ startDate, endDate, compareStartDate, compareEndDate } = {}) {
  const params = new URLSearchParams()

  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  if (compareStartDate) params.append('compareStartDate', compareStartDate)
  if (compareEndDate) params.append('compareEndDate', compareEndDate)

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const data = await apiFetch(`/api/summary${queryString}`)
  return toCamelCase(data)
}