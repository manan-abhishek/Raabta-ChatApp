# Raabta - Frontend

## 📝 Project Summary

**Raabta** is a full-stack real-time chat application supporting authentication, direct and group messaging, real-time notifications, typing indicators, and user presence using MERN stack and Socket.IO.

A modern, real-time chat application frontend built with React.js, Vite, Socket.IO Client, and React Router. This frontend provides a beautiful and intuitive user interface for instant messaging, user management, and real-time communication.

## 🚀 Features

- **User Authentication** - Login and registration with JWT
- **Real-time Messaging** - Instant message delivery via Socket.IO
- **Chat Management** - Create direct and group chats
- **Message History** - View and scroll through chat history
- **Typing Indicators** - See when others are typing
- **Online/Offline Status** - User presence indicators
- **Notifications** - Unread message badges
- **User Search** - Find and connect with other users
- **Modern UI/UX** - Beautiful, responsive design with smooth animations
- **Message Grouping** - Messages grouped by date
- **Auto-scroll** - Automatically scroll to latest messages

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see Backend README)

## 🛠️ Installation

1. **Navigate to the Frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file in the Frontend directory (optional):**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will start on `http://localhost:3000` (or the port shown in terminal).

5. **Build for production:**
   ```bash
   npm run build
   ```

   The production build will be in the `dist` directory.

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── ChatList.jsx          # Chat list sidebar component
│   │   ├── ChatList.css          # Chat list styles
│   │   ├── ChatRoom.jsx          # Chat room component
│   │   ├── ChatRoom.css          # Chat room styles
│   │   ├── GroupChatModal.jsx    # Group chat creation modal
│   │   ├── UserSearch.jsx         # User search modal
│   │   ├── Modal.css             # Modal styles
│   │   └── ProtectedRoute.jsx    # Route protection component
│   ├── contexts/
│   │   ├── AuthContext.jsx       # Authentication context
│   │   └── ChatContext.jsx       # Chat state management
│   ├── pages/
│   │   ├── Login.jsx             # Login page
│   │   ├── Register.jsx          # Registration page
│   │   ├── Dashboard.jsx         # Main dashboard
│   │   ├── Auth.css              # Auth page styles
│   │   └── Dashboard.css        # Dashboard styles
│   ├── utils/
│   │   ├── api.js                # API service (Axios)
│   │   └── socket.js             # Socket.IO client
│   ├── App.jsx                    # Main app component
│   ├── App.css                   # App styles
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── index.html                    # HTML template
├── vite.config.js               # Vite configuration
├── package.json
└── README.md
```

## 🎨 Key Components

### Authentication
- **Login Page** - User login with email and password
- **Register Page** - New user registration
- **Protected Routes** - Routes that require authentication

### Dashboard
- **Sidebar** - User info and logout
- **Chat List** - List of all user chats with unread badges
- **Chat Room** - Active chat interface with messages
- **User Search** - Modal to search and start new chats
- **Group Chat Modal** - Create group chats with multiple users

### Real-time Features
- **Socket.IO Integration** - Real-time message delivery
- **Typing Indicators** - Animated typing status
- **Online/Offline Status** - User presence tracking
- **Notifications** - Unread message badges

## 🔌 API Integration

The frontend communicates with the backend through:

1. **REST API** - Using Axios for HTTP requests
2. **WebSocket** - Using Socket.IO Client for real-time events

### API Service (`src/utils/api.js`)

- `authAPI` - Authentication endpoints
  - `register()` - User registration
  - `login()` - User login
  - `getMe()` - Get current user
  - `logout()` - User logout

- `chatAPI` - Chat room endpoints
  - `createDirectChat(userId)` - Create/get direct chat
  - `createGroupChat(data)` - Create group chat
  - `getUserChats()` - Get all user chats
  - `getChat(chatId)` - Get specific chat
  - `searchUsers(query)` - Search users (`/api/chat/users/search`)
  - `getAllUsers()` - Get all users (`/api/chat/users/all`)

- `messageAPI` - Message endpoints
  - `sendMessage(data)` - Send a message
  - `getChatHistory(chatId, page, limit)` - Get chat history
  - `markAsRead(chatId)` - Mark messages as read

- `userAPI` - User endpoints
  - `getAllUsers()` - Get all users (`/api/users`)

### Socket Service (`src/utils/socket.js`)

- `initSocket(token)` - Initialize Socket.IO connection with JWT token
- `getSocket()` - Get current socket instance
- `disconnectSocket()` - Disconnect socket

## 🎯 State Management

The application uses React Context API for state management:

### AuthContext
- User authentication state
- Login/logout functions
- Token management
- Socket.IO initialization on login

### ChatContext
- Chat list and selected chat
- Messages for each chat (keyed by chatId)
- Typing indicators (keyed by chatId and userId)
- Notifications array
- Real-time updates via Socket.IO listeners
- Auto-loading of chats and messages

## 🎨 Styling

- **CSS Modules** - Component-specific styles
- **Modern Design** - Gradient themes (#667eea to #764ba2), smooth animations
- **Responsive** - Works on desktop and mobile devices
- **Custom Scrollbars** - Styled scrollbars matching the theme
- **Animations** - Smooth transitions, fade-ins, hover effects
- **Glassmorphism** - Backdrop blur effects in headers
- **Shadows & Depth** - Layered shadows for visual hierarchy

## 📦 Dependencies

- **react** - UI library
- **react-dom** - React DOM renderer
- **react-router-dom** - Client-side routing
- **socket.io-client** - WebSocket client for real-time communication
- **axios** - HTTP client for REST API calls
- **date-fns** - Date formatting and manipulation
- **vite** - Fast build tool and dev server

## 🚀 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |
| `VITE_SOCKET_URL` | Socket.IO server URL | http://localhost:5000 |

### Vite Configuration

The project uses Vite for fast development and optimized builds. Configuration is in `vite.config.js`. Vite provides:
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- ES modules support
- Built-in TypeScript support (if needed)

## 🎯 Features in Detail

### Authentication Flow
1. User registers/logs in via form
2. JWT token stored in localStorage
3. User data stored in localStorage
4. Socket.IO connection initialized with token
5. Socket emits `setup` event with userId
6. User redirected to dashboard
7. On page reload, token is validated and user data refreshed

### Chat Flow
1. User selects existing chat or creates new one
2. Messages loaded from API (`GET /api/message/:chatId`)
3. Socket.IO joins chat room (`joinChat` event)
4. Real-time messages received via Socket.IO (`messageReceived` event)
5. Messages added to state and displayed
6. Typing indicators shown in real-time
7. Auto-scroll to latest message

### Message Features
- **Date Grouping** - Messages grouped by date (Today, Yesterday, or formatted date)
- **Auto-scroll** - Automatically scrolls to latest message on new messages
- **Read Status** - Messages marked as read when chat opened (`PUT /api/message/read/:chatId`)
- **Unread Badges** - Show unread count in chat list header and individual chats
- **Message Time** - Formatted timestamps (HH:mm for today, full date for older)

### Typing Indicators
- Shows animated dots when someone is typing
- Filters out current user from typing list
- Automatically stops after 1 second of inactivity
- Styled with purple theme matching app design

## 🐛 Troubleshooting

### Connection Issues
- Ensure backend server is running on port 5000
- Check CORS settings in backend (`FRONTEND_URL` in `.env`)
- Verify API URL in `.env` file matches backend
- Check browser console for network errors

### Socket.IO Issues
- Verify Socket.IO server is running
- Check that token is being sent correctly in `auth.token`
- Ensure backend Socket.IO CORS allows your frontend URL
- Check browser console for Socket.IO connection errors
- Verify `VITE_SOCKET_URL` matches backend URL

### Authentication Issues
- Clear localStorage if token is invalid
- Check that JWT_SECRET matches between frontend and backend
- Verify token format in Authorization header
- Check network tab for 401 errors

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (v16 or higher required)
- Verify all dependencies are installed
- Check for conflicting dependencies

## 📝 Notes

- **Token Storage**: JWT tokens are stored in `localStorage` for persistence across sessions
- **Socket Reconnection**: Socket.IO automatically reconnects on connection loss
- **API Interceptors**: Axios interceptors automatically add JWT token to requests and handle 401 errors
- **Error Handling**: User-friendly error messages displayed for network and validation errors
- **Loading States**: Loading indicators shown during API calls and message sending
- **Optimistic Updates**: Messages appear immediately before server confirmation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (authentication, messaging, real-time features)
5. Submit a pull request

## 📄 License

ISC

---

**Raabta** - Every connection matters. 💜
git