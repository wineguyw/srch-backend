const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    dob: Date,
    password: String,
  },
  {
    collection: "SignUpData", // ✅ Explicitly use "SignUpData" collection
  }
);

// ✅ Prevent OverwriteModelError by checking if model already exists
const User = mongoose.models.SignUpData || mongoose.model("SignUpData", userSchema);

module.exports = User;
