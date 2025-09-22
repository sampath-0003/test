import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  clinicsName: String,
  childsName: String,
  age: Number,
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  optionalNotes: String,
  
  flagforlabel: {
    type: Boolean,
    default: false,
  },
  labelling: String,
  images: {
    house: { 
      path: String,
      score: { type: Number, default: 0 },
      manualScore: Number,
      labeledBy: String,
      labeledAt: Date
    },
    tree: {
      path: String,
      score: { type: Number, default: 0 },
      manualScore: Number,
      labeledBy: String,
      labeledAt: Date
    },
    person: {
      path: String,
      score: { type: Number, default: 0 },
      manualScore: Number,
      labeledBy: String,
      labeledAt: Date
    }
  },
  houseAns: Object,
  personAns: Object,
  treeAns: Object,
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: false, // Only set for parent/teacher reports
  },
  submittedBy: {
    role: { type: String, required: true },
    phone: { type: String, required: true },
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  clinicName: { type: String },
}, { timestamps: true });

export const Report = mongoose.model('Report', ReportSchema);