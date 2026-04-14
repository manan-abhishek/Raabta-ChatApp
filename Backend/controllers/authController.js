const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Cookie options (IMPORTANT for Netlify ↔ Render)
const cookieOptions = {
  httpOnly: true,
  secure: true,      // REQUIRED (HTTPS)
  sameSite: "none",  // REQUIRED (cross-site)
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// ================================
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ================================
const register = async (req, res) => {
  try {
    const { username, email, password, publicKey } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        message:
          userExists.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      publicKey,
    });

    const token = generateToken(user._id);

    // ✅ SET COOKIE
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      publicKey: user.publicKey,
      token, // Return token for frontend localStorage
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    // ✅ SET COOKIE
    res.cookie("token", token, cookieOptions);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      token, // Return token for frontend localStorage
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ================================
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
// ================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================================
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
// ================================
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();
    }

    // ✅ CLEAR COOKIE
    res.cookie("token", "none", {
      ...cookieOptions,
      maxAge: 0,
    });

    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// @desc    Update user profile (e.g., public key)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { publicKey, avatar, username, email, about } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (publicKey) user.publicKey = publicKey;
    if (avatar) user.avatar = avatar;
    if (username) user.username = username;
    if (email) user.email = email;
    if (about !== undefined) user.about = about;

    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      about: user.about,
      publicKey: user.publicKey,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// @desc    Get user's public key
// @route   GET /api/auth/publicKey/:userId
// @access  Private
const getPublicKey = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("publicKey");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ publicKey: user.publicKey });
  } catch (error) {
    console.error("Get public key error:", error);
    res.status(500).json({ message: "Server error getting public key" });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  getPublicKey,
};
