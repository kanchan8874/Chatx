import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const objectId = (value) => new mongoose.Types.ObjectId(value);

function formatMember(memberDoc) {
  if (!memberDoc) return null;
  return {
    id: memberDoc._id?.toString(),
    username: memberDoc.username,
    email: memberDoc.email,
    avatar: memberDoc.avatar,
  };
}

function formatMessage(messageDoc) {
  if (!messageDoc) return null;
  const sender =
    typeof messageDoc.sender === "object"
      ? formatMember(messageDoc.sender)
      : { id: messageDoc.sender?.toString() };

  // Extract chatId - handle all possible formats
  let chatId = null;
  if (messageDoc.chat) {
    if (typeof messageDoc.chat === "object" && messageDoc.chat._id) {
      // Populated chat object
      chatId = messageDoc.chat._id.toString();
    } else if (typeof messageDoc.chat === "string") {
      // String ObjectId
      chatId = messageDoc.chat;
    } else if (messageDoc.chat.toString) {
      // ObjectId object
      chatId = messageDoc.chat.toString();
    }
  }
  
  // Ensure chatId is always a string
  if (!chatId) {
    console.error("⚠️ Warning: Message has no chatId!", {
      messageId: messageDoc._id?.toString(),
      chat: messageDoc.chat,
      chatType: typeof messageDoc.chat,
    });
  }

  return {
    id: messageDoc._id?.toString(),
    chatId: chatId || messageDoc.chat?.toString() || null,
    text: messageDoc.text,
    sender,
    attachments: messageDoc.attachments || [],
    readBy: (messageDoc.readBy || []).map((reader) =>
      reader?._id?.toString() || reader?.toString(),
    ),
    createdAt: messageDoc.createdAt,
    updatedAt: messageDoc.updatedAt,
  };
}

function formatChat(chatDoc, unreadCount = 0) {
  if (!chatDoc) return null;
  const members = (chatDoc.members || []).map(formatMember);
  const lastMessage = chatDoc.lastMessage
    ? formatMessage(chatDoc.lastMessage)
    : null;

  return {
    id: chatDoc._id?.toString(),
    members,
    lastMessage,
    unreadCount,
    updatedAt: chatDoc.updatedAt,
    createdAt: chatDoc.createdAt,
  };
}

export async function findUserByIdentifier(identifier) {
  if (!identifier) {
    return null;
  }

  const normalized = identifier.toLowerCase();
  return User.findOne({
    $or: [
      { email: normalized },
      { username: { $regex: new RegExp(`^${normalized}$`, "i") } },
    ],
  });
}

export async function ensureChatBetweenUsers(userIds) {
  const members = userIds.map((id) => objectId(id));

  let chat = await Chat.findOne({
    members: { $all: members, $size: members.length },
  });

  if (!chat) {
    chat = await Chat.create({ members });
  }

  return chat;
}

export async function getChatsForUser(userId) {
  const chats = await Chat.find({ members: userId })
    .populate("members", "username email avatar")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username email avatar" },
    })
    .sort({ updatedAt: -1 })
    .lean();

  if (!chats.length) {
    return [];
  }

  const unreadCounts = await Message.aggregate([
    {
      $match: {
        chat: { $in: chats.map((chat) => chat._id) },
        readBy: { $ne: objectId(userId) },
      },
    },
    {
      $group: { _id: "$chat", count: { $sum: 1 } },
    },
  ]);

  const unreadMap = unreadCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  return chats.map((chat) =>
    formatChat(chat, unreadMap[chat._id.toString()] || 0),
  );
}

export async function getChatById(chatId, userId) {
  // Validate chatId
  if (!chatId || chatId === "undefined" || chatId === "null") {
    return null;
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return null;
  }

  const chat = await Chat.findOne({
    _id: chatId,
    members: userId,
  })
    .populate("members", "username email avatar")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username email avatar" },
    })
    .lean();

  if (!chat) {
    return null;
  }

  const unreadCount = await Message.countDocuments({
    chat: chat._id,
    readBy: { $ne: objectId(userId) },
  });

  return formatChat(chat, unreadCount);
}

export async function getMessagesForChat(chatId, options = {}) {
  const { limit = 40, cursor } = options;
  const filter = { chat: chatId };

  if (cursor) {
    filter._id = { $lt: objectId(cursor) };
  }

  const messages = await Message.find(filter)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("sender", "username email avatar")
    .lean();

  const ordered = messages.reverse().map(formatMessage);
  const nextCursor =
    messages.length === limit ? messages[messages.length - 1]._id : null;

  return {
    messages: ordered,
    nextCursor: nextCursor?.toString() || null,
  };
}

export async function createMessage({ chatId, senderId, text, attachments = [] }) {
  // Ensure chatId is a string for consistency
  const normalizedChatId = chatId?.toString();
  
  // Transform attachments to match Message schema
  const formattedAttachments = (attachments || []).map((att) => ({
    url: att.url,
    filename: att.filename || att.fileName || att.url.split("/").pop(), // Support both filename and fileName
    fileType: att.fileType || (att.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image" : "document"),
    fileSize: att.fileSize || 0,
  }));
  
  const message = await Message.create({
    chat: normalizedChatId,
    sender: senderId,
    text: text || "",
    attachments: formattedAttachments,
    readBy: [senderId],
  });

  await message.populate("sender", "username email avatar");

  await Chat.findByIdAndUpdate(normalizedChatId, {
    lastMessage: message._id,
    updatedAt: new Date(),
  });

  const formattedMessage = formatMessage(message);
  
  // Explicitly set chatId to ensure it's always present
  if (formattedMessage && !formattedMessage.chatId) {
    formattedMessage.chatId = normalizedChatId;
    console.log("⚠️ Fixed missing chatId in formatted message:", normalizedChatId);
  }
  
  console.log("📝 Created message with chatId:", formattedMessage?.chatId);
  
  return formattedMessage;
}

export async function markMessagesRead(chatId, userId) {
  await Message.updateMany(
    { chat: chatId, readBy: { $ne: objectId(userId) } },
    { $addToSet: { readBy: objectId(userId) } },
  );
}

