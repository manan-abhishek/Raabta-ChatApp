# Raabta - Real-time Chat Application

## 📝 Project Summary

**Raabta** is a full-stack real-time chat application supporting authentication, direct and group messaging, real-time notifications, typing indicators, and user presence using MERN stack and Socket.IO.

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Port 3000)   │
└────────┬────────┘
         │ REST API / WebSocket
         │
┌────────▼────────┐
│ Express Backend │
│   (Port 5000)   │
└────────┬────────┘
         │
┌────────▼────────┐
│     MongoDB     │
└─────────────────┘
```

## 📁 Project Structure

```
Chat Application/
├── Backend/              # Node.js + Express + Socket.IO
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── socket/          # Socket.IO handlers
│   └── server.js        # Entry point
│
└── Frontend/            # React + Vite
    ├── src/
    │   ├── components/  # React components
    │   ├── contexts/    # Context API
    │   ├── pages/       # Page components
    │   └── utils/       # API & Socket utilities
    └── vite.config.js   # Vite configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+ for Backend, v16+ for Frontend)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Chat Application"
```

### 2. Set Up Backend

```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT_SECRET
npm run dev
```

### 3. Set Up Frontend

```bash
cd Frontend  # Note: 
npm install
cp .env.example .env
# Edit .env with your backend URLs (if different from defaults)
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## 📚 Documentation

- [Backend README](./Backend/README.md) - Backend API documentation
- [Frontend README](./Frontend/README.md) - Frontend documentation

## 🔧 Environment Variables

### Backend (.env)
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## ✨ Features

- ✅ User Authentication (JWT)
- ✅ Real-time Messaging (Socket.IO)
- ✅ Direct & Group Chats
- ✅ Typing Indicators
- ✅ Online/Offline Status
- ✅ Message Notifications
- ✅ User Search
- ✅ Message History
- ✅ Read Receipts
- ✅ Modern UI/UX

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.IO
- JWT (jsonwebtoken)
- bcryptjs

### Frontend
- React.js
- Vite
- Socket.IO Client
- Axios
- React Router
- date-fns

## 📝 Important Notes

1. **Environment Variables**: Always use `.env` files and never commit them to version control.
2. **MongoDB**: Ensure MongoDB is running before starting the backend server.
3. **CORS**: Configure `FRONTEND_URL` in backend `.env` to match your frontend URL.

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Set `NODE_ENV=production`
3. Use `npm start` (not `npm run dev`)
4. Ensure MongoDB Atlas connection string is set
5. Configure CORS with production frontend URL

### Frontend Deployment
1. Update `.env` with production backend URLs
2. Build: `npm run build`
3. Deploy `dist/` folder to hosting service (Vercel, Netlify, etc.)
4. Configure environment variables on hosting platform

## 📄 License

ISC

---

**Raabta** - Every connection matters. 💜
