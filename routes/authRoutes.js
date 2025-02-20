const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User"); // ✅ Correct reference to User model
require("dotenv").config();

const secretKey = process.env.JWT_SECRET;

// ✅ Signup Route
router.post("/signup", async (req, res) => {
    try {
        const { name, email, dob, password } = req.body;

        if (!password) return res.status(400).json({ error: "Password is required." });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, dob, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, secretKey, { expiresIn: "3h" });

        res.status(201).json({
            message: "User registered successfully!",
            token,
            userData: { name: newUser.name, email: newUser.email },
        });
    } catch (error) {
        console.error("❌ Signup Error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });

        const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: "3h" });

        res.status(200).json({
            message: "Login successful!",
            token,
            userData: { name: user.name, email: user.email },
        });
    } catch (error) {
        console.error("❌ Login Error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Export Routes
module.exports = router;
