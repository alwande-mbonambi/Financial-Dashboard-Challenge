import { apiFetch } from './client.js'
import { toCamelCase } from '../utils/caseConverter.js'

export async function listCategories() {
  const data = await apiFetch('/api/categories')
  return toCamelCase(data)
}

export async function createCategory({ name, type }) {
  const data = await apiFetch('/api/categories', {
    method: 'POST',
    body: { name, type },
  })
  return toCamelCase(data)
}

export async function updateCategory(id, { name, type }) {
  const data = await apiFetch(`/api/categories/${id}`, {
    method: 'PUT',
    body: { name, type },
  })
  return toCamelCase(data)
}

export async function deleteCategory(id) {
  const data = await apiFetch(`/api/categories/${id}`, {
    method: 'DELETE',
  })
  return toCamelCase(data)
}

export async function reassignCategory(id, targetCategoryId) {
  const data = await apiFetch(`/api/categories/${id}/reassign`, {
    method: 'PUT',
    body: { targetCategoryId },
  })
  return toCamelCase(data)
}

export async function reassignCategoryToOther(id) {
  const data = await apiFetch(`/api/categories/${id}/reassign-to-other`, {
    method: 'POST',
  })
  return toCamelCase(data)
}