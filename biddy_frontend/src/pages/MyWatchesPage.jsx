import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import PriceText from "../components/PriceText"
import StatusBadge from "../components/StatusBadge"
import { fetchMyWatches } from "../api/auctionApi"

export default function MyWatchesPage() {
  const navigate = useNavigate()
  const [watches, setWatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyWatches()
      .then((data) => { setWatches(data?.content || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <PageContainer noPadX>
      <Header title="관심 경매" showBack />
      {loading ? (
        <div className="space-y-3 px-4 pt-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : watches.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">관심 경매가 없습니다</div>
      ) : (
        <div className="space-y-3 px-4 pt-3 pb-4">
          {watches.map((w) => (
            <div key={w.auctionId} onClick={() => navigate(`/auctions/${w.auctionId}`)}
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
              <Heart size={20} className="shrink-0 fill-red-500 text-red-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{w.auctionId}</p>
                <StatusBadge variant={w.status === "LIVE" ? "auction" : "neutral"} className="mt-1">{w.status}</StatusBadge>
              </div>
              <PriceText value={w.currentBid} size="sm" className="text-teal" />
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
