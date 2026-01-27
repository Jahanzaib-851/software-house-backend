import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import tokenUtils from "../../utils/token.js";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee', 'client'],
    default: 'employee'
  },
  status: {
    type: String,
    default: 'pending'
  },
  tokens: [String],
  otp: String,
  otpExpires: Date,
  passwordResetOTP: String,
  passwordResetExpires: Date
}, { timestamps: true });

/* 🔐 HASH PASSWORD BEFORE SAVING (Fixed next error) */
userSchema.pre("save", async function () {
  // Async hooks mein 'next' ki zaroorat nahi hoti
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error; // Mongoose async error handle kar lega
  }
});

/* 🔑 COMPARE PASSWORD */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/* 🎟️ GENERATE ACCESS & REFRESH TOKENS */
userSchema.methods.generateAuthTokens = async function () {
  const tokens = await tokenUtils.generateTokensForUser(this);

  if (tokens.refreshToken) {
    // Check karein ke tokens array mojood hai
    if (!this.tokens) this.tokens = [];
    this.tokens.push(tokens.refreshToken);

    // Yahan .save() call karne se dubara 'pre-save' hook chalta hai
    // Par password isModified false hoga, isliye loop nahi banega
    await this.save({ validateBeforeSave: false });
  }

  return tokens;
};

const User = mongoose.model("User", userSchema);
export default User;