import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Heart, ShoppingCart, Clock, Gavel, Star, ShieldCheck, MessageCircle } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import StatusBadge from "../components/StatusBadge"
import PriceText from "../components/PriceText"
import { fetchProductById, fetchIsLiked, likeProduct, unlikeProduct } from "../api/productApi"
import { placeBid, findAuctionByProductId } from "../api/auctionApi"
import { addToCart } from "../api/cartApi"
import { formatKRW, timeLeft } from "../lib/format"
import { useAuth } from "../contexts/AuthContext"
import { fetchMemberNickname } from "../api/memberApi"
import { useFeedback } from "../contexts/FeedbackContext"
import { createOrGetRoom } from "../api/chatApi"

function SellerCard({ seller }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-dark text-dark-foreground font-bold">
        {seller.name.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{seller.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star size={12} className="fill-amber text-amber" />
          {seller.rating} · 거래 {seller.deals}회
        </div>
      </div>
      <ShieldCheck size={20} className="text-teal" />
    </div>
  )
}

function NormalDetail({ product, isOwner }) {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const { isAuthenticated } = useAuth()
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!isOwner && isAuthenticated) {
      fetchIsLiked(product.id).then(setLiked).catch(() => {})
    }
  }, [product.id, isOwner, isAuthenticated])

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    try {
      if (liked) {
        await unlikeProduct(product.id)
        setLiked(false)
        showToast({ message: "찜이 해제되었습니다.", type: "success" })
      } else {
        await likeProduct(product.id)
        setLiked(true)
        showToast({ message: "찜 등록되었습니다.", type: "success" })
      }
    } catch {
      showToast({ message: "찜 처리 중 오류가 발생했습니다.", type: "error" })
    }
  }

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    try {
      const room = await createOrGetRoom(product.id, product.sellerId)
      navigate(`/chats/${room.id}`)
    } catch (err) {
      showToast({ message: "채팅방을 열 수 없습니다.", type: "error" })
    }
  }

  const handleAdd = async () => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    await addToCart(product.id)
    setAdded(true)
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    navigate("/orders", {
      state: {
        items: [
          {
            id: product.id,
            productId: product.id,
            title: product.title,
            price: product.price,
            qty: 1,
            image: product.image,
            sellerId: product.sellerId,
          },
        ],
        total: product.price,
      },
    })
  }

  return (
    <>
      <div className="px-4 pt-3 pb-28">
        <div className="flex items-center gap-2">
          <StatusBadge variant="normal">일반 판매</StatusBadge>
          <StatusBadge variant="neutral">{product.status}</StatusBadge>
        </div>
        <h1 className="mt-2 text-lg font-bold text-foreground text-balance">{product.title}</h1>
        <PriceText value={product.price} size="xl" className="mt-1 block text-foreground" />

        <SellerCard seller={product.seller} />

        <section className="mt-4">
          <h2 className="text-sm font-semibold text-foreground">상품 설명</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        </section>
      </div>

      {/* Sticky actions */}
      {!isOwner && (
        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLike}
              aria-label="찜하기"
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors ${
                liked ? "bg-teal" : "bg-background ring-1 ring-border"
              }`}
            >
              <Heart size={22} className={liked ? "fill-white text-white" : "text-muted-foreground"} />
            </button>
            <button
              onClick={handleStartChat}
              aria-label="채팅하기"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-background ring-1 ring-border"
            >
              <MessageCircle size={22} className="text-muted-foreground" />
            </button>
            <button
              onClick={handleAdd}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-card font-semibold text-foreground ring-1 ring-border"
            >
              <ShoppingCart size={18} />
              {added ? "담김" : "장바구니"}
            </button>
            <button
              onClick={handleBuyNow}
              className="h-12 flex-1 rounded-xl bg-teal font-semibold text-teal-foreground"
            >
              즉시구매
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function AuctionDetail({ product, isOwner }) {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const { isAuthenticated } = useAuth()
  const a = product.auction ?? {}
  const [currentBid, setCurrentBid] = useState(a.currentBid ?? 0)
  const [bidCount, setBidCount] = useState(a.bidCount ?? 0)
  const [remaining, setRemaining] = useState(timeLeft(a.endAt ?? null))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!a.endAt) return
    const t = setInterval(() => setRemaining(timeLeft(a.endAt)), 1000)
    return () => clearInterval(t)
  }, [a.endAt])

  const nextBid = currentBid + a.bidUnit

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    try {
      const room = await createOrGetRoom(product.id, product.sellerId)
      navigate(`/chats/${room.id}`)
    } catch (err) {
      showToast({ message: "채팅방을 열 수 없습니다.", type: "error" })
    }
  }

  const handleBid = async () => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    setSubmitting(true)
    await placeBid(product.id, nextBid)
    setCurrentBid(nextBid)
    setBidCount((c) => c + 1)
    setSubmitting(false)
  }

  return (
    <>
      <div className="px-4 pt-3 pb-28">
        <div className="flex items-center gap-2">
          <StatusBadge variant="auction">경매</StatusBadge>
          <StatusBadge variant="neutral">{product.status}</StatusBadge>
        </div>
        <h1 className="mt-2 text-lg font-bold text-foreground text-balance">{product.title}</h1>

        {/* Auction status block */}
        <div className="mt-3 rounded-2xl bg-dark p-4 text-dark-foreground">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">현재 입찰가</span>
            <span className="flex items-center gap-1 text-xs text-white/70">
              <Gavel size={12} /> 입찰 {bidCount}회
            </span>
          </div>
          <PriceText value={currentBid} size="xl" className="mt-1 block text-teal" />

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-graydark py-2">
              <p className="text-[11px] text-white/60">시작가</p>
              <p className="text-sm font-semibold">{formatKRW(a.startPrice)}</p>
            </div>
            <div className="rounded-lg bg-graydark py-2">
              <p className="text-[11px] text-white/60">입찰 단위</p>
              <p className="text-sm font-semibold">{formatKRW(a.bidUnit)}</p>
            </div>
            <div className="rounded-lg bg-graydark py-2">
              <p className="text-[11px] text-white/60">즉시구매</p>
              <p className="text-sm font-semibold">{a.buyNowPrice ? formatKRW(a.buyNowPrice) : "없음"}</p>
            </div>
          </div>

          <div
            className={`mt-3 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${
              remaining.urgent ? "bg-amber text-amber-foreground" : "bg-graydark text-white"
            }`}
          >
            <Clock size={15} />
            {remaining.ended ? "경매 마감" : `남은 시간 ${remaining.text}`}
          </div>
        </div>

        <SellerCard seller={product.seller} />

        <section className="mt-4">
          <h2 className="text-sm font-semibold text-foreground">상품 설명</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        </section>
      </div>

      {/* Sticky bid */}
      {!isOwner && (
        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartChat}
              aria-label="채팅하기"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-background ring-1 ring-border"
            >
              <MessageCircle size={22} className="text-muted-foreground" />
            </button>
            <button
              onClick={handleBid}
              disabled={submitting || remaining.ended}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50"
            >
              <Gavel size={18} />
              {remaining.ended ? "마감된 경매입니다" : `${formatKRW(nextBid)} 입찰하기`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchProductById(id).then(async (data) => {
      if (!active || !data) return
      // 경매 상품이면 경매 상세 페이지로 리다이렉트
      if (data.type === "auction") {
        try {
          const auctionId = await findAuctionByProductId(data.id)
          if (auctionId) { navigate(`/auctions/${auctionId}`, { replace: true }); return }
        } catch {}
      }
      const nickname = await fetchMemberNickname(data.sellerId).catch(() => null)
      if (active) {
        setProduct({
          ...data,
          seller: { ...data.seller, name: nickname || data.seller.name },
        })
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [id])

  return (
    <PageContainer noPadX>
      <Header showBack title="상품 상세" showCart />
      <div className="mx-auto w-full max-w-md">

      {loading ? (
        <div className="px-4">
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
          <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ) : !product ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-sm text-muted-foreground">상품을 찾을 수 없습니다.</p>
          <button onClick={() => navigate("/products")} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-teal-foreground">
            목록으로
          </button>
        </div>
      ) : (
        <>
          <div className="aspect-square w-full overflow-hidden bg-muted">
            <img src={product.image || "/placeholder.svg"} alt={product.title} className="h-full w-full object-cover" />
          </div>
          {product.type === "auction"
            ? <AuctionDetail product={product} isOwner={Number(product.sellerId) === Number(user?.id)} />
            : <NormalDetail product={product} isOwner={Number(product.sellerId) === Number(user?.id)} />
          }
        </>
      )}
      </div>
    </PageContainer>
  )
}
