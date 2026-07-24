export function formatKRW(value) {
  if (value == null || Number.isNaN(value)) return "-"
  return new Intl.NumberFormat("ko-KR").format(value) + "원"
}

// Formats a date-ish value (timestamp, ISO string, or "YYYY-MM-DD HH:mm") for display.
export function formatDate(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

export function formatDateTime(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d)
}

// Formats a past timestamp as relative time for chat-style lists
// ("방금 전", "5분 전", "3시간 전", "어제"), falling back to a short date for older items.
export function formatRelativeTime(value) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""

  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return "방금 전"
  if (diffMin < 60) return `${diffMin}분 전`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return "어제"
  if (diffDay < 7) return `${diffDay}일 전`

  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(d)
}

// True if two date-ish values fall on the same calendar day.
export function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

// Formats a timestamp as a chat date divider, e.g. "2026년 7월 23일".
export function formatChatDateDivider(value) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""

  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(d)
}

// Returns a human readable "남은 시간" string from a future timestamp.
export function timeLeft(endAt) {
  const diff = endAt - Date.now()
  if (diff <= 0) return { text: "마감", urgent: true, ended: true }

  const totalMin = Math.floor(diff / 60000)
  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin % (60 * 24)) / 60)
  const mins = totalMin % 60

  let text
  if (days > 0) text = `${days}일 ${hours}시간`
  else if (hours > 0) text = `${hours}시간 ${mins}분`
  else text = `${mins}분`

  return { text, urgent: diff <= 60 * 60 * 1000, ended: false }
}
