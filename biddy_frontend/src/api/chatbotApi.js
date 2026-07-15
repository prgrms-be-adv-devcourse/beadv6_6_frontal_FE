import { apiRequest } from "./client"

export const askChatbot = async (question) => {
  const response = await apiRequest("/chatbot/query", {
    method: "POST",
    body: { question },
  })
  return response
}
