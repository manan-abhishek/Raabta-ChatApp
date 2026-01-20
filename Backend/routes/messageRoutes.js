const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getChatHistory,
  markMessagesAsRead,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Phase 3: Message APIs
router.post("/", sendMessage);
router.get("/:chatId", getChatHistory);
router.put("/read/:chatId", markMessagesAsRead);

module.exports = router;
