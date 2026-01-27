import mongoose from 'mongoose';
import STATUS from '../../constants/status.js';
import TRANSACTION_TYPE from '../../constants/transactionType.js';

const financeSchema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      required: [true, 'Transaction type is required (income/expense)'],
      enum: TRANSACTION_TYPE ? Object.values(TRANSACTION_TYPE) : ['income', 'expense'],
      index: true // Fast filtering for summary
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'] // Validation: Paisa negative nahi ho sakta
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true, // Faltu spaces khatam
      maxlength: [500, 'Description cannot exceed 500 characters']
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true // Reports nikalne ke liye zaroori hai
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      index: true
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      index: true
    },

    transactionDate: {
      type: Date,
      default: Date.now,
      index: true // Date-wise filtering fast karne ke liye
    },

    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    // Virtuals enable karein agar future mein koi extra field calculate karni ho
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * INDEXES: Search performance barhane ke liye
 */
// Composite index: Jab hum date range aur status dono se filter karein
financeSchema.index({ status: 1, transactionDate: -1 });

// Hide internal fields (__v) automatically
financeSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Finance = mongoose.model('Finance', financeSchema);
export default Finance;