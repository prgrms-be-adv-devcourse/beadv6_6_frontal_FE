import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Trash2, Plus } from "lucide-react"
import Header from "../components/Header"
import { fetchProducts, deleteProduct } from "../api/productApi"
import { useAuth } from "../contexts/AuthContext"
import { formatKRW } from "../lib/format"

// Reached from the 마이페이지 hub — own Header with a back button (like a chat room).
// 당근마켓/번개장터의 "나의 판매내역" 같은 느낌으로, 내가 등록한 상품을 한 번에 관리.
export default function MyProductsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const products = await fetchProducts({})
      setItems(products.filter((p) => Number(p.sellerId) === Number(user?.id)))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user])

  const handleDelete = async (id) => {
    if (!confirm("이 상품을 삭제할까요?")) return
    try {
      await deleteProduct(id)
      load()
    } catch (err) {
      alert("삭제 실패: " + err.message)
    }
  }

  return (
    <>
      <Header showBack title="내 상품" showCart={false} />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => navigate("/products/create")}
          className="flex items-center gap-1 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-teal-foreground"
        >
          <Plus size={13} />
          등록하기
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-red-500">에러: {error}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록한 상품이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                <img
                  src={p.image || "/placeholder.svg"}
                  alt={p.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{p.title}</p>
                <p className="text-sm font-bold text-teal">{formatKRW(p.price)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.saleType} · {p.status}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  onClick={() => navigate(`/products/${p.id}/edit`)}
                  className="flex items-center justify-center gap-1 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border"
                >
                  <Pencil size={12} /> 수정
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex items-center justify-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600"
                >
                  <Trash2 size={12} /> 삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </>
  )
}
