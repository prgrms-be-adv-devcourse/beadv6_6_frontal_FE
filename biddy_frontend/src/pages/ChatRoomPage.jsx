import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ChevronLeft, Send } from "lucide-react"
import useChatWebSocket from "../hooks/useChatWebSocket"
import { useAuth } from "../contexts/AuthContext"

export default function ChatRoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const { messages, loading, sendMessage, isConnected } = useChatWebSocket(roomId)
  const [inputText, setInputText] = useState("")
  const messagesEndRef = useRef(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
    <div className="flex flex-col h-screen bg-card">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="-ml-2 p-2">
            <ChevronLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">채팅방</h1>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <p className="text-sm text-muted-foreground">메시지를 불러오는 중...</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = Number(msg.senderId) === Number(user?.id)
            return (
              <div key={msg.id || index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className={`flex items-end gap-1.5 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div 
                    className={`px-4 py-2 rounded-2xl ${
                      isMe 
                        ? "bg-teal text-white rounded-br-none" 
                        : "bg-muted text-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mb-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-card shrink-0 mb-safe">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 h-11 px-4 rounded-full bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-teal text-white disabled:bg-muted disabled:text-muted-foreground transition-colors"
          >
            <Send size={18} className={inputText.trim() && isConnected ? "ml-0.5" : ""} />
          </button>
        </div>
      </form>
    </div>
  )
}
