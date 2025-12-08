import { Router } from "express";
import { connectDB } from "../lib/db.js";
import {
  ensureChatBetweenUsers,
  findUserByIdentifier,
  getChatById,
  getChatsForUser,
} from "../lib/chat-service.js";
import { getUserFromRequest } from "../lib/auth.js";

const router = Router();

router.use(async (req, res, next) => {
  await connectDB();
  next();
});

router.get("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const chats = await getChatsForUser(user.id);
  return res.json({ chats });
});

router.post("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { participantId, identifier } = req.body || {};
    let targetUserId = participantId;

    if (!targetUserId) {
      const found = await findUserByIdentifier(identifier);
      if (!found) {
        return res.status(404).json({ error: "User not found" });
      }
      targetUserId = found._id.toString();
    }

    if (targetUserId === user.id) {
      return res.status(400).json({ error: "You cannot start a chat with yourself." });
    }

    const chat = await ensureChatBetweenUsers([user.id, targetUserId]);
    const hydrated = await getChatById(chat._id, user.id);
    return res.status(chat.createdAt === chat.updatedAt ? 201 : 200).json({ chat: hydrated });
  } catch (error) {
    console.error("Chat create error", error);
    return res.status(500).json({ error: "Unable to create chat." });
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
    return res.status(404).json({ error: "Chat not found" });
  }

  return res.json({ chat });
});

export default router;
