import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts'
import Layout from '../components/Layout.jsx'
import PaymentMethodCard from '../components/PaymentMethodCard.jsx'
import { useData } from '../context/DataContext.jsx'
import { getSummary } from '../api/summary.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import { getCurrentWindow, getComparisonWindow, buildTrendBuckets, inWindow, getYearsInWindow } from '../utils/dateRanges.js'

const PIE_COLORS = ['#0E6E5D', '#3E7D57', '#B9812B', '#B8503E', '#6D6858', '#45879E']
const PROFIT_COLOR = '#D9A62E'
const LOSS_COLOR = '#7A3B3B'

function formatDateParam(date) {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function Delta({ value }) {
  const up = value >= 0
  return <div className={`delta ${up ? 'up' : 'down'}`}>{up ? '▲' : '▼'} {Math.abs(value)}% vs comparison</div>
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const rows = payload.filter((p) => p.value !== 0 && p.value !== undefined && p.name)
  if (rows.length === 0) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--shadow-md)', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {rows.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</div>
      ))}
    </div>
  )
}

function IncomeExpenseTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  const isProfit = point.net >= 0
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--shadow-md)', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--income)' }}>Income: {formatCurrency(point.income)}</div>
      <div style={{ color: 'var(--expense)' }}>Expenses: {formatCurrency(point.expenses)}</div>
      {point.income > 0 && point.expenses > 0 && (
        <div style={{ color: isProfit ? PROFIT_COLOR : LOSS_COLOR, fontWeight: 600, marginTop: 2 }}>
          {isProfit ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(point.net))}
        </div>
      )}
    </div>
  )
}

function BudgetVsActualTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--shadow-md)', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#B8B2A0' }}>Budgeted: {point.budget ? formatCurrency(point.budget) : 'No budget set'}</div>
      <div style={{ color: 'var(--accent)' }}>Actual: {formatCurrency(point.spent)}</div>
      {point.overBudget > 0 && (
        <div style={{ color: 'var(--expense)', fontWeight: 600, marginTop: 2 }}>Over budget by: {formatCurrency(point.overBudget)}</div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const {
    categories, transactions, getRecentTransactions,
    dashboardFilters, setDashboardFilters,
    getOverallBudget, getCategoryBudget, getCategoryBudgetAllYears,
    earliestTransactionYear, latestTransactionYear,
  } = useData()

  const {
    primaryRange, customStart, customEnd,
    compareTo, compareCustomStart, compareCustomEnd,
    categoryView,
  } = dashboardFilters

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    net: 0,
    marginPct: 0,
    deltas: { income: 0, expenses: 0, net: 0, margin: 0 },
  })

  const currentWindow = useMemo(
    () => getCurrentWindow(primaryRange, customStart, customEnd),
    [primaryRange, customStart, customEnd],
  )
  const compareWindow = useMemo(
    () => getComparisonWindow(compareTo, currentWindow, compareCustomStart, compareCustomEnd),
    [compareTo, currentWindow, compareCustomStart, compareCustomEnd],
  )

  useEffect(() => {
    let isMounted = true

    async function fetchSummaryData() {
      try {
        const params = {}
        if (primaryRange !== 'all') {
          params.startDate = formatDateParam(currentWindow.start)
          params.endDate = formatDateParam(currentWindow.end)
        }
        if (compareTo !== 'none' && compareWindow?.start && compareWindow?.end) {
          params.compareStartDate = formatDateParam(compareWindow.start)
          params.compareEndDate = formatDateParam(compareWindow.end)
        }

        const res = await getSummary(params)
        if (isMounted && res) {
          setSummary({
            totalIncome: Number(res.totalIncome) || 0,
            totalExpenses: Number(res.totalExpenses) || 0,
            net: Number(res.net) || 0,
            marginPct: Number(res.marginPct) || 0,
            deltas: {
              income: Number(res.deltas?.income) || 0,
              expenses: Number(res.deltas?.expenses) || 0,
              net: Number(res.deltas?.net) || 0,
              margin: Number(res.deltas?.margin) || 0,
            },
          })
        }
      } catch (err) {
        console.error('Failed to fetch dashboard summary:', err)
      }
    }

    fetchSummaryData()

    return () => {
      isMounted = false
    }
  }, [primaryRange, customStart, customEnd, compareTo, compareCustomStart, compareCustomEnd, currentWindow, compareWindow, transactions])

  const trendWindow = useMemo(() => {
    if (primaryRange !== 'all') return currentWindow
    if (transactions.length === 0) return currentWindow
    const dates = transactions.map((t) => new Date(t.date).getTime())
    return { start: new Date(Math.min(...dates)), end: new Date(Math.max(new Date().getTime(), ...dates)) }
  }, [primaryRange, currentWindow, transactions])

  const buckets = useMemo(() => buildTrendBuckets(trendWindow), [trendWindow])

  const trendData = useMemo(() => buckets.map((b) => {
    const bucketWindow = { start: b.start, end: b.end }
    const income = transactions.filter((t) => t.type === 'income' && inWindow(t.date, bucketWindow)).reduce((s, t) => s + Number(t.amount), 0)
    const expenses = transactions.filter((t) => t.type === 'expense' && inWindow(t.date, bucketWindow)).reduce((s, t) => s + Number(t.amount), 0)
    const net = income - expenses
    const bothPresent = income > 0 && expenses > 0
    const base = bothPresent ? Math.min(income, expenses) : 0
    return {
      label: b.label,
      income,
      expenses,
      net,
      incomeBase: bothPresent ? base : income,
      incomeHighlight: bothPresent && income > expenses ? income - expenses : 0,
      expenseBase: bothPresent ? base : expenses,
      expenseHighlight: bothPresent && expenses > income ? expenses - income : 0,
    }
  }), [buckets, transactions])

  const yearForWindow = currentWindow.start.getFullYear()
  const yearWindow = useMemo(() => ({ start: new Date(yearForWindow, 0, 1), end: new Date(yearForWindow, 11, 31, 23, 59, 59, 999) }), [yearForWindow])
  const isAllTime = primaryRange === 'all'

  const incomeBreakdown = useMemo(() => {
    return categories
      .filter((c) => c.type === 'income')
      .map((c) => ({
        name: c.name,
        value: isAllTime
          ? transactions.filter((t) => Number(t.categoryId) === Number(c.id)).reduce((s, t) => s + Number(t.amount), 0)
          : transactions.filter((t) => Number(t.categoryId) === Number(c.id) && inWindow(t.date, currentWindow)).reduce((s, t) => s + Number(t.amount), 0),
      }))
      .filter((c) => c.value > 0)
  }, [categories, transactions, currentWindow, isAllTime])

  const expenseBudgetVsActual = useMemo(() => {
    return categories
      .filter((c) => c.type === 'expense')
      .map((c) => {
        const spent = isAllTime
          ? transactions.filter((t) => Number(t.categoryId) === Number(c.id)).reduce((s, t) => s + Number(t.amount), 0)
          : transactions.filter((t) => Number(t.categoryId) === Number(c.id) && inWindow(t.date, yearWindow)).reduce((s, t) => s + Number(t.amount), 0)
        const budget = isAllTime ? getCategoryBudgetAllYears(c.id) : getCategoryBudget(c.id, yearForWindow)
        return {
          name: c.name,
          budget,
          withinBudget: budget ? Math.min(spent, budget) : spent,
          overBudget: budget ? Math.max(0, spent - budget) : 0,
          spent,
        }
      })
      .filter((c) => c.spent > 0 || c.budget > 0)
  }, [categories, transactions, yearWindow, yearForWindow, isAllTime, getCategoryBudget, getCategoryBudgetAllYears])

  const budgetStatusYears = isAllTime
    ? Array.from({ length: latestTransactionYear - earliestTransactionYear + 1 }, (_, i) => earliestTransactionYear + i)
    : getYearsInWindow(currentWindow)
  const budgetStatusBudget = budgetStatusYears.reduce((s, y) => s + getOverallBudget(y), 0)
  const budgetStatusWindow = isAllTime ? trendWindow : currentWindow
  const budgetStatusSpent = transactions
    .filter((t) => t.type === 'expense' && inWindow(t.date, budgetStatusWindow))
    .reduce((s, t) => s + Number(t.amount), 0)
  const budgetStatusPct = budgetStatusBudget ? Math.round((budgetStatusSpent / budgetStatusBudget) * 100) : 0
  const budgetStatusOver = budgetStatusBudget > 0 && budgetStatusSpent > budgetStatusBudget
  const budgetStatusBarPct = Math.min(100, budgetStatusPct)

  const recent = getRecentTransactions(5)
  const categoryName = (id) => categories.find((c) => Number(c.id) === Number(id))?.name || '—'

  return (
    <Layout title="Dashboard">
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="field">
            <label>Date range</label>
            <select value={primaryRange} onChange={(e) => setDashboardFilters({ primaryRange: e.target.value })}>
              <option value="all">All</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          {primaryRange === 'custom' && (
            <>
              <div className="field"><label>From</label><input type="date" value={customStart} onChange={(e) => setDashboardFilters({ customStart: e.target.value })} /></div>
              <div className="field"><label>To</label><input type="date" value={customEnd} onChange={(e) => setDashboardFilters({ customEnd: e.target.value })} /></div>
            </>
          )}
          <div className="field">
            <label>Compare to</label>
            <select value={compareTo} onChange={(e) => setDashboardFilters({ compareTo: e.target.value })}>
              <option value="none">No comparison</option>
              <option value="previous_period">Previous period</option>
              <option value="same_period_last_year">Same period last year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          {compareTo === 'custom' && (
            <>
              <div className="field"><label>Compare from</label><input type="date" value={compareCustomStart} onChange={(e) => setDashboardFilters({ compareCustomStart: e.target.value })} /></div>
              <div className="field"><label>Compare to</label><input type="date" value={compareCustomEnd} onChange={(e) => setDashboardFilters({ compareCustomEnd: e.target.value })} /></div>
            </>
          )}
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="label">Total Income</div>
          <div className="value amount-income">{formatCurrency(summary.totalIncome)}</div>
          {compareTo !== 'none' && <Delta value={summary.deltas?.income || 0} />}
        </div>
        <div className="card">
          <div className="label">Total Expenses</div>
          <div className="value amount-expense">{formatCurrency(summary.totalExpenses)}</div>
          {compareTo !== 'none' && <Delta value={summary.deltas?.expenses || 0} />}
        </div>
        <div className="card">
          <div className="label">Net Profit / Loss</div>
          <div className="value" style={{ color: summary.net >= 0 ? 'var(--income)' : 'var(--expense)' }}>{formatCurrency(summary.net)}</div>
          {compareTo !== 'none' && <Delta value={summary.deltas?.net || 0} />}
        </div>
        <div className="card">
          <div className="label">Profit Margin</div>
          <div className="value">{summary.marginPct}%</div>
          {compareTo !== 'none' && <Delta value={summary.deltas?.margin || 0} />}
        </div>
      </div>

      <div className="panel">
        <h3>Income vs Expenses</h3>
        <p className="panel-sub">
          Two bars per period. Whichever is larger gets a highlighted cap — gold for the profit
          portion on the Income bar, or maroon for the loss portion on the Expenses bar.
        </p>
        {trendData.every((d) => d.income === 0 && d.expenses === 0) ? (
          <div className="empty-state"><h3>No data for this period</h3></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--ink-muted)" fontSize={12} />
              <YAxis stroke="var(--ink-muted)" fontSize={12} />
              <Tooltip content={<IncomeExpenseTooltip />} />
              <Legend payload={[
                { value: 'Income', type: 'square', color: 'var(--income)' },
                { value: 'Expenses', type: 'square', color: 'var(--expense)' },
                { value: 'Profit (highlight)', type: 'square', color: PROFIT_COLOR },
                { value: 'Loss (highlight)', type: 'square', color: LOSS_COLOR },
              ]}
              />
              <Bar dataKey="incomeBase" stackId="income" fill="var(--income)" name="Income" radius={[0, 0, 0, 0]} legendType="none" />
              <Bar dataKey="incomeHighlight" stackId="income" fill={PROFIT_COLOR} name="Profit" radius={[4, 4, 0, 0]} legendType="none" />
              <Bar dataKey="expenseBase" stackId="expenses" fill="var(--expense)" name="Expenses" radius={[0, 0, 0, 0]} legendType="none" />
              <Bar dataKey="expenseHighlight" stackId="expenses" fill={LOSS_COLOR} name="Loss" radius={[4, 4, 0, 0]} legendType="none" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="panel">
        <h3>Profit / Loss Trend</h3>
        {trendData.length === 0 ? (
          <div className="empty-state"><h3>No data for this period</h3></div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--ink-muted)" fontSize={12} />
              <YAxis stroke="var(--ink-muted)" fontSize={12} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="net" name="Net" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Category Breakdown</h3>
          <div className="toggle-group">
            <button className={categoryView === 'income' ? 'active' : ''} onClick={() => setDashboardFilters({ categoryView: 'income' })}>Income categories</button>
            <button className={categoryView === 'expense' ? 'active' : ''} onClick={() => setDashboardFilters({ categoryView: 'expense' })}>Expense: Budget vs Actual</button>
          </div>
        </div>

        {categoryView === 'income' ? (
          incomeBreakdown.length === 0 ? (
            <div className="empty-state"><h3>No data for this period</h3></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={incomeBreakdown} dataKey="value" nameKey="name" outerRadius={95} label={(e) => `${e.name}`}>
                  {incomeBreakdown.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )
        ) : (
          <>
            <p className="panel-sub">
              {isAllTime
                ? 'Budgeted = every budget ever set for that category, added up across all years. Actual = all-time spend. The red cap is however much that total has gone over.'
                : `Solid = spent within budget. The red cap on top is how far that category has gone over its budget for ${yearForWindow}.`}
            </p>
            {expenseBudgetVsActual.length === 0 ? (
              <div className="empty-state"><h3>No data for this period</h3></div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseBudgetVsActual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--ink-muted)" fontSize={12} />
                  <YAxis stroke="var(--ink-muted)" fontSize={12} />
                  <Tooltip content={<BudgetVsActualTooltip />} />
                  <Legend />
                  <Bar dataKey="budget" fill="#B8B2A0" name="Budgeted" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withinBudget" stackId="actual" fill="var(--accent)" name="Actual" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="overBudget" stackId="actual" fill="var(--expense)" name="Actual (over budget)" legendType="none" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>

      <div className="card-grid">
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <h3>5 Latest Transactions</h3>
          <p className="panel-sub">Always the most recent overall, regardless of the date filter above.</p>
          {recent.length === 0 ? (
            <div className="empty-state"><h3>No transactions yet</h3></div>
          ) : (
            <table>
              <thead>
                <tr><th>Date</th><th>Category</th><th>Reference</th><th className="num">Amount</th></tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{categoryName(t.categoryId)}</td>
                    <td>{t.reference}</td>
                    <td className={`num ${t.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="panel panel-compact">
          <h3>Budget Status</h3>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${budgetStatusBarPct}%`, background: budgetStatusOver ? 'var(--expense)' : 'var(--accent)' }} />
          </div>
          <p className="panel-sub" style={{ marginTop: 8, marginBottom: 0 }}>
            {formatCurrency(budgetStatusSpent)} of {formatCurrency(budgetStatusBudget)} used during this period
            {' — '}
            <span style={{ color: budgetStatusOver ? 'var(--expense)' : 'var(--income)', fontWeight: 600 }}>
              {budgetStatusBudget > 0 ? `${budgetStatusPct}% ${budgetStatusOver ? 'over budget' : 'used'}` : 'no budget set'}
            </span>
          </p>
        </div>
        <PaymentMethodCard window={currentWindow} />
      </div>
    </Layout>
  )
}