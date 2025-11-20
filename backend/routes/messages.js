import { Router } from "express";
import { connectDB } from "../lib/db.js";
import {
  createMessage,
  getChatById,
  getMessagesForChat,
  markMessagesRead,
} from "../lib/chat-service.js";
import { getUserFromRequest } from "../lib/auth.js";
import { emitNewMessage } from "../socket/server.js";

const router = Router();

router.use(async (req, res, next) => {
  await connectDB();
  next();
});

router.post("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { chatId, text } = req.body || {};
    if (!chatId || !text?.trim()) {
      return res.status(400).json({ error: "Chat ID and message text are required." });
    }

    const chat = await getChatById(chatId, user.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found." });
    }

    const message = await createMessage({ chatId, senderId: user.id, text: text.trim() });
    await markMessagesRead(chatId, user.id);
    emitNewMessage(message);

    return res.json({ message });
  } catch (error) {
    console.error("Message send error", error);
    return res.status(500).json({ error: "Unable to send message." });
  }
});

router.get("/:chatId", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const chat = await getChatById(req.params.chatId, user.id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found." });
  }

  const { limit, cursor } = req.query;
  const data = await getMessagesForChat(req.params.chatId, {
    limit: Math.min(Number(limit) || 40, 100),
    cursor,
  });

  return res.json(data);
});

router.patch("/:chatId/read", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const chat = await getChatById(req.params.chatId, user.id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found." });
  }

  await markMessagesRead(req.params.chatId, user.id);
  return res.json({ success: true });
});

export default router;
