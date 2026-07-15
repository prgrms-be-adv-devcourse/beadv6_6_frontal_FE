import { useEffect, useRef, useState, useCallback } from "react"
import { Client } from "@stomp/stompjs"

// WebSocket URL: Vercel 환경 변수 또는 기본값 사용
const WS_URL = import.meta.env.VITE_WS_URL || "wss://43.200.204.191.nip.io/ws"

export default function useAuctionWebSocket(auctionId) {
  const clientRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [currentBid, setCurrentBid] = useState(null)
  const [bidCount, setBidCount] = useState(null)
  const [status, setStatus] = useState(null)

  const connect = useCallback(() => {
    if (!auctionId) return
    if (!WS_URL) {
      console.warn("VITE_WS_URL is not defined - WebSocket disabled")
      return
    }

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/auctions/${auctionId}`, (msg) => {
          try {
            const data = JSON.parse(msg.body)
            setLastMessage(data)
            if (data.type === "BID") {
              setCurrentBid(data.currentBid)
              setBidCount(data.bidCount)
            } else if (data.type === "ENDED" || data.type === "UNSOLD") {
              setStatus(data.type)
            }
          } catch {}
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    })

    client.activate()
    clientRef.current = client
  }, [auctionId])

  useEffect(() => {
    connect()
    return () => { clientRef.current?.deactivate() }
  }, [connect])

  return { connected, lastMessage, currentBid, bidCount, status }
}
