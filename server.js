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

// Load JWT Secret and MongoDB URI
const secretKey = process.env.JWT_SECRET;
const mongoURI = process.env.MONGODB_URI;

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

// ✅ User Model (Define Schema)
const userSchema = new mongoose.Schema(
    {
      name: String,
      email: String,
      dob: Date,
      password: String,
    },
    {
      collection: "SignUpData", // 🔹 Explicitly set the collection name
    }
  );  

  const User = mongoose.model("SignUpData", userSchema, "SignUpData");

// ✅ Import Routes
app.use("/api/signup", require("./routes/signupRoute")); // ← Moved Signup logic here

// 🔹 Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalid or expired" });
    req.user = user;
    next();
  });
}

// 🔹 Login Route (Kept in `server.js`)
app.post("/api/signup", async (req, res) => {
    try {
        const { name, email, dob, password } = req.body;
        console.log("🔹 Received Signup Request:", { name, email, dob, password });
  
        if (!password) {
            return res.status(400).json({ error: "Password is required." });
        }
  
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
  
        // 🔹 Ensure password is hashed before saving
        const hashedPassword = await bcrypt.hash(password, 10);
  
        // Save user data
        const newUser = new User({ name, email, dob, password: hashedPassword });
        await newUser.save();
  
        // Generate JWT token
        const token = jwt.sign({ userId: newUser._id }, secretKey, { expiresIn: "3h" });
  
        res.status(200).json({
            message: "User registered successfully!",
            token,
            userData: { name: newUser.name, email: newUser.email },
        });
    } catch (error) {
        console.error("❌ Error saving user:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
  });
  

// 🔹 Profile Route (Protected)
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
const PORT = process.env.PORT || 5001; // Change this to:
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

