import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Clock, Gavel, Heart, Trophy, Users, ShieldCheck } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import StatusBadge from "../components/StatusBadge"
import PriceText from "../components/PriceText"
import { useAuth } from "../contexts/AuthContext"
import { fetchAuctionDetail, placeBid, fetchBidHistory, toggleWatch, closeAuction } from "../api/auctionApi"
import { fetchProductById } from "../api/productApi"
import { fetchNicknames } from "../api/client"
import useAuctionWebSocket from "../hooks/useAuctionWebSocket"
import { formatKRW, timeLeft } from "../lib/format"
import { useFeedback } from "../contexts/FeedbackContext"

function BidHistoryModal({ auctionId, open, onClose }) {
  const [bids, setBids] = useState([])
  const [names, setNames] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchBidHistory(auctionId)
      .then((data) => {
        const list = data?.content || []
        setBids(list)
        setLoading(false)
        const ids = list.map((b) => b.bidder?.bidderId).filter(Boolean)
        if (ids.length) fetchNicknames(ids).then(setNames).catch(() => {})
      })
      .catch(() => setLoading(false))
  }, [auctionId, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">입찰 내역</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground">닫기</button>
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">로딩 중...</div>
        ) : bids.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">입찰 내역이 없습니다</div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {bids.map((bid, i) => {
              const nick = names[bid.bidder?.bidderId] || "?"
              const isTop = i === 0
              return (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${isTop ? "bg-teal/10 ring-1 ring-teal/30" : "bg-muted"}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isTop ? "bg-teal text-white" : "bg-card ring-1 ring-border text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-semibold ${isTop ? "text-teal" : "text-foreground"}`}>{nick[0].toUpperCase()}***</span>
                      {isTop && <span className="rounded bg-teal/20 px-1.5 py-0.5 text-[10px] font-bold text-teal">최고가</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {bid.bidAt ? new Date(bid.bidAt).toLocaleString("ko-KR") : ""}
                    </p>
                  </div>
                  <PriceText value={bid.amount} size="sm" className={isTop ? "text-teal font-bold" : "text-foreground"} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuctionDetailPage() {
  const { auctionId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { showToast, confirmDialog } = useFeedback()
  const [auction, setAuction] = useState(null)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [bidAmount, setBidAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [bidError, setBidError] = useState(null)
  const [bidSuccess, setBidSuccess] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [watching, setWatching] = useState(false)
  const [closing, setClosing] = useState(false)
  const [nicknames, setNicknames] = useState({})

  const ws = useAuctionWebSocket(auctionId)

  useEffect(() => {
    if (!auction || !ws.lastMessage) return
    if (ws.currentBid !== null) {
      setAuction((prev) => prev ? {
        ...prev, currentBid: ws.currentBid, bidCount: ws.bidCount ?? prev.bidCount,
      } : prev)
      setBidAmount(String(ws.currentBid + (auction.minIncrement || 0)))
    }
    if (ws.status === "ENDED") {
      setAuction((prev) => prev ? { ...prev, status: "ENDED" } : prev)
    }
  }, [ws.lastMessage])

  const loadAuction = useCallback(() => {
    setLoading(true)
    fetchAuctionDetail(auctionId)
      .then((data) => {
        setAuction(data)
        setWatching(!!data.isWatching)
        setBidAmount(String((data.currentBid || 0) + (data.minIncrement || 0)))
        setLoading(false)
        if (data.productId) {
          fetchProductById(data.productId)
            .then(setProduct)
            .catch(() => {})
        }
        const ids = [data.sellerId, data.topBidder?.bidderId, data.winnerId].filter(Boolean)
        if (ids.length) fetchNicknames(ids).then(setNicknames).catch(() => {})
      })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [auctionId])

  useEffect(() => { loadAuction() }, [loadAuction])

  useEffect(() => {
    if (!auction || auction.status !== "LIVE") return
    const t = setInterval(() => setRemaining(timeLeft(new Date(auction.endsAt).getTime())), 1000)
    setRemaining(timeLeft(new Date(auction.endsAt).getTime()))
    return () => clearInterval(t)
  }, [auction])

  const handleBid = async () => {
    if (!isAuthenticated) { navigate("/login"); return }
    setBidError(null); setBidSuccess(null)
    const amount = Number(bidAmount)
    if (!amount || amount <= 0) { setBidError("입찰 금액을 입력하세요"); return }
    if (amount < minBid) { setBidError(`최소 입찰가는 ${formatKRW(minBid)}입니다`); return }
    if (!Number.isInteger(amount)) { setBidError("입찰 금액은 정수만 가능합니다"); return }
    setSubmitting(true)
    try {
      const result = await placeBid(auctionId, amount)
      setBidSuccess(`입찰 성공! ${formatKRW(result.currentBid)}`)
      loadAuction()
    } catch (err) { setBidError(err.message) }
    finally { setSubmitting(false) }
  }

  const handleClose = async () => {
    const confirmed = await confirmDialog({
      title: "경매 즉시 종료",
      message: "경매를 즉시 종료하시겠습니까?",
      confirmText: "종료",
      variant: "danger",
    })
    if (!confirmed) return
    setClosing(true)
    try {
      await closeAuction(auctionId)
      showToast({ message: "경매가 종료되었습니다.", type: "success" })
      loadAuction()
    } catch (err) {
      showToast({ message: err.message, type: "error" })
    }
    finally { setClosing(false) }
  }

  const handleWatch = async () => {
    if (!isAuthenticated) { navigate("/login"); return }
    try {
      const result = await toggleWatch(auctionId)
      setWatching(result.watching)
      setAuction((prev) => prev ? { ...prev, watcherCount: result.watcherCount } : prev)
    } catch (err) { console.error("관심 등록 실패:", err) }
  }

  if (loading) {
    return (
      <PageContainer noPadX>
        <Header showBack title="경매 상세" />
        <div className="px-4 pt-4">
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
          <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </PageContainer>
    )
  }

  if (error || !auction) {
    return (
      <PageContainer noPadX>
        <Header showBack title="경매 상세" />
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-sm text-red-500">{error || "경매를 찾을 수 없습니다"}</p>
          <button onClick={() => navigate("/")} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-teal-foreground">목록으로</button>
        </div>
      </PageContainer>
    )
  }

  const isLive = auction.status === "LIVE"
  const isSeller = user && String(user.id) === String(auction.sellerId)
  const minBid = (auction.currentBid || 0) + (auction.minIncrement || 0)

  return (
    <PageContainer noPadX>
      <Header showBack title="경매 상세" right={
        isLive ? (
          <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
            ws.connected ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${ws.connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            {ws.connected ? "LIVE" : "OFF"}
          </span>
        ) : null
      } />
      <div className="mx-auto w-full max-w-md">

      {/* Image */}
      <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
        {product?.image && product.image !== "/images/placeholder.png" ? (
          <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <Gavel size={64} className="text-white/20" />
            <p className="text-sm text-white/40">{product?.title || auction.auctionId}</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-28">
        {/* Status + Remaining */}
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge variant={isLive ? "teal" : "neutral"}>{isLive ? "경매중" : "종료"}</StatusBadge>
          {remaining && isLive && (
            <StatusBadge variant={remaining.urgent ? "amber" : "dark"}>
              <Clock size={12} /> {remaining.ended ? "마감" : remaining.text + " 남음"}
            </StatusBadge>
          )}
        </div>

        {/* Title */}
        <h1 className="mt-2 text-lg font-bold text-foreground text-balance">
          {product?.title || `상품 #${auction.productId}`}
        </h1>

        {/* Auction Info Block */}
        <div className="mt-3 rounded-2xl bg-dark p-4 text-dark-foreground">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">{isLive ? "현재 입찰가" : "최종 낙찰가"}</span>
            <span className="flex items-center gap-1 text-xs text-white/70"><Gavel size={12} /> 입찰 {auction.bidCount}회</span>
          </div>
          <PriceText value={auction.currentBid || auction.topBidder?.amount || auction.startPrice} size="xl" className="mt-1 block text-teal" />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white/10 py-2">
              <p className="text-[11px] text-white/60">시작가</p>
              <p className="text-sm font-semibold">{formatKRW(auction.startPrice)}</p>
            </div>
            <div className="rounded-lg bg-white/10 py-2">
              <p className="text-[11px] text-white/60">최소 단위</p>
              <p className="text-sm font-semibold">{formatKRW(auction.minIncrement)}</p>
            </div>
            <div className="rounded-lg bg-white/10 py-2">
              <p className="text-[11px] text-white/60">관심</p>
              <p className="flex items-center justify-center gap-1 text-sm font-semibold"><Users size={12} /> {auction.watcherCount}</p>
            </div>
          </div>
          {isLive && remaining && (
            <div className={`mt-3 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${
              remaining.urgent ? "bg-amber text-amber-foreground" : "bg-white/10 text-white"
            }`}>
              <Clock size={15} /> {remaining.ended ? "경매 마감" : `남은 시간 ${remaining.text}`}
            </div>
          )}
        </div>

        {/* Product Description */}
        {product?.description && (
          <section className="mt-4">
            <h2 className="text-sm font-semibold text-foreground">상품 설명</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </section>
        )}

        {/* Seller Card */}
        {product && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-dark text-dark-foreground font-bold">
              {(nicknames[auction.sellerId] || "판")[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{nicknames[auction.sellerId] || "판매자"}</p>
              <p className="text-xs text-muted-foreground">{product.category} · {product.brand}</p>
            </div>
            <ShieldCheck size={20} className="text-teal" />
          </div>
        )}

        {/* Top Bidder */}
        {auction.topBidder && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-teal text-teal-foreground font-bold"><Trophy size={18} /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">최고 입찰자</p>
              <p className="text-xs text-muted-foreground">{nicknames[auction.topBidder.bidderId] || `회원 #${auction.topBidder.bidderId}`}</p>
            </div>
            <PriceText value={auction.topBidder.amount} size="sm" className="ml-auto text-teal" />
          </div>
        )}

        {/* Info Rows */}
        <div className="mt-3 space-y-2">
          {[
            ["카테고리", product?.category || "-"],
            ["브랜드", product?.brand || "-"],
            ["종료 시각", new Date(auction.endsAt).toLocaleString("ko-KR")],
          ].map(([label, val], i) => (
            <div key={i} className="flex justify-between rounded-xl bg-card px-3 py-2.5 ring-1 ring-border">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-foreground">{val}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setShowHistory(true)}
          className="mt-3 w-full rounded-xl bg-card py-3 text-center text-sm font-semibold text-foreground ring-1 ring-border">
          입찰 내역 보기
        </button>

        {/* Seller Actions (inline — 판매자만) */}
        {isSeller && (
          <div className="mt-3 flex gap-2">
            <button onClick={() => navigate(`/products/${auction.productId}/edit`)}
              className="flex-1 rounded-xl bg-card py-3 text-center text-sm font-semibold text-foreground ring-1 ring-border">
              수정
            </button>
            {isLive && (
              <button onClick={handleClose} disabled={closing}
                className="flex-1 rounded-xl bg-red-500 py-3 text-center text-sm font-bold text-white disabled:opacity-50">
                {closing ? "종료 처리 중..." : "경매 즉시 종료"}
              </button>
            )}
          </div>
        )}

        {/* Result */}
        {!isLive && auction.winnerId && (
          <div className="mt-3 rounded-2xl bg-teal/10 p-4 ring-1 ring-teal/30">
            <div className="flex items-center gap-2"><Trophy size={18} className="text-teal" /><span className="text-sm font-bold text-teal">낙찰 완료</span></div>
            <p className="mt-1 text-sm text-foreground">낙찰자: {nicknames[auction.winnerId] || `회원 #${auction.winnerId}`}</p>
            <PriceText value={auction.currentBid} size="lg" className="mt-1 block text-teal" />
          </div>
        )}
        {!isLive && !auction.winnerId && (
          <div className="mt-3 rounded-2xl bg-muted p-4 text-center">
            <p className="text-sm font-semibold text-muted-foreground">유찰된 경매입니다</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      {isLive && !isSeller && (
        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-4 py-3">
          {bidError && <p className="mb-2 text-center text-xs font-medium text-red-500">{bidError}</p>}
          {bidSuccess && <p className="mb-2 text-center text-xs font-medium text-teal">{bidSuccess}</p>}
          <div className="flex items-center gap-2">
            <button onClick={handleWatch}
              aria-label="찜하기"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ring-border">
              <Heart size={22} className={watching ? "fill-teal text-teal" : "text-muted-foreground"} />
            </button>
            <div className="relative flex-1">
              <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`${formatKRW(minBid)}`}
                className="h-12 w-full rounded-xl bg-card px-3 text-sm font-medium text-foreground outline-none ring-1 ring-border focus:ring-teal" />
            </div>
            <button onClick={handleBid} disabled={submitting || (remaining && remaining.ended)}
              className="h-12 flex-1 rounded-xl bg-teal font-semibold text-teal-foreground disabled:opacity-50">
              {submitting ? "처리중..." : `${formatKRW(Number(bidAmount) || minBid)} 입찰`}
            </button>
          </div>
        </div>
      )}

      <BidHistoryModal auctionId={auctionId} open={showHistory} onClose={() => setShowHistory(false)} />
      </div>
    </PageContainer>
  )
}
