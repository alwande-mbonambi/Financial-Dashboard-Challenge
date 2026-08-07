import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  listCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  reassignCategory as apiReassignCategory,
  reassignCategoryToOther as apiReassignCategoryToOther,
} from '../api/categories.js'
import {
  listTransactions,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
} from '../api/transactions.js'
import {
  getBudgetsByYear as apiGetBudgetsByYear,
  setBudget as apiSetBudget,
  deleteBudget as apiDeleteBudget,
} from '../api/budgets.js'
import { inWindow } from '../utils/dateRanges.js'

const DataContext = createContext(null)

function makeId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function DataProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [budgetsByYear, setBudgetsByYear] = useState({})

  const [dashboardFilters, setDashboardFiltersState] = useState({
    primaryRange: 'this_month',
    customStart: '',
    customEnd: '',
    compareTo: 'none',
    compareCustomStart: '',
    compareCustomEnd: '',
    categoryView: 'income',
  })

  const setDashboardFilters = useCallback((patch) => {
    setDashboardFiltersState((prev) => ({ ...prev, ...patch }))
  }, [])

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

  // fetchers
  const fetchCategories = useCallback(async () => {
    try {
      const data = await listCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await listTransactions()
      setTransactions(data)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    }
  }, [])

  const fetchBudgetsByYear = useCallback(async (year = new Date().getFullYear()) => {
    try {
      const data = await apiGetBudgetsByYear(year)
      setBudgetsByYear((prev) => ({ ...prev, [year]: data }))
      return data
    } catch (err) {
      console.error(`Failed to fetch budgets for year ${year}:`, err)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchTransactions()
    fetchBudgetsByYear(new Date().getFullYear())
  }, [fetchCategories, fetchTransactions, fetchBudgetsByYear])

  // categories
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
        throw err
      }
    },
    [fetchCategories]
  )

  const reassignCategory = useCallback(
    async (id, targetCategoryId) => {
      const result = await apiReassignCategory(id, targetCategoryId)
      await Promise.all([fetchCategories(), fetchTransactions()])
      return result
    },
    [fetchCategories, fetchTransactions]
  )

  const reassignCategoryToOther = useCallback(
    async (id) => {
      const result = await apiReassignCategoryToOther(id)
      await Promise.all([fetchCategories(), fetchTransactions()])
      return result
    },
    [fetchCategories, fetchTransactions]
  )

  // transactions
  const addTransaction = useCallback(
    async (tx) => {
      const result = await apiCreateTransaction(tx)
      await fetchTransactions()
      return result
    },
    [fetchTransactions]
  )

  const updateTransaction = useCallback(
    async (id, patch) => {
      const result = await apiUpdateTransaction(id, patch)
      await fetchTransactions()
      return result
    },
    [fetchTransactions]
  )

  const deleteTransaction = useCallback(
    async (id) => {
      const result = await apiDeleteTransaction(id)
      await fetchTransactions()
      return result
    },
    [fetchTransactions]
  )

  const getRecentTransactions = useCallback(
    (limit = 5) => {
      return [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit)
    },
    [transactions]
  )

  const getPaymentMethodSplit = useCallback(
    (window) => {
      const filtered = transactions.filter((t) => inWindow(t.date, window))
      const total = filtered.length
      if (total === 0) return []

      const counts = { Cash: 0, Card: 0, EFT: 0 }
      filtered.forEach((t) => {
        const method = t.paymentMethod || t.payment_method
        if (method && counts[method] !== undefined) {
          counts[method] += 1
        }
      })

      return Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
    },
    [transactions]
  )

  // budgets
  const getOverallBudget = useCallback(
    (year = new Date().getFullYear()) => {
      return budgetsByYear[year]?.overallBudget || 0
    },
    [budgetsByYear]
  )

  const getCategoryBudget = useCallback(
    (categoryId, year = new Date().getFullYear()) => {
      const yearBudgets = budgetsByYear[year]?.categoryBudgets || []
      const found = yearBudgets.find((b) => Number(b.categoryId) === Number(categoryId))
      return found ? Number(found.amount) : 0
    },
    [budgetsByYear]
  )

  const getCategoryBudgetAllYears = useCallback(
    (categoryId) => {
      return Object.values(budgetsByYear).reduce((sum, yearData) => {
        const found = (yearData?.categoryBudgets || []).find(
          (b) => Number(b.categoryId) === Number(categoryId)
        )
        return sum + (found ? Number(found.amount) : 0)
      }, 0)
    },
    [budgetsByYear]
  )

  const setOverallBudget = useCallback(
    async (year, amount) => {
      const updated = await apiSetBudget({ categoryId: null, year, amount })
      setBudgetsByYear((prev) => ({ ...prev, [year]: updated }))
      return updated
    },
    []
  )

  const setCategoryBudget = useCallback(
    async (categoryId, year, amount) => {
      const updated = await apiSetBudget({ categoryId, year, amount })
      setBudgetsByYear((prev) => ({ ...prev, [year]: updated }))
      return updated
    },
    []
  )

  const removeBudget = useCallback(
    async (year, categoryId = null) => {
      const updated = await apiDeleteBudget(year, categoryId)
      setBudgetsByYear((prev) => ({ ...prev, [year]: updated }))
      return updated
    },
    []
  )

  const deleteOverallBudget = useCallback(
    async (year) => {
      return await removeBudget(year, null)
    },
    [removeBudget]
  )

  const listOverallBudgetYears = useCallback(() => {
    return Object.keys(budgetsByYear)
      .map(Number)
      .filter((y) => (budgetsByYear[y]?.overallBudget || 0) > 0)
      .sort((a, b) => b - a)
  }, [budgetsByYear])

  const earliestTransactionYear = useMemo(() => {
    if (!transactions.length) return new Date().getFullYear()
    return Math.min(...transactions.map((t) => new Date(t.date).getFullYear()))
  }, [transactions])

  const latestTransactionYear = useMemo(() => {
    if (!transactions.length) return new Date().getFullYear()
    return Math.max(...transactions.map((t) => new Date(t.date).getFullYear()))
  }, [transactions])

  const value = {
    categories,
    transactions,
    budgetsByYear,
    dashboardFilters,
    setDashboardFilters,
    fetchCategories,
    fetchTransactions,
    fetchBudgetsByYear,
    addCategory,
    updateCategory,
    deleteCategory,
    reassignCategory,
    reassignCategoryToOther,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getRecentTransactions,
    getPaymentMethodSplit,
    getOverallBudget,
    getCategoryBudget,
    getCategoryBudgetAllYears,
    setOverallBudget,
    setCategoryBudget,
    removeBudget,
    deleteOverallBudget,
    listOverallBudgetYears,
    earliestTransactionYear,
    latestTransactionYear,
    toasts,
    notify,
    dismissToast,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  return useContext(DataContext)
}