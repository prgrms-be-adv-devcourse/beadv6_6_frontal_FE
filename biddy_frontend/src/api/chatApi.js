import { apiRequest } from "./client"

export const createOrGetRoom = async (productId, sellerId) => {
  const response = await apiRequest("/chats/rooms", {
    method: "POST",
    body: {
      productId,
      sellerId
    }
  })
  return response
}

export const getMyRooms = async () => {
  const response = await apiRequest("/chats/rooms")
  return response
}

export const getRoomMessages = async (roomId, size = 20, lastMessageId = null) => {
  let query = `?size=${size}`
  if (lastMessageId) {
    query += `&lastMessageId=${lastMessageId}`
  }
  const response = await apiRequest(`/chats/rooms/${roomId}/messages${query}`)
  return response
}
