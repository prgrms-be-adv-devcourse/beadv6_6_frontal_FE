import { useState, useEffect, useRef } from "react"
import { Client } from "@stomp/stompjs"
import { getRoomMessages } from "../api/chatApi"
import { useAuth } from "../contexts/AuthContext"

export default function useChatWebSocket(roomId) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
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

    const client = new Client({
      brokerURL: 'ws://localhost:8000/ws-chat',
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
        destination: `/app/chat/rooms/${roomId}`,
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
    isConnected: !!clientRef.current?.connected
  }
}
