# 🚀 Raabta - Real-Time Chat Application

![Raabta](https://img.shields.io/badge/Raabta-Real--Time%20Chat-667eea?style=for-the-badge&logo=chat&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-green?style=for-the-badge)

> **Raabta** (Hindi: राबता, meaning "Connection") is a production-ready, full-stack real-time chat application built with the MERN stack and Socket.IO, featuring enterprise-grade architecture suitable for scalable deployments.

---

## 🎯 Project Overview

**Raabta** is a feature-rich real-time messaging platform designed to demonstrate modern web application development best practices. It's built to handle both **1-to-1 (Direct)** and **Group** conversations with real-time message delivery, typing indicators, online presence tracking, and administrative controls.

### Key Highlights for Interviews

- **Real-time Architecture**: Socket.IO with Redis adapter support for horizontal scaling
- **Security First**: JWT authentication, rate limiting, Helmet security headers, CORS protection
- **Clean Code**: MVC architecture with Repository pattern, Service layer abstraction
- **Modern React**: Hooks-based state management, Context API, optimized re-renders
- **Production Ready**: Environment-based configuration, error handling, validation

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React 18 Frontend                             │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │   │
│  │  │ AuthContext │  │  ChatContext │  │ SocketContext        │    │   │
│  │  │ - Login     │  │ - Messages   │  │ - Real-time events  │    │   │
│  │  │ - Register  │  │ - Chats      │  │ - Typing indicators │    │   │
│  │  │ - Logout    │  │ - Typing     │  │ - Online status     │    │   │
│  │  └─────────────┘  └──────────────┘  └─────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS + WebSocket (WSS)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Node.js + Express Server                      │   │
│  │                                                                  │   │
│  │  Security Layer                                                  │   │
│  │  ├── Helmet (Security Headers)                                  │   │
│  │  ├── CORS (Origin Validation)                                   │   │
│  │  ├── Rate Limiting (Express Rate Limit)                         │   │
│  │  │   ├── General: 1000 req/15min                                │   │
│  │  │   ├── Auth: 100 req/hour                                    │   │
│  │  │   └── Messages: 300 req/min                                 │   │
│  │  └── Input Validation (Express-Validator)                      │   │
│  │                                                                  │   │
│  │  API Layer (REST)              Socket.IO Layer                  │   │
│  │  ├── /api/auth                 ├── connection                    │   │
│  │  ├── /api/chat                ├── joinChat                      │   │
│  │  ├── /api/message             ├── leaveChat                     │   │
│  │  └── /api/users               ├── sendMessage                   │   │
│  │                               ├── typing/stopTyping              │   │
│  │                               └── disconnect                     │   │
│  │                                                                  │   │
│  │  Service Layer                                                  │   │
│  │  ├── AuthService          ├── MessageService                    │   │
│  │  ├── ChatRoomService      ├── NotificationService               │   │
│  │  └── UserService                                                  │   │
│  │                                                                  │   │
│  │  Repository Layer (Data Access)                                 │   │
│  │  ├── UserRepository     ├── ChatRoomRepository                  │   │
│  │  └── MessageRepository                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐   │
│  │    MongoDB       │    │  Redis (Optional)│    │   MongoDB      │   │
│  │  User Collection │    │  Socket Adapter  │    │   ChatRoom     │   │
│  │  Message Collect │    │  Session Store   │    │   Message      │   │
│  │  Notification    │    └──────────────────┘    │   Collection   │   │
│  └──────────────────┘                            └────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 Features

### Core Messaging
- ✅ **Direct Messaging** - 1-to-1 private conversations
- ✅ **Group Chat** - Multi-participant group conversations
- ✅ **Real-time Delivery** - Instant message via Socket.IO
- ✅ **Message History** - Paginated chat history with infinite scroll
- ✅ **Read Receipts** - Message read status tracking (✓✓)
- ✅ **Typing Indicators** - Real-time typing status per user/chat
- ✅ **Online Presence** - Live user online/offline status

### User Management
- ✅ **User Registration & Login** - JWT-based authentication
- ✅ **User Search** - Find and connect with other users
- ✅ **Profile Management** - Avatar, username, about section
- ✅ **Session Management** - Secure logout with token invalidation

### Group Management
- ✅ **Create Groups** - Admin can create groups with multiple members
- ✅ **View Members** - See all group participants with roles
- ✅ **Admin Role** - Automatic admin assignment to creator
- ✅ **Admin Permissions** - Only admin can:
  - Add new members
  - Remove existing members
  - Rename the group
  - Update group avatar/description
- ✅ **Leave Group** - Members can leave voluntarily
- ✅ **Group Avatar** - Custom group image support

### Message Features
- ✅ **Text Messages** - Standard text content
- ✅ **Voice Messages** - Audio recording and playback
- ✅ **Message Actions** - Delete for me / Delete for everyone
- ✅ **Message Selection** - Bulk message management
- ✅ **Message Reactions** - Emoji reactions (Phase 3)
- ✅ **Message Search** - Search within messages (Phase 3)
- ✅ **Clear Chat** - Clear all messages in a chat

### UI/UX Features
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **Dark/Light Mode** - Theme switching support
- ✅ **Separated Chat Lists** - Tabs for Direct vs Groups
- ✅ **Unread Count Badges** - Visual notification indicators
- ✅ **Message Preview** - Smart preview with sender name (groups)
- ✅ **Empty States** - Helpful messages when no data

### Security Features
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **JWT Tokens** - Stateless authentication
- ✅ **HTTP-Only Cookies** - Secure token storage
- ✅ **Rate Limiting** - Prevent brute force attacks
- ✅ **Helmet Headers** - Security HTTP headers
- ✅ **CORS Protection** - Origin whitelist validation
- ✅ **Input Validation** - Sanitize and validate all inputs

### Scalability Features
- ✅ **Redis Adapter** - Socket.IO Redis adapter for multi-instance
- ✅ **Stateless Design** - JWT enables horizontal scaling
- ✅ **Indexed Queries** - MongoDB indexes for performance

---

## 📊 Data Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String,        // Unique, 3-20 chars
  email: String,            // Unique, validated
  password: String,        // Hashed (bcrypt)
  avatar: String,          // URL or empty
  about: String,           // Max 100 chars
  publicKey: String,       // For E2E encryption (Phase 3)
  isOnline: Boolean,       // Real-time status
  lastSeen: Date,          // Last activity timestamp
  createdAt: Date,
  updatedAt: Date
}
```

### ChatRoom Model
```javascript
{
  _id: ObjectId,
  name: String,            // For groups only
  description: String,     // Group description
  avatar: String,          // Group image URL
  isGroup: Boolean,        // true = group, false = direct
  users: [ObjectId],       // Array of User references
  admin: ObjectId,        // Group creator (admin) reference
  lastMessage: ObjectId,   // Latest message reference
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  _id: ObjectId,
  sender: ObjectId,        // User reference
  chatRoom: ObjectId,     // ChatRoom reference
  content: String,        // Message text
  type: String,           // 'text' | 'voice'
  voiceUrl: String,       // Audio URL (if voice message)
  isEncrypted: Boolean,   // E2E encryption flag (Phase 3)
  isRead: Boolean,        // Read status
  parentMessage: ObjectId,// Reply-to reference
  reactions: [            // Emoji reactions array
    { user: ObjectId, emoji: String }
  ],
  deletedFor: [ObjectId], // Soft delete per user
  isDeletedForEveryone: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
{
  _id: ObjectId,
  recipient: ObjectId,    // User to notify
  sender: ObjectId,       // User who triggered
  chatRoom: ObjectId,     // Related chat room
  message: String,        // Notification text
  isRead: Boolean,        // Read status
  createdAt: Date
}
```

---

## 🔌 API Endpoints

### Authentication API (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | User login | ❌ |
| GET | `/me` | Get current user | ✅ |
| POST | `/logout` | User logout | ✅ |
| PUT | `/profile` | Update profile | ✅ |
| GET | `/publicKey/:userId` | Get user's public key | ✅ |

### Chat API (`/api/chat`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/direct` | Create/get direct chat | ✅ |
| POST | `/group` | Create group chat | ✅ |
| GET | `/` | Get all user chats | ✅ |
| GET | `/:chatId` | Get specific chat | ✅ |
| GET | `/:chatId/members` | Get chat members | ✅ |
| PUT | `/:chatId` | Update group (admin) | ✅ |
| POST | `/:chatId/members` | Add member (admin) | ✅ |
| DELETE | `/:chatId/members/:userId` | Remove member (admin) | ✅ |
| POST | `/:chatId/leave` | Leave group | ✅ |
| DELETE | `/:chatId` | Delete/leave chat | ✅ |
| GET | `/users/search?query=` | Search users | ✅ |
| GET | `/users/all` | Get all users | ✅ |

### Message API (`/api/message`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Send message | ✅ |
| POST | `/reaction` | Add reaction | ✅ |
| GET | `/search?query=` | Search messages | ✅ |
| GET | `/:chatId` | Get chat history | ✅ |
| PUT | `/read/:chatId` | Mark as read | ✅ |
| DELETE | `/clear/:chatId` | Clear chat | ✅ |
| DELETE | `/:messageId` | Delete message | ✅ |

### User API (`/api/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all users (excl. self) | ✅ |

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `setup` | `{ userId }` | Initialize connection |
| `joinChat` | `{ chatId }` | Join chat room |
| `leaveChat` | `{ chatId }` | Leave chat room |
| `sendMessage` | `{ chatId, content }` | Send message (via socket) |
| `typing` | `{ chatId }` | User is typing |
| `stopTyping` | `{ chatId }` | User stopped typing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ userId }` | Connection established |
| `messageReceived` | `{ message }` | New message |
| `reactionAdded` | `{ messageId, userId, emoji }` | Reaction update |
| `messageDeleted` | `{ messageId, chatRoomId }` | Message deleted |
| `typing` | `{ chatId, userId, username }` | Someone typing |
| `stopTyping` | `{ chatId, userId }` | Typing stopped |
| `notification` | `{ chatRoomId, message }` | New notification |
| `userOnline` | `{ userId }` | User came online |
| `userOffline` | `{ userId }` | User went offline |

---

## 🛡️ Security Implementation

### Authentication Flow
```
1. User submits credentials
   ↓
2. Server validates credentials
   ↓
3. Server generates JWT (30-day expiry)
   ↓
4. JWT set as HTTP-Only cookie + returned in response
   ↓
5. Client stores in localStorage (for API calls)
   ↓
6. All subsequent requests include JWT in:
   - Authorization header: "Bearer <token>"
   - Cookie: automatically sent
   ↓
7. Server validates JWT on each protected route
```

### Rate Limiting Strategy
- **General API**: 1000 requests per 15 minutes per IP
- **Auth Routes**: 100 requests per hour per IP (stricter for login/reg)
- **Message Sending**: 300 requests per minute per user (spam prevention)

### CORS Configuration
```javascript
const allowedOrigins = [
  "http://localhost:3000",           // Development
  "https://your-frontend.netlify.app", // Production
];
```

---

## 🚀 Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure:
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your-secure-secret
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.netlify.app
   ```

### Frontend (Netlify)

1. Create new Netlify site
2. Connect GitHub repository
3. Configure:
   - **Base Directory**: `Frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
5. Deploy

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration with valid/invalid data
- [ ] Login with correct/incorrect credentials
- [ ] Create direct chat between two users
- [ ] Create group chat with multiple users
- [ ] Send and receive messages in real-time
- [ ] Verify typing indicators appear/disappear
- [ ] Test online/offline status updates
- [ ] Admin can add/remove members
- [ ] Non-admin cannot access admin functions
- [ ] Message deletion (own vs everyone)
- [ ] Chat clearing functionality
- [ ] Rate limiting kicks in after threshold
- [ ] Dark mode toggle works correctly

---

## 🔮 Future Improvements (Phase 3+)

- **End-to-End Encryption** - Signal Protocol implementation
- **Offline Support** - IndexedDB message queue
- **Message Threading** - Reply chains
- **File Sharing** - Images, documents, videos
- **Video/Audio Calls** - WebRTC integration
- **Message Forwarding** - Forward to other chats
- **Message Pinning** - Pin important messages
- **User Blocking** - Block/report users
- **Push Notifications** - Native mobile push

---

## 📁 Project Structure

```
Chat Application/
├── Backend/
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Auth logic
│   │   ├── chatController.js     # User search
│   │   ├── chatRoomController.js # Chat CRUD
│   │   └── messageController.js  # Message handling
│   ├── middleware/
│   │   └── auth.js               # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── ChatRoom.js
│   │   ├── Message.js
│   │   └── Notification.js
│   ├── repositories/
│   │   ├── userRepository.js
│   │   ├── chatRoomRepository.js
│   │   └── messageRepository.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── messageRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── chatRoomService.js
│   │   └── messageService.js
│   ├── socket/
│   │   └── socketHandler.js      # Socket.IO setup
│   ├── server.js                  # Express + Socket.IO
│   ├── package.json
│   └── README.md
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatList.jsx      # Chat list with tabs
    │   │   ├── ChatRoom.jsx      # Main chat interface
    │   │   ├── GroupChatModal.jsx
    │   │   ├── UserSearch.jsx
    │   │   └── ProfileSettings.jsx
    │   ├── contexts/
    │   │   ├── AuthContext.jsx   # Auth state
    │   │   └── ChatContext.jsx   # Chat state + socket
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Dashboard.jsx
    │   ├── utils/
    │   │   ├── api.js            # Axios instance
    │   │   ├── socket.js          # Socket.IO client
    │   │   └── debounce.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React | 18.x |
| **State** | React Context API | - |
| **Styling** | CSS Variables + Custom CSS | - |
| **HTTP Client** | Axios | 1.x |
| **Real-time** | Socket.IO Client | 4.x |
| **Icons** | Emoji (native) | - |
| **Date Utils** | date-fns | 3.x |
| **Backend** | Node.js | 18+ |
| **Framework** | Express.js | 4.x |
| **Database** | MongoDB | 6.x |
| **ODM** | Mongoose | 8.x |
| **Auth** | JWT (jsonwebtoken) | 9.x |
| **Password** | bcryptjs | 2.x |
| **WebSocket** | Socket.IO | 4.x |
| **Security** | Helmet | 7.x |
| **Rate Limit** | express-rate-limit | 7.x |
| **Validation** | express-validator | 7.x |
| **Dev Tool** | nodemon | 3.x |

---

## 👨‍💻 Author

**Your Name** - Full-Stack Developer

---

## 📄 License

ISC License - See LICENSE file for details.

---

## 🙏 Acknowledgments

- Built as a learning project for modern full-stack development
- Inspired by WhatsApp, Discord, and Slack UI/UX
- Special thanks to the open-source community

---

<div align="center">

**Raabta** - Every connection matters. 💜

*Star this repo if you found it helpful!*

</div>
