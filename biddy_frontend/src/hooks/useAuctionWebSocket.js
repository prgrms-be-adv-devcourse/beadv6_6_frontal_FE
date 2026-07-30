import { useEffect, useRef, useState, useCallback } from "react"
import { Client } from "@stomp/stompjs"

// WebSocket URL 설정 (채팅과 동일한 패턴)
// 환경 변수가 있으면 사용, 없으면 API_BASE_URL 기반으로 자동 생성
const getWebSocketURL = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  // http://localhost:8000/api → ws://localhost:8000/api/ws
  // https://biddy-zeta.vercel.app/api → wss://biddy-zeta.vercel.app/api/ws
  return baseUrl.replace(/^http/, 'ws') + '/ws'
}

const WS_URL = getWebSocketURL()

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
