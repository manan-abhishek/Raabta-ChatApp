# Raabta - Backend API

## 📝 Project Summary

**Raabta** is a full-stack real-time chat application supporting authentication, direct and group messaging, real-time notifications, typing indicators, and user presence using MERN stack and Socket.IO.

A real-time chat application backend built with Node.js, Express.js, MongoDB, and Socket.IO. This backend provides RESTful APIs and WebSocket support for instant messaging, user authentication, and real-time communication features.

## 🧱 System Architecture

```
Client (React)
   ↓ REST / WebSocket
API Server (Express + Socket.IO)
   ↓
MongoDB (Mongoose)
```

## 🤔 Why This Tech Stack?

- **React**: Component-based architecture enabling real-time UI updates
- **Node.js + Express**: Lightweight, scalable API server with excellent WebSocket support
- **MongoDB**: Flexible schema perfect for evolving chat data structures
- **Socket.IO**: Low-latency real-time communication with automatic fallbacks
- **JWT**: Stateless, secure authentication that scales horizontally
- **Mongoose**: Robust ODM for MongoDB with schema validation and middleware hooks

## 🚀 Features

- **User Authentication** - JWT-based authentication with secure password hashing
- **Real-time Messaging** - Socket.IO for instant message delivery
- **Chat Rooms** - Support for direct (1-to-1) and group chats
- **Message Management** - Send, receive, and track message history
- **Read Receipts** - Track message read status
- **Typing Indicators** - Real-time typing status updates
- **Online/Offline Status** - User presence tracking
- **User Search** - Search and discover other users
- **Notifications** - Unread message notifications stored in MongoDB

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## 🛠️ Installation

1. **Navigate to the Backend directory:**
   ```bash
   cd Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file in the Backend directory:**
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 📁 Project Structure

```
Backend/
├── config/
│   └── database.js              # MongoDB connection configuration
├── controllers/
│   ├── authController.js        # Authentication logic (register, login, logout)
│   ├── chatController.js        # User search and listing
│   ├── chatRoomController.js    # Chat room management
│   └── messageController.js     # Message handling
├── middleware/
│   └── auth.js                  # JWT authentication middleware
├── models/
│   ├── User.js                  # User schema
│   ├── ChatRoom.js              # Chat room schema
│   ├── Message.js               # Message schema
│   └── Notification.js          # Notification schema (stored in MongoDB)
├── routes/
│   ├── authRoutes.js            # Authentication routes
│   ├── chatRoutes.js            # Chat room routes
│   ├── messageRoutes.js         # Message routes
│   └── userRoutes.js            # User routes
├── socket/
│   └── socketHandler.js         # Socket.IO event handlers
├── server.js                    # Main server file
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register a new user | No |
| POST | `/login` | Login user | No |
| GET | `/me` | Get current user | Yes |
| POST | `/logout` | Logout user | Yes |

**Register Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Chat Rooms (`/api/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/direct` | Create or get direct chat | Yes |
| POST | `/group` | Create group chat | Yes |
| GET | `/` | Get all user chats | Yes |
| GET | `/:chatId` | Get specific chat | Yes |
| GET | `/users/search?query=abc` | Search users | Yes |
| GET | `/users/all` | Get all users (for group creation) | Yes |

**Create Direct Chat:**
```json
{
  "userId": "user_id_here"
}
```

**Create Group Chat:**
```json
{
  "name": "Group Name",
  "userIds": ["user_id_1", "user_id_2"]
}
```

**Search Users:**
```
GET /api/chat/users/search?query=john
```

### Messages (`/api/message`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Send a message | Yes |
| GET | `/:chatId` | Get chat history | Yes |
| PUT | `/read/:chatId` | Mark messages as read | Yes |

**Send Message:**
```json
{
  "chatRoomId": "chat_room_id",
  "content": "Hello, world!"
}
```

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all users (except current user) | Yes |

## 🔌 Socket.IO Events

### Client → Server Events

- `setup` - Initialize user connection with userId
- `joinChat` - Join a chat room
- `sendMessage` - Send a message (handled by REST API, socket for real-time delivery)
- `typing` - User is typing indicator
- `stopTyping` - User stopped typing indicator

### Server → Client Events

- `connected` - Connection confirmed
- `messageReceived` - New message received in real-time
- `typing` - Someone is typing in the chat
- `stopTyping` - Typing stopped
- `notification` - New notification event
- `user-online` - User came online
- `user-offline` - User went offline

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The token is obtained after successful login or registration.

For Socket.IO connections, the token is sent in the handshake:
```javascript
socket.connect({
  auth: {
    token: 'your_jwt_token'
  }
});
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **socket.io** - Real-time communication
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

## 🧪 Testing

Use Postman or any API client to test the endpoints. Make sure to:

1. Register a new user
2. Login to get a JWT token
3. Use the token in Authorization header for protected routes
4. Test Socket.IO connection with the token in `auth.token`

## 🐛 Error Handling

The API returns standardized error responses:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Server port | 5000 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `NODE_ENV` | Environment mode | development |

## 📝 Notes

- **Notifications**: Notifications are stored in MongoDB via the `Notification` model, allowing for persistence and history tracking. Real-time notification events are also delivered via Socket.IO.

- The server uses MongoDB for data persistence
- Socket.IO handles real-time communication with automatic reconnection
- JWT tokens are used for stateless authentication
- Passwords are hashed using bcryptjs with salt rounds
- All timestamps are stored in UTC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

ISC

---

**Raabta** - Every connection matters. 💜
