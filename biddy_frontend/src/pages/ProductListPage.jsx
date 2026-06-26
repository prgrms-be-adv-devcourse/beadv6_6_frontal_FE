import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import { fetchProducts, deleteProduct } from "../api/productApi"

const SALE_TYPES = [
  { key: "all", label: "전체" },
  { key: "normal", label: "일반(NORMAL)" },
  { key: "auction", label: "경매(AUCTION)" },
]

export default function ProductListPage() {
  const navigate = useNavigate()
  const [saleType, setSaleType] = useState("all")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetchProducts({ saleType })
      .then((data) => setItems(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleType])

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
    <PageContainer noPadX>
      <Header />

      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">상품 목록</h2>
          <button
            onClick={load}
            className="rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border"
          >
            새로고침
          </button>
        </div>

        {/* 판매유형 필터 */}
        <div className="mt-3 flex gap-2 sm:w-80">
          {SALE_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setSaleType(t.key)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                saleType === t.key
                  ? "bg-dark text-dark-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div className="mt-4 grid grid-cols-1 gap-3 px-4 pb-24 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : error ? (
          <p className="col-span-full py-10 text-center text-sm text-red-500">에러: {error}</p>
        ) : items.length === 0 ? (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">상품이 없습니다.</p>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              className="rounded-xl bg-card p-3 ring-1 ring-border"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{p.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        p.type === "auction"
                          ? "bg-amber-soft text-amber"
                          : "bg-teal-soft text-teal"
                      }`}
                    >
                      {p.saleType}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.category} · {Number(p.price).toLocaleString()}원 · 재고 {p.stock} · 상태 {p.status}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">id: {p.id}</p>
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="flex-1 rounded-lg bg-card py-1.5 text-xs font-semibold text-foreground ring-1 ring-border"
                >
                  상세
                </button>
                <button
                  onClick={() => navigate(`/products/${p.id}/edit`)}
                  className="flex-1 rounded-lg bg-card py-1.5 text-xs font-semibold text-foreground ring-1 ring-border"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-semibold text-white"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 상품 등록 플로팅 버튼 */}
      <button
        onClick={() => navigate("/products/create")}
        aria-label="상품 등록"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-teal-foreground shadow-lg shadow-teal/30 transition-transform hover:scale-105"
      >
        <Plus size={26} />
      </button>
    </PageContainer>
  )
}