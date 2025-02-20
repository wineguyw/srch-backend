const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "./.env" });

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ✅ Load Secrets
const secretKey = process.env.JWT_SECRET;
const mongoURI = process.env.MONGODB_URI;

// ✅ Check for Environment Variables
if (!secretKey) {
  console.error("❌ JWT_SECRET is not defined. Check your .env file.");
  process.exit(1);
}
if (!mongoURI) {
  console.error("❌ MONGODB_URI is not defined. Check your .env file.");
  process.exit(1);
}

// ✅ MongoDB Connection
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Import Routes
app.use("/api/auth", require("./routes/authRoutes")); // 🔹 Auth routes (signup/login)

// ✅ Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalid or expired" });
    req.user = user;
    next();
  });
}

// ✅ Profile Route (Protected)
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("❌ Error fetching profile:", error.message);
    res.status(500).json({ error: "Failed to fetch profile data." });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
