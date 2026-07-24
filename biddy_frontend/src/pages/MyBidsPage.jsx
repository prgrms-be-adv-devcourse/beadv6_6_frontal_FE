import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Gavel } from "lucide-react"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import PriceText from "../components/PriceText"
import StatusBadge from "../components/StatusBadge"
import { fetchMyBids } from "../api/auctionApi"

export default function MyBidsPage() {
  const navigate = useNavigate()
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyBids()
      .then((data) => { setBids(data?.content || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <PageContainer noPadX>
      <Header title="내 입찰" showBack />
      {loading ? (
        <div className="space-y-3 px-4 pt-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : bids.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">입찰 내역이 없습니다</div>
      ) : (
        <div className="space-y-3 px-4 pt-3 pb-4">
          {bids.map((b) => (
            <div key={b.auctionId} onClick={() => navigate(`/auctions/${b.auctionId}`)}
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
              <Gavel size={20} className="shrink-0 text-teal" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{b.auctionId}</p>
                <p className="text-xs text-muted-foreground">내 최고 입찰: {b.myHighestBid?.toLocaleString()}원</p>
              </div>
              <PriceText value={b.currentBid} size="sm" className="text-teal" />
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
