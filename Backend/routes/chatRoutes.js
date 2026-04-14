const express = require("express");
const router = express.Router();
const {
  createOrGetDirectChat,
  createGroupChat,
  getUserChats,
  getChat,
  deleteChat,
} = require("../controllers/chatRoomController");
const { searchUsers, getAllUsers } = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// User search and list (define BEFORE param routes)
router.get("/users/search", searchUsers);
router.get("/users/all", getAllUsers);

// Phase 2: Chat Room APIs
router.post("/direct", createOrGetDirectChat);
router.post("/group", createGroupChat);
router.get("/", getUserChats);
router.get("/:chatId", getChat);
router.delete("/:chatId", deleteChat);

module.exports = router;
