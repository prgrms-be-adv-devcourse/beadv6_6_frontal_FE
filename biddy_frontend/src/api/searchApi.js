import { apiRequest } from "./client"

export async function searchProducts({ query, size = 10 }) {
  return apiRequest("/search", {
    method: "POST",
    body: { query, size },
  })
}

export async function fetchSearchSuggestions({ keyword, size = 10 }) {
  if (!keyword?.trim()) return { keyword: "", suggestions: [] }
  return apiRequest(`/search/suggestions?keyword=${encodeURIComponent(keyword)}&size=${size}`)
}

export async function fetchPopularKeywords({ size = 10 } = {}) {
  return apiRequest(`/search/keywords/popular?size=${size}`)
}

export async function fetchHistoryRecommendations({ size = 10 } = {}) {
  return apiRequest(`/search/recommendations/history?size=${size}`)
}

export async function saveSearchKeyword(keyword) {
  if (!keyword?.trim()) return
  await apiRequest(`/search/keywords?keyword=${encodeURIComponent(keyword.trim())}`, {
    method: "POST",
  })
}
