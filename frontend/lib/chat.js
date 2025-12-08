import { serverFetch } from "./api-client-server";

export async function fetchChats() {
  try {
  const data = await serverFetch("/api/chat");
  return data.chats || [];
  } catch (error) {
    return [];
  }
}

export async function fetchChat(chatId) {
  try {
  const data = await serverFetch(`/api/chat/${chatId}`);
  return data.chat;
  } catch (error) {
    return null;
  }
}

export async function fetchMessages(chatId, options = {}) {
  const query = new URLSearchParams();
  if (options.limit) query.set("limit", options.limit);
  if (options.cursor) query.set("cursor", options.cursor);
  const qs = query.toString();
  try {
  const data = await serverFetch(`/api/messages/${chatId}${qs ? `?${qs}` : ""}`);
  return data;
  } catch (error) {
    return { messages: [], nextCursor: null };
  }
}
