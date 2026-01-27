
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import ROLES from '../../constants/roles.js';
import STATUS from '../../constants/status.js';

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },

    avatar: {
      type: String,
      default: ''
    }, // Cloudinary URL

    coverImage: {
      type: String,
      default: ''
    }, // Cloudinary URL

    companyName: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CLIENT
    },

    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE
    },

    isVerified: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// --- PASSWORD HASHING (Fixed: Removed 'next' to avoid TypeError) ---
clientSchema.pre('save', async function () {
  // Agar password modify nahi hua toh agay nahi barhna
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // Modern Mongoose mein async function se next() ki zaroorat nahi hoti
  } catch (error) {
    throw new Error(error);
  }
});

// --- COMPARE PASSWORD METHOD ---
clientSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

// --- HIDE SENSITIVE FIELDS IN API RESPONSE ---
clientSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const Client = mongoose.model('Client', clientSchema);
export default Client;