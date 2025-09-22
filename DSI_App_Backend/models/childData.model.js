import mongoose from 'mongoose';

const ChildDataSchema = new mongoose.Schema({
  child_name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  answers: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  submittedBy: {
    phone: {
      type: String,
      required: true
    }
  }
}, { timestamps: true });

export const ChildData = mongoose.model('ChildData', ChildDataSchema);