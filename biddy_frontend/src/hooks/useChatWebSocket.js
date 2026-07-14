import { useState, useEffect, useRef } from "react"
import { Client } from "@stomp/stompjs"
import { getRoomMessages } from "../api/chatApi"
import { useAuth } from "../contexts/AuthContext"

export default function useChatWebSocket(roomId) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef(null)
  
  // Load initial history
  useEffect(() => {
    if (!roomId) return

    async function loadHistory() {
      try {
        setLoading(true)
        const history = await getRoomMessages(roomId, 50) // load 50 messages
        // history is usually sorted descending from backend (latest first)
        // Reverse it for UI so latest is at the bottom
        setMessages(history.reverse())
      } catch (err) {
        console.error("Failed to load chat history:", err)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [roomId])

  // Connect WebSocket
  useEffect(() => {
    if (!roomId || !user) return

    const token = localStorage.getItem("accessToken")
    if (!token) return

    let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    // Vercel의 Rewrite 기능을 타는 경우 등, 상대 경로('/api')로 들어오면 절대 경로로 변환
    if (baseUrl.startsWith('/')) {
      baseUrl = `${window.location.protocol}//${window.location.host}${baseUrl}`;
    }

    // http -> ws, https -> wss 로 변환 후 뒤에 /ws-chat 추가
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws-chat';

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function (str) {
        console.log("STOMP: " + str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    client.onConnect = (frame) => {
      console.log('Connected: ' + frame)
      setIsConnected(true)
      
      // Subscribe to room
      client.subscribe(`/topic/room/${roomId}`, (message) => {
        if (message.body) {
          const newMsg = JSON.parse(message.body)
          setMessages((prev) => [...prev, newMsg])
        }
      })
    }

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message'])
      console.error('Additional details: ' + frame.body)
    }
    
    client.onWebSocketClose = () => {
      setIsConnected(false)
    }

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [roomId, user])

  // Send message
  const sendMessage = (content) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination: `/app/chat.send`,
        body: JSON.stringify({
          roomId: Number(roomId),
          senderId: Number(user.id),
          content: content
        })
      })
    } else {
      console.error("STOMP connection not active")
    }
  }

  return {
    messages,
    loading,
    sendMessage,
    isConnected
  }
}
