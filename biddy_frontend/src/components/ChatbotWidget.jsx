import { useEffect, useRef, useState } from "react"
import { Bot, Send, X } from "lucide-react"
import { askChatbot } from "../api/chatbotApi"

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([
    { role: "bot", text: "안녕하세요! 이용 중 궁금한 점을 물어보세요.", sources: [] },
  ])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, loading, open])

  const handleSend = async () => {
    const q = question.trim()
    if (!q || loading) return
    setMessages((prev) => [...prev, { role: "user", text: q }])
    setQuestion("")
    setLoading(true)
    try {
      const res = await askChatbot(q)
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: res?.answer || "답변을 가져오지 못했습니다.", sources: res?.sources || [] },
      ])
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "오류가 발생했습니다: " + err.message, sources: [] }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-36 right-5 z-30 flex h-[420px] w-[320px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border lg:bottom-24 lg:right-6">
          <div className="flex items-center justify-between bg-dark px-4 py-3 text-dark-foreground">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bot size={18} className="text-teal" />
              Biddy 챗봇
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="챗봇 닫기"
              className="grid h-7 w-7 place-items-center rounded-full hover:bg-graydark"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-teal text-white"
                      : "bg-background text-foreground ring-1 ring-border"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.sources?.length > 0 && (
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      출처: {m.sources.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground ring-1 ring-border">
                  답변 생성 중...
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="질문을 입력하세요"
              className="h-10 flex-1 rounded-lg bg-background px-3 text-xs text-foreground ring-1 ring-border focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !question.trim()}
              aria-label="질문 보내기"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal text-teal-foreground disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="챗봇 열기"
        className="fixed bottom-20 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-teal-foreground shadow-lg shadow-teal/30 transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
      >
        {open ? <X size={24} /> : <Bot size={26} />}
      </button>
    </>
  )
}
