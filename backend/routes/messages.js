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
      console.log("❌ Unauthorized: No user found in request");
      console.log("   Cookies:", req.cookies);
      console.log("   Cookie header:", req.headers.cookie);
      console.log("   Authorization:", req.headers.authorization);
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { chatId, text, attachments } = req.body || {};
    if (!chatId || (!text?.trim() && (!attachments || attachments.length === 0))) {
      return res.status(400).json({ error: "Chat ID and message text or attachments are required." });
    }

    const chat = await getChatById(chatId, user.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found." });
    }

    console.log("📤 Creating message with attachments:", {
      chatId,
      textLength: text?.trim().length || 0,
      attachmentsCount: attachments?.length || 0,
      attachments: attachments?.map(a => ({ url: a.url, fileName: a.fileName || a.filename })),
    });
    
    const message = await createMessage({
      chatId,
      senderId: user.id,
      text: text?.trim() || "",
      attachments: attachments || [],
    });
    
    console.log("✅ Message created:", {
      id: message.id,
      chatId: message.chatId,
      text: message.text?.substring(0, 50),
      sender: message.sender?.id,
      attachmentsCount: message.attachments?.length || 0,
    });
    
    await markMessagesRead(chatId, user.id);
    emitNewMessage(message);

    return res.json({ message });
  } catch (error) {
    console.error("❌ Message send error:", error);
    console.error("   Error stack:", error.stack);
    console.error("   Request body:", {
      chatId: req.body?.chatId,
      hasText: !!req.body?.text,
      attachmentsCount: req.body?.attachments?.length || 0,
    });
    return res.status(500).json({ error: "Unable to send message." });
  }
});

router.get("/:chatId", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { chatId } = req.params;
  
  // Validate chatId
  if (!chatId || chatId === "undefined" || chatId === "null") {
    return res.status(400).json({ error: "Invalid chat ID" });
  }

  const chat = await getChatById(chatId, user.id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found." });
  }

  const { limit, cursor } = req.query;
  const data = await getMessagesForChat(chatId, {
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

  const { chatId } = req.params;
  
  // Validate chatId
  if (!chatId || chatId === "undefined" || chatId === "null") {
    return res.status(400).json({ error: "Invalid chat ID" });
  }

  const chat = await getChatById(chatId, user.id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found." });
  }

  await markMessagesRead(chatId, user.id);
  return res.json({ success: true });
});

export default router;
