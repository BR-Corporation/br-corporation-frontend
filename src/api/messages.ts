import apiClient from './client'

export const messagesApi = {
  listThreads: async () => (await apiClient.get('/messages/threads')).data,
  getThread: async (otherUserId: string) =>
    (await apiClient.get(`/messages/thread/${otherUserId}`)).data,
  send: async (toUserId: string, text: string) =>
    (await apiClient.post('/messages', { toUserId, text })).data,

  // Admin oversight
  listAllConversations: async () => (await apiClient.get('/messages/admin/conversations')).data,
  getAnyThread: async (userAId: string, userBId: string) =>
    (await apiClient.get(`/messages/admin/thread/${userAId}/${userBId}`)).data,

  // Admin: full merged view of a customer's conversation (SP + all admins)
  getCustomerConversation: async (customerUserId: string) =>
    (await apiClient.get(`/messages/admin/customer/${customerUserId}`)).data,
}
