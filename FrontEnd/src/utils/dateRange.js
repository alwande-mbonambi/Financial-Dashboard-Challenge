// Single comparison engine (Section 2.1): given a primary range and a
// "compare to" option, returns { current: {start,end}, previous: {start,end}|null }.
// Every Dashboard card and chart derives from these two windows.

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999) }
function startOfYear(d) { return new Date(d.getFullYear(), 0, 1) }
function endOfYear(d) { return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999) }

export function getCurrentWindow(range, customStart, customEnd, now = new Date()) {
  switch (range) {
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'this_year':
      return { start: startOfYear(now), end: endOfYear(now) }
    case 'custom':
      return {
        start: customStart ? new Date(customStart) : startOfMonth(now),
        end: customEnd ? new Date(`${customEnd}T23:59:59`) : endOfMonth(now),
      }
    case 'all':
    default:
      return { start: new Date(2000, 0, 1), end: new Date(2100, 0, 1) }
  }
}

export function getComparisonWindow(compareTo, current, compareCustomStart, compareCustomEnd) {
  if (!compareTo || compareTo === 'none') return null
  const spanMs = current.end.getTime() - current.start.getTime()

  if (compareTo === 'previous_period') {
    return {
      start: new Date(current.start.getTime() - spanMs - 86400000),
      end: new Date(current.start.getTime() - 86400000),
    }
  }
  if (compareTo === 'same_period_last_year') {
    return {
      start: new Date(current.start.getFullYear() - 1, current.start.getMonth(), current.start.getDate()),
      end: new Date(current.end.getFullYear() - 1, current.end.getMonth(), current.end.getDate(), 23, 59, 59, 999),
    }
  }
  if (compareTo === 'custom') {
    return {
      start: compareCustomStart ? new Date(compareCustomStart) : null,
      end: compareCustomEnd ? new Date(`${compareCustomEnd}T23:59:59`) : null,
    }
  }
  return null
}

export function inWindow(dateStr, window) {
  if (!window) return true
  const d = new Date(dateStr)
  return d >= window.start && d <= window.end
}

// All calendar years a window touches, e.g. a window spanning
// Nov 2026 - Feb 2027 returns [2026, 2027]. Used by the Dashboard's
// Budget Status card, which sums each touched year's overall budget.
export function getYearsInWindow(window) {
  const years = []
  for (let y = window.start.getFullYear(); y <= window.end.getFullYear(); y += 1) years.push(y)
  return years
}

export function pctDelta(current, previous) {
  if (previous === 0 || previous == null) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}

// Groups transactions into month buckets between two dates (inclusive),
// always at least the trailing 6 months so the trend chart has shape
// even when the current window is narrow (e.g. "This Month").
export function monthBuckets(count = 6, now = new Date()) {
  const buckets = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('default', { month: 'short' }),
      start: startOfMonth(d),
      end: endOfMonth(d),
    })
  }
  return buckets
}

// Generic bucketing for the Dashboard trend charts: granularity adapts to
// how wide the selected window is, so "This Month" reads day-by-day,
// "This Year" reads month-by-month, and "All" reads year-by-year —
// this is what makes the date selector actually affect the charts below.
export function buildTrendBuckets(window) {
  const spanDays = (window.end.getTime() - window.start.getTime()) / 86400000
  const buckets = []

  if (spanDays <= 45) {
    // Daily buckets
    const cursor = new Date(window.start.getFullYear(), window.start.getMonth(), window.start.getDate())
    while (cursor <= window.end) {
      const start = new Date(cursor)
      const end = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 23, 59, 59, 999)
      buckets.push({ key: start.toISOString().slice(0, 10), label: start.toLocaleDateString('default', { day: 'numeric', month: 'short' }), start, end })
      cursor.setDate(cursor.getDate() + 1)
    }
  } else if (spanDays <= 750) {
    // Monthly buckets
    const cursor = new Date(window.start.getFullYear(), window.start.getMonth(), 1)
    while (cursor <= window.end) {
      const start = startOfMonth(cursor)
      const end = endOfMonth(cursor)
      buckets.push({ key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`, label: cursor.toLocaleString('default', { month: 'short', year: spanDays > 400 ? '2-digit' : undefined }), start, end })
      cursor.setMonth(cursor.getMonth() + 1)
    }
  } else {
    // Yearly buckets
    const cursor = new Date(window.start.getFullYear(), 0, 1)
    while (cursor <= window.end) {
      const start = startOfYear(cursor)
      const end = endOfYear(cursor)
      buckets.push({ key: `${cursor.getFullYear()}`, label: `${cursor.getFullYear()}`, start, end })
      cursor.setFullYear(cursor.getFullYear() + 1)
    }
  }

  // Cap to a sane maximum so a huge "All" range with old data doesn't
  // render an unreadable chart — keep the most recent N buckets.
  const MAX_BUCKETS = 24
  return buckets.length > MAX_BUCKETS ? buckets.slice(buckets.length - MAX_BUCKETS) : buckets
}
