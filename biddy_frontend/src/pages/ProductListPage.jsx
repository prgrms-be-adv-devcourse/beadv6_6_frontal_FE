import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, RefreshCw, Clock, Gavel } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import ChatbotWidget from "../components/ChatbotWidget"
import { fetchProducts, fetchLikedProducts, likeProduct, unlikeProduct } from "../api/productApi"
import { fetchAuctionFeed } from "../api/auctionApi"
import { fetchMemberNickname } from "../api/memberApi"
import { useAuth } from "../contexts/AuthContext"
import { formatKRW, timeLeft, formatRelativeTime } from "../lib/format"
import { CATEGORIES } from "../api/mockData"
import { useFeedback } from "../contexts/FeedbackContext"

const SALE_TYPES = [
  { key: "all", label: "전체" },
  { key: "normal", label: "일반" },
  { key: "auction", label: "경매" },
]

export default function ProductListPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useFeedback()
  const [saleType, setSaleType] = useState("all")
  const [category, setCategory] = useState("전체")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [auctionByProductId, setAuctionByProductId] = useState({})
  const [likedIds, setLikedIds] = useState(new Set())

  const visibleItems = useMemo(
    () => (category === "전체" ? items : items.filter((p) => p.category === category)),
    [items, category]
  )

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const products = await fetchProducts({ saleType })
      const productsWithNickname = await Promise.all(
        products.map(async (p) => {
          const nickname = await fetchMemberNickname(p.sellerId)
          return { ...p, sellerNickname: nickname || "알 수 없음" }
        })
      )
      // 일반 상품의 가격은 Product, 경매 상품의 현재가는 Auction 응답을 기준으로 사용한다.
      const hasAuction = productsWithNickname.some((p) => p.type === "auction")
      const nextAuctionByProductId = {}
      if (hasAuction) {
        try {
          const auctionData = await fetchAuctionFeed({ size: 200 })
          ;(auctionData?.content || []).forEach((auction) => {
            nextAuctionByProductId[String(auction.productId)] = auction
          })
        } catch {}
      }
      setAuctionByProductId(nextAuctionByProductId)
      setItems(productsWithNickname)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [saleType])

  // 찜한 상품 id들을 한 번에 가져와서 목록 카드의 하트 채움 여부를 표시
  useEffect(() => {
    if (!isAuthenticated) {
      setLikedIds(new Set())
      return
    }
    fetchLikedProducts()
      .then((liked) => setLikedIds(new Set(liked.map((p) => p.id))))
      .catch(() => {})
  }, [isAuthenticated])

  const handleToggleLike = async (e, productId) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    const isLiked = likedIds.has(productId)
    try {
      if (isLiked) {
        await unlikeProduct(productId)
        setLikedIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      } else {
        await likeProduct(productId)
        setLikedIds((prev) => new Set(prev).add(productId))
      }
    } catch {
      showToast({ message: "찜 처리 중 오류가 발생했습니다.", type: "error" })
    }
  }

  return (
    <PageContainer noPadX>
      <Header />

      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -my-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                category === c
                  ? "bg-teal text-teal-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 gap-1.5 rounded-xl bg-muted p-1">
            {SALE_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setSaleType(t.key)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                  saleType === t.key
                    ? "bg-teal text-teal-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/liked")}
            aria-label="찜 목록"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-muted-foreground ring-1 ring-border hover:text-teal"
          >
            <Heart size={17} />
          </button>
          <button
            onClick={load}
            aria-label="새로고침"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-muted-foreground ring-1 ring-border hover:text-teal"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 당근마켓/번개장터처럼 세로로 나열되는 가로형 리스트 — 경매 탭도 전체/일반과
          완전히 같은 레이아웃을 씀 (예전엔 경매 탭만 카드 그리드를 따로 썼음). */}
      <div className="mt-2 flex flex-col divide-y divide-border px-4 pb-24 lg:mx-auto lg:max-w-2xl">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-500">에러: {error}</p>
        ) : visibleItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">상품이 없습니다.</p>
        ) : (
          visibleItems.map((p) => {
            const isAuction = p.type === "auction"
            const auction = auctionByProductId[String(p.id)]
            const isOwner = Number(p.sellerId) === Number(user?.id)
            const goDetail = () => {
              if (isAuction && auction?.auctionId) {
                navigate(`/auctions/${auction.auctionId}`)
              } else {
                navigate(`/products/${p.id}`)
              }
            }
            const displayPrice = isAuction
              ? auction?.currentBid ?? p.auction?.startPrice ?? p.price
              : p.price
            const priceLabel = isAuction && auction ? "현재 입찰가" : isAuction ? "시작가" : "판매가"
            const endsAt = isAuction ? auction?.endsAt ?? p.auction?.endAt : null
            const remaining = endsAt ? timeLeft(new Date(endsAt).getTime()) : null

            return (
              <div
                key={p.id}
                onClick={goDetail}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer items-center gap-3 py-3"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {p.image ? (
                    <>
                      <img
                        src={p.image}
                        alt={p.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none"
                          e.target.nextSibling.style.display = "flex"
                        }}
                      />
                      <div className="h-full w-full items-center justify-center bg-teal-soft" style={{ display: "none" }}>
                        <span className="text-lg font-bold text-teal">Biddy</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-teal-soft">
                      <span className="text-lg font-bold text-teal">Biddy</span>
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    {isAuction && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-soft px-1.5 py-0.5 text-[10px] font-bold text-amber">
                        <Gavel size={9} />
                        경매
                      </span>
                    )}
                    <span className="truncate text-xs text-muted-foreground">{p.category}</span>
                  </div>
                  <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{p.title}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] text-muted-foreground">{priceLabel}</span>
                    <span className="text-base font-bold text-foreground">{formatKRW(displayPrice)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {p.regDt && (
                      <span className="text-[11px] text-muted-foreground">{formatRelativeTime(p.regDt)}</span>
                    )}
                    {remaining && (
                      <span className={`flex items-center gap-1 text-[11px] font-semibold ${remaining.urgent ? "text-amber" : "text-muted-foreground"}`}>
                        <Clock size={11} />
                        {remaining.text}
                      </span>
                    )}
                  </div>
                </div>

                {!isOwner && (
                  <button
                    onClick={(e) => handleToggleLike(e, p.id)}
                    aria-label="찜하기"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
                  >
                    <Heart size={19} className={likedIds.has(p.id) ? "fill-teal text-teal" : "text-muted-foreground"} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      <ChatbotWidget />
    </PageContainer>
  )
}
