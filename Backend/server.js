const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/database");
const socketHandler = require("./socket/socketHandler");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// CORS Configuration - Allow multiple frontend deployments
// Supports Vercel preview deployments and production URLs
const allowedOrigins = [
  "https://raabta-chatapp.netlify.app", // Netlify production URL
  "https://raabta-a-realtime-chat-application-fawn.vercel.app",
  "https://raabta-a-realtime-cha-git-7a75ad-abhishek-kumar-nayaks-projects.vercel.app",
  "https://raabta-a-realtime-chat-application-842q-539twyq93.vercel.app",
  ...(process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(",").map((s) => s.trim()).filter(Boolean)
    : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.NODE_ENV !== "production"
    ? [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ]
    : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow server-to-server, curl, Postman
    if (!origin) return callback(null, true);

    // IMPORTANT: must match EXACT origin string for browsers
    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
// Express 5 + path-to-regexp no longer accepts "*" here
// Use a regex to match any path for preflight requests
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.send("Raabta Backend is Live");
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/message", require("./routes/messageRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", app: "Raabta" });
});

// Socket.IO with matching CORS settings
const io = socketIo(server, { cors: corsOptions });
app.set("io", io);
socketHandler(io);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`RAABTA backend listening on port ${PORT}`);
});
