import { API_BASE_URL, apiRequest } from "./client"

// 백엔드(name/saleType) → 화면(title/type) 변환
function toView(p) {
  return {
    id: p.id,
    title: p.name,
    type: p.saleType === "AUCTION" ? "auction" : "normal",
    saleType: p.saleType,
    category: p.category,
    price: p.price,
    status: p.status,
    stock: p.stock,
    description: p.description,
    brand: p.brand,
    sellerId: p.sellerId,
    regDt: p.regDt,
    image: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : "/placeholder.svg",
    imageUrls: p.imageUrls || [],
    liked: false,
    seller: {
      name: `판매자 ${p.sellerId}`,
      rating: 0,
      deals: 0,
    },
    auction: p.saleType === "AUCTION" ? {
      startPrice: p.startPrice,
      bidUnit: p.minIncrement,
      startsAt: p.startsAt,
      endAt: p.endsAt,
      currentBid: p.startPrice ?? 0,
      bidCount: 0,
      buyNowPrice: null,
    } : undefined,
  }
}

// 화면 → 백엔드(create) 변환
function toCreatePayload(form) {
  const payload = {
    name: form.title,
    description: form.description,
    price: form.price,
    stock: form.stock,
    status: form.status,
    category: form.category,
    brand: form.brand ?? "",
    saleType: form.type === "auction" ? "AUCTION" : "NORMAL",
    // 경매 전용
    startPrice: form.startPrice ?? undefined,
    minIncrement: form.minIncrement ?? undefined,
    startsAt: form.startsAt ?? undefined,
    endsAt: form.endsAt ?? undefined,
  }
  if (form.type === "auction") {
    payload.startPrice = form.startPrice || form.price
    payload.minIncrement = form.minIncrement || 500
    payload.startsAt = form.startsAt || new Date().toISOString().slice(0, 19)
    payload.endsAt = form.endsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19)
  }
  return payload
}

// 화면 → 백엔드(update) 변환
function toUpdatePayload(form) {
  return {
    name: form.title,
    description: form.description,
    price: form.price,
    stock: form.stock,
    status: form.status,
    category: form.category,
    brand: form.brand ?? "",
  }
}

// 목록 조회
export async function fetchProducts({ saleType = "all" } = {}) {
  const query =
    saleType === "all" ? "" : `?saleType=${saleType === "auction" ? "AUCTION" : "NORMAL"}`
  const list = await apiRequest(`/products${query}`)
  return (list || []).map(toView)
}

// 단일 조회
export async function fetchProductById(id) {
  const p = await apiRequest(`/products/${id}`)
  return p ? toView(p) : null
}

// 일반 상품 등록
export async function createNormalProduct(form) {
  const created = await apiRequest("/products", {
    method: "POST",
    body: toCreatePayload({ ...form, type: "normal" }),
  })
  return toView(created)
}

// 경매 상품 등록
export async function createAuctionProduct(form) {
  const created = await apiRequest("/products", {
    method: "POST",
    body: toCreatePayload({ ...form, type: "auction" }),
  })
  return toView(created)
}

// 상품 수정
export async function updateProduct(id, form) {
  const updated = await apiRequest(`/products/${id}`, {
    method: "PUT",
    body: toUpdatePayload(form),
  })
  return toView(updated)
}

// 상품 삭제
export async function deleteProduct(id) {
  await apiRequest(`/products/${id}`, { method: "DELETE" })
  return true
}

// 찜하기
export async function likeProduct(id) {
  await apiRequest(`/products/${id}/like`, { method: "POST" })
}

// 찜 취소
export async function unlikeProduct(id) {
  await apiRequest(`/products/${id}/like`, { method: "DELETE" })
}

// 찜 여부 조회
export async function fetchIsLiked(id) {
  const res = await apiRequest(`/products/${id}/is-liked`)
  return res?.liked ?? false
}

// 내 찜 목록 조회
export async function fetchLikedProducts() {
  const list = await apiRequest("/products/liked")
  return (list || []).map(toView)
}

// 이미지 업로드
export async function uploadProductImages(productId, files) {
  const formData = new FormData()
  files.forEach((file) => formData.append("images", file))
  const token = localStorage.getItem("accessToken")
  const res = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) throw new Error("이미지 업로드 실패")
  return res.json()
}

// 이미지 삭제
export async function deleteProductImage(productId, imageUrl) {
  await apiRequest(`/products/${productId}/images?url=${encodeURIComponent(imageUrl)}`, {
    method: "DELETE",
  })
  return true
}
