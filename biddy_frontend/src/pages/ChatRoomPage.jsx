import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Send } from "lucide-react"
import useChatWebSocket from "../hooks/useChatWebSocket"
import { useAuth } from "../contexts/AuthContext"
import { getMyRooms } from "../api/chatApi"
import { fetchProductById } from "../api/productApi"
import { fetchMemberNickname } from "../api/memberApi"
import { formatKRW, formatChatDateDivider, isSameDay } from "../lib/format"

export default function ChatRoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { messages, loading, sendMessage, isConnected } = useChatWebSocket(roomId)
  const [inputText, setInputText] = useState("")
  const [product, setProduct] = useState(null)
  const [counterpartName, setCounterpartName] = useState("")
  const messagesEndRef = useRef(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load the room's product (for the summary bar) and the counterpart's
  // nickname (for the header title), the same way ChatListPage already does.
  useEffect(() => {
    if (!roomId || !user) return
    let active = true
    getMyRooms()
      .then((rooms) => {
        const room = rooms.find((r) => String(r.id) === String(roomId))
        if (!room) return

        const counterpartId = Number(user.id) === Number(room.buyerId) ? room.sellerId : room.buyerId
        fetchMemberNickname(counterpartId)
          .then((name) => {
            if (active) setCounterpartName(name || "상대방")
          })
          .catch(() => {})

        if (room.productId) {
          fetchProductById(room.productId)
            .then((data) => {
              if (active && data) setProduct(data)
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [roomId, user])

  const handleSend = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return
    sendMessage(inputText)
    setInputText("")
  }

  // Format time (e.g. "오후 2:30")
  const formatTime = (isoString) => {
    if (!isoString) return ""
    const date = new Date(isoString)
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "오후" : "오전"
    hours = hours % 12
    hours = hours ? hours : 12
    return `${ampm} ${hours}:${minutes}`
  }

  return (
    // Same "hybrid" frame every other page uses (bg-background outer + centered
    // max-w-md column) — this page was missing it entirely and rendering full-bleed,
    // which is why it looked unfinished next to the rest of the app.
    <div className="flex min-h-screen justify-center bg-background">
      <div className="flex h-screen w-full max-w-md flex-col bg-card shadow-sm">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-card px-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
        >
          <ChevronLeft size={22} className="text-foreground" />
        </button>
        {counterpartName ? (
          <h1 className="truncate text-base font-bold text-foreground">{counterpartName}</h1>
        ) : (
          <span className="h-5 w-24 animate-pulse rounded bg-muted" />
        )}
      </header>

      {/* Product summary bar */}
      {product && (
        <button
          onClick={() => navigate(`/products/${product.id}`)}
          className="flex shrink-0 items-center gap-2.5 border-b border-border bg-card px-4 py-1.5 text-left"
        >
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
            <p className="text-sm font-bold text-teal">{formatKRW(product.price)}</p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
        </button>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-background p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <p className="text-sm text-muted-foreground">메시지를 불러오는 중...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-foreground">첫 메시지를 보내보세요</p>
            <p className="text-xs text-muted-foreground">상품에 대해 궁금한 점을 물어보세요.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = Number(msg.senderId) === Number(user?.id)
            const prevMsg = messages[index - 1]
            const showDateDivider = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)
            return (
              <div key={msg.id || index} className="flex flex-col">
                {showDateDivider && (
                  <div className="flex justify-center py-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      {formatChatDateDivider(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`flex items-end gap-1.5 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`px-4 py-2 shadow-sm rounded-2xl ${
                        isMe
                          ? "bg-teal text-teal-foreground rounded-br-md"
                          : "bg-card text-foreground ring-1 ring-border rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mb-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="shrink-0 border-t border-border bg-card p-3 mb-safe">
        {!isConnected && (
          <p className="mb-2 text-center text-xs font-medium text-amber">연결 중...</p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="h-11 flex-1 rounded-full bg-muted px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-teal"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-teal-foreground transition-colors disabled:bg-muted disabled:text-muted-foreground"
          >
            <Send size={18} className={inputText.trim() && isConnected ? "ml-0.5" : ""} />
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}
