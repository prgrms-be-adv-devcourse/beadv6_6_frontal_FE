import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import PageContainer from "../components/PageContainer"
import { getMyRooms } from "../api/chatApi"
import { fetchProductById } from "../api/productApi"
import { fetchMemberNickname } from "../api/memberApi"
import { useAuth } from "../contexts/AuthContext"

export default function ChatListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadRooms() {
      try {
        setLoading(true)
        const myRooms = await getMyRooms()
        
        // Fetch product and counterpart details for each room
        const roomsWithDetails = await Promise.all(
          myRooms.map(async (room) => {
            let product = null
            let counterpartNickname = "알 수 없음"
            try {
              product = await fetchProductById(room.productId)
              
              // Determine counterpart
              const counterpartId = Number(user.id) === Number(room.buyerId) ? room.sellerId : room.buyerId
              counterpartNickname = await fetchMemberNickname(counterpartId)
            } catch (err) {
              console.error("Failed to load details for room", room.id, err)
            }
            return {
              ...room,
              product,
              counterpartNickname
            }
          })
        )
        
        setRooms(roomsWithDetails)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadRooms()
  }, [user])

  return (
    <PageContainer noPadX>
      <Header />
      
      <div className="px-4 pt-3 pb-4 border-b border-border">
        <h2 className="text-base font-bold text-foreground">채팅</h2>
      </div>

      <div className="flex flex-col pb-24">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-500">에러: {error}</p>
        ) : rooms.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">참여 중인 대화가 없습니다.</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => navigate(`/chats/${room.id}`)}
              className="flex items-center gap-4 px-4 py-4 border-b border-border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
            >
              {room.product?.image ? (
                <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden ring-1 ring-border">
                  <img src={room.product.image} alt="상품" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-dark flex items-center justify-center shrink-0 ring-1 ring-border">
                  <span className="text-xs font-bold text-teal">Biddy</span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-foreground truncate text-sm">
                    {room.counterpartNickname}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {room.product?.title || "삭제된 상품입니다."}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  )
}
