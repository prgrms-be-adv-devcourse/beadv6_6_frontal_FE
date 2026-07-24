import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, Gavel } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import StatusBadge from "../components/StatusBadge"
import { fetchLikedProducts, unlikeProduct } from "../api/productApi"
import { fetchMyWatches } from "../api/auctionApi"
import { formatKRW } from "../lib/format"

// 찜한 일반상품 + 관심 등록한 경매를 한 화면에서 보여줌 (기존에 나뉘어 있던 "찜 목록"과
// "관심 경매"를 하나로 합쳤어요). 데이터 출처는 각자 기존 API 그대로.
export default function LikedProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [watches, setWatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchLikedProducts().catch(() => []),
      fetchMyWatches().then((data) => data?.content || []).catch(() => []),
    ]).then(([likedProducts, myWatches]) => {
      setProducts(likedProducts || [])
      setWatches(myWatches || [])
      setLoading(false)
    })
  }, [])

  const handleUnlike = async (e, productId) => {
    e.stopPropagation()
    await unlikeProduct(productId)
    setProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  const isEmpty = products.length === 0 && watches.length === 0

  return (
    <PageContainer noPadX>
      <Header showBack title="찜 목록" showCart={false} />
      <div className="mx-auto w-full max-w-md px-4 pt-3 pb-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <Heart size={40} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">찜한 상품이나 경매가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {products.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-bold text-foreground">상품 {products.length}</h2>
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
                  >
                    <img
                      src={product.image || "/images/placeholder.png"}
                      alt={product.title}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{product.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                      <p className="text-sm font-bold text-teal mt-1">{formatKRW(product.price)}</p>
                    </div>
                    <button
                      onClick={(e) => handleUnlike(e, product.id)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-border"
                      aria-label="찜 취소"
                    >
                      <Heart size={18} className="fill-teal text-teal" />
                    </button>
                  </div>
                ))}
              </section>
            )}

            {watches.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-bold text-foreground">경매 {watches.length}</h2>
                {watches.map((w) => (
                  <div
                    key={w.auctionId}
                    onClick={() => navigate(`/auctions/${w.auctionId}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal">
                      <Gavel size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">경매 #{w.auctionId}</p>
                      <StatusBadge variant={w.status === "LIVE" ? "teal" : "neutral"} className="mt-1">
                        {w.status === "LIVE" ? "경매중" : w.status}
                      </StatusBadge>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-teal">{formatKRW(w.currentBid)}</span>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
