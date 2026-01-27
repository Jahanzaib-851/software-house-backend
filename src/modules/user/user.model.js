import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import ROLES from '../../constants/roles.js';
import STATUS from '../../constants/status.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String },
    coverImage: { type: String },
    bio: { type: String },
    phone: { type: String },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CLIENT },
    status: { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ✅ Conditional export to prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
