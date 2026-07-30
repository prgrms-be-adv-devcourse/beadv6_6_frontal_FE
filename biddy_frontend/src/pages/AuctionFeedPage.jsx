import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, Gavel, Heart, Users } from "lucide-react"
import { Client } from "@stomp/stompjs"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import StatusBadge from "../components/StatusBadge"
import PriceText from "../components/PriceText"
import { fetchAuctionFeed, fetchMyWatches } from "../api/auctionApi"
import { fetchProductById } from "../api/productApi"
import { fetchMemberNickname } from "../api/memberApi"
import { useAuth } from "../contexts/AuthContext"
import { timeLeft } from "../lib/format"

// WebSocket URL 설정 (useChatWebSocket 패턴 참고)
const getWebSocketURL = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  // 환경 변수에 VITE_AUCTION_WS_URL이 명시되어 있으면 무조건 그것을 사용 (Vercel 배포 시 사용)
  // 없으면 로컬 개발 환경용으로 baseUrl을 변환해서 사용
  // http://localhost:8000/api → ws://localhost:8000/api/ws
  // https://biddy-zeta.vercel.app/api → wss://biddy-zeta.vercel.app/api/ws
  return import.meta.env.VITE_AUCTION_WS_URL || (baseUrl.replace(/^http/, 'ws') + '/ws')
}

function AuctionCard({ auction, product, sellerNickname, isWatched, onClick }) {
  const isLive = auction.status === "LIVE"
  const remaining = isLive ? timeLeft(new Date(auction.endsAt).getTime()) : null
  const image = product?.image || null
  const title = product?.title || `상품 #${auction.productId}`

  return (
    <div onClick={onClick} className="cursor-pointer overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {image ? (
          <>
            <img src={image} alt={title} className="h-full w-full object-cover"
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex" }} />
            <div className="h-full w-full items-center justify-center bg-dark" style={{ display: "none" }}>
              <span className="text-2xl font-bold text-teal">Biddy</span>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-dark">
            <span className="text-2xl font-bold text-teal">Biddy</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{title}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            isLive ? "bg-amber-soft text-amber" : "bg-muted text-muted-foreground"
          }`}>{isLive ? "경매중" : "종료"}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {product?.category || "-"} · {Number(auction.currentBid).toLocaleString()}원 · 시작가 {Number(auction.startPrice).toLocaleString()}원
        </p>
        <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground/70">
          <span>판매자: {sellerNickname || `회원 #${auction.sellerId}`}</span>
          <span className="flex items-center gap-1">
            <Gavel size={10} /> {auction.bidCount}회
            {isLive && remaining && !remaining.ended && (
              <> · <Clock size={10} /> {remaining.text}</>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AuctionFeedPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [auctions, setAuctions] = useState([])
  const [products, setProducts] = useState({})
  const [nicknames, setNicknames] = useState({})
  const [loading, setLoading] = useState(true)
  const [watchedIds, setWatchedIds] = useState(new Set())
  const [statusFilter, setStatusFilter] = useState("")
  const [sort, setSort] = useState("latest")
  const clientRef = useRef(null)
  const subscriptionsRef = useRef(new Map())

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken")
    if (!token) return
    fetchMyWatches().then((data) => {
      if (data?.content) setWatchedIds(new Set(data.content.map((w) => w.auctionId)))
    }).catch(() => {})
  }, [isAuthenticated])

  // WebSocket 연결 및 구독 관리
  const subscribeToAuctions = useCallback((auctionList) => {
    const WS_URL = getWebSocketURL()
    if (!WS_URL || !clientRef.current?.connected) return

    // 기존 구독 정리
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe())
    subscriptionsRef.current.clear()

    // 새로운 경매들을 구독
    auctionList.forEach((auction) => {
      if (auction.status !== "LIVE") return

      const subscription = clientRef.current.subscribe(
        `/topic/auctions/${auction.auctionId}`,
        (msg) => {
          try {
            const data = JSON.parse(msg.body)
            if (data.type === "BID") {
              setAuctions((prev) =>
                prev.map((a) =>
                  a.auctionId === auction.auctionId
                    ? { ...a, currentBid: data.currentBid, bidCount: data.bidCount }
                    : a
                )
              )
            } else if (data.type === "ENDED") {
              setAuctions((prev) =>
                prev.map((a) =>
                  a.auctionId === auction.auctionId
                    ? { ...a, status: "ENDED" }
                    : a
                )
              )
            }
          } catch (err) {
            console.error("WebSocket message parse error:", err)
          }
        }
      )
      subscriptionsRef.current.set(auction.auctionId, subscription)
    })
  }, [])

  // WebSocket 클라이언트 초기화
  useEffect(() => {
    const WS_URL = getWebSocketURL()
    if (!WS_URL) {
      console.warn("WebSocket URL not configured")
      return
    }

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      onConnect: () => {
        console.log("WebSocket connected")
        // 연결 성공 시 현재 경매 목록 구독
        if (auctions.length > 0) {
          subscribeToAuctions(auctions)
        }
      },
      onDisconnect: () => console.log("WebSocket disconnected"),
      onStompError: (frame) => console.error("WebSocket error:", frame),
    })

    client.activate()
    clientRef.current = client

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe())
      subscriptionsRef.current.clear()
      client.deactivate()
    }
  }, [])

  // 경매 목록이 변경되면 구독 업데이트
  useEffect(() => {
    if (auctions.length > 0 && clientRef.current?.connected) {
      subscribeToAuctions(auctions)
    }
  }, [auctions, subscribeToAuctions])

  useEffect(() => {
    setLoading(true)
    fetchAuctionFeed({ status: statusFilter || undefined, sort })
      .then(async (data) => {
        const list = data?.content || []
        setAuctions(list)
        // 상품 정보 + 닉네임 병렬 로드
        const pMap = {}, nMap = {}
        await Promise.all(list.map(async (a) => {
          try {
            const p = await fetchProductById(a.productId)
            if (p) pMap[a.productId] = p
          } catch {}
          try {
            const n = await fetchMemberNickname(a.sellerId)
            if (n) nMap[a.sellerId] = n
          } catch {}
        }))
        setProducts(pMap)
        setNicknames(nMap)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [statusFilter, sort])

  return (
    <PageContainer noPadX>
      <Header title="경매" showBack />

      <div className="flex gap-2 px-4 pt-3">
        {[["", "전체"], ["LIVE", "진행중"], ["ENDED", "종료"]].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              statusFilter === val ? "bg-dark text-dark-foreground" : "bg-card text-foreground ring-1 ring-border"
            }`}>{label}</button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 pt-2">
        <div />
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border">
          <option value="latest">최신순</option>
          <option value="ending">마감임박</option>
          <option value="price">높은가격</option>
          <option value="priceAsc">낮은가격</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 px-4 pt-3 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : auctions.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">경매가 없습니다</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 px-4 pt-3 pb-4 lg:grid-cols-3 xl:grid-cols-4">
          {auctions.map((a) => (
            <AuctionCard key={a.auctionId} auction={a}
              product={products[a.productId]}
              sellerNickname={nicknames[a.sellerId]}
              isWatched={watchedIds.has(a.auctionId)}
              onClick={() => navigate(`/auctions/${a.auctionId}`)} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}

export function AuctionFeedInline() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [auctions, setAuctions] = useState([])
  const [products, setProducts] = useState({})
  const [nicknames, setNicknames] = useState({})
  const [loading, setLoading] = useState(true)
  const [watchedIds, setWatchedIds] = useState(new Set())
  const [statusFilter, setStatusFilter] = useState("")
  const [sort, setSort] = useState("latest")

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken")
    if (!token) return
    fetchMyWatches().then((data) => {
      if (data?.content) setWatchedIds(new Set(data.content.map((w) => w.auctionId)))
    }).catch(() => {})
  }, [isAuthenticated])

  useEffect(() => {
    setLoading(true)
    fetchAuctionFeed({ status: statusFilter || undefined, sort })
      .then(async (data) => {
        const list = data?.content || []
        setAuctions(list)
        const pMap = {}, nMap = {}
        await Promise.all(list.map(async (a) => {
          try { const p = await fetchProductById(a.productId); if (p) pMap[a.productId] = p } catch {}
          try { const n = await fetchMemberNickname(a.sellerId); if (n) nMap[a.sellerId] = n } catch {}
        }))
        setProducts(pMap)
        setNicknames(nMap)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [statusFilter, sort])

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[["", "전체"], ["LIVE", "진행중"], ["ENDED", "종료"]].map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                statusFilter === val ? "bg-teal text-teal-foreground" : "bg-card text-foreground ring-1 ring-border"
              }`}>{label}</button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border">
          <option value="latest">최신순</option>
          <option value="ending">마감임박</option>
          <option value="price">높은가격</option>
          <option value="priceAsc">낮은가격</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(3)].map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : auctions.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">경매가 없습니다</div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {auctions.map((a) => (
            <AuctionCard key={a.auctionId} auction={a}
              product={products[a.productId]}
              sellerNickname={nicknames[a.sellerId]}
              isWatched={watchedIds.has(a.auctionId)}
              onClick={() => navigate(`/auctions/${a.auctionId}`)} />
          ))}
        </div>
      )}
    </>
  )
}
