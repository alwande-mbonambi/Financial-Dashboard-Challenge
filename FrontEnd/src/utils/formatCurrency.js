export function formatCurrency(amount) {
  const value = Number(amount) || 0
  return `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCurrencyCompact(amount) {
  const value = Number(amount) || 0
  return `R${value.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}
