const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/database");
const socketHandler = require("./socket/socketHandler");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ TRUST PROXY (Required for Rate Limiting behind Render/Netlify proxy)
app.set("trust proxy", 1);

/* ================================
   ✅ SECURITY MIDDLEWARE
   ================================ */

app.use(helmet()); // Sets various HTTP headers for security

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: "Too many requests from this IP, please try again later",
  validate: { xForwardedForHeader: false },
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased for development
  message: "Too many login/register attempts, please try again in an hour",
  validate: { xForwardedForHeader: false },
});

// Stricter limiter for message sending (prevent spam)
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Increased for development
  message: "Slow down! You are sending messages too fast.",
  validate: { xForwardedForHeader: false },
});

/* ================================
   ✅ CORS CONFIGURATION (FIXED)
   ================================ */

// 🔴 ADD ALL VALID FRONTEND ORIGINS HERE
const allowedOrigins = [
  // ✅ Netlify (PRODUCTION)
  "https://raabtaarealtimechatapplication.netlify.app",
  "https://raabta-chatapp.netlify.app",

  // ✅ Vercel (old / preview deployments – optional)
  "https://raabta-a-realtime-chat-application-fawn.vercel.app",
  "https://raabta-a-realtime-cha-git-7a75ad-abhishek-kumar-nayaks-projects.vercel.app",
  "https://raabta-a-realtime-chat-application-842q-539twyq93.vercel.app",

  // ✅ Environment-based (optional)
  ...(process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(",").map(s => s.trim()).filter(Boolean)
    : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),

  // ✅ Local development
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
    // Allow Postman / server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("❌ Blocked by CORS:", origin);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

/* ================================
   ✅ MIDDLEWARE
   ================================ */

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // Handle preflight
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================================
   ✅ ROOT & HEALTH ROUTES
   ================================ */

app.get("/", (req, res) => {
  res.send("Raabta Backend is Live 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", app: "Raabta" });
});

/* ================================
   ✅ API ROUTES
   ================================ */

app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/chat", limiter, require("./routes/chatRoutes"));
app.use("/api/message", messageLimiter, require("./routes/messageRoutes"));
app.use("/api/users", limiter, require("./routes/userRoutes"));

/* ================================
   ✅ SOCKET.IO CONFIG
   ================================ */

const io = socketIo(server, {
  cors: corsOptions,
});

/* ================================
   ✅ REDIS ADAPTER (FOR SCALING)
   ================================ */

if (process.env.REDIS_URL) {
  const { createClient } = require("redis");
  const { createAdapter } = require("@socket.io/redis-adapter");

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log("✅ Redis adapter connected for Socket.IO");
    })
    .catch((err) => {
      console.error("❌ Redis connection failed:", err);
    });
}

app.set("io", io);
socketHandler(io);

/* ================================
   ✅ GLOBAL ERROR HANDLER
   ================================ */

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/* ================================
   ✅ 404 HANDLER
   ================================ */

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ================================
   ✅ SERVER START
   ================================ */

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ RAABTA backend running on port ${PORT}`);
});
