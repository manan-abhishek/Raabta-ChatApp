const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getChatHistory,
  markAsRead,
  searchMessages,
  addReaction,
  deleteMessage,
  clearChat,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.post("/", protect, sendMessage);
router.post("/reaction", protect, addReaction);
router.get("/search", protect, searchMessages);
router.get("/:chatId", protect, getChatHistory);
router.put("/read/:chatId", protect, markAsRead);
router.delete("/clear/:chatId", protect, clearChat);
router.delete("/:messageId", protect, deleteMessage);

module.exports = router;
