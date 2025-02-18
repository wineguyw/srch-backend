const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");  // ✅ Now correctly references "SignUpData"
require("dotenv").config();

const secretKey = process.env.JWT_SECRET;

router.post("/", async (req, res) => {
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

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔹 Hashed Password:", hashedPassword);

    const newUser = new User({ name, email, dob, password: hashedPassword });
    await newUser.save();
    console.log("✅ User saved to MongoDB:", newUser);

    const token = jwt.sign({ userId: newUser._id }, secretKey, { expiresIn: "3h" });

    res.status(201).json({
      message: "User registered successfully!",
      token,
      userData: { name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("❌ Error saving user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
