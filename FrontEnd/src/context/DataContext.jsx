import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  listCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  reassignCategory as apiReassignCategory,
  reassignCategoryToOther as apiReassignCategoryToOther,
} from '../api/categories.js'

const DataContext = createContext(null)

function makeId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function DataProvider({ children }) {
  const [categories, setCategories] = useState([])

  // toast notifications 
  const [toasts, setToasts] = useState([])
  const toastTimers = useRef({})

  const notify = useCallback((message, tone = 'success') => {
    const id = makeId()
    setToasts((prev) => [...prev, { id, message, tone }])
    toastTimers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      delete toastTimers.current[id]
    }, 2200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (toastTimers.current[id]) {
      clearTimeout(toastTimers.current[id])
      delete toastTimers.current[id]
    }
  }, [])

  // categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await listCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const addCategory = useCallback(
    async (cat) => {
      const result = await apiCreateCategory(cat)
      await fetchCategories()
      return result
    },
    [fetchCategories]
  )

  const updateCategory = useCallback(
    async (id, patch) => {
      const result = await apiUpdateCategory(id, patch)
      await fetchCategories()
      return result
    },
    [fetchCategories]
  )

  const deleteCategory = useCallback(
    async (id) => {
      try {
        const result = await apiDeleteCategory(id)
        await fetchCategories()
        return result
      } catch (err) {
        // Re-throw so caller can check for CATEGORY_HAS_TRANSACTIONS or handle error
        throw err
      }
    },
    [fetchCategories]
  )

  const reassignCategory = useCallback(
    async (id, targetCategoryId) => {
      const result = await apiReassignCategory(id, targetCategoryId)
      await fetchCategories()
      return result
    },
    [fetchCategories]
  )

  const reassignCategoryToOther = useCallback(
    async (id) => {
      const result = await apiReassignCategoryToOther(id)
      await fetchCategories()
      return result
    },
    [fetchCategories]
  )

  const value = {
    categories,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    reassignCategory,
    reassignCategoryToOther,
    toasts,
    notify,
    dismissToast,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  return useContext(DataContext)
}