
 import mongoose from 'mongoose';

const SchoolSchema = new mongoose.Schema({
    schoolName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    udiseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    contactNumber: {
      type: Number,
      required: true 
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      validate: {
        validator: function(v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid organization ID'
      }
    },
    teachers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: []
    }],
    assignedProfessionals: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional',
      default: []
    }],
    assignedAdmins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: []
    }]
  }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  export const School = mongoose.model('School', SchoolSchema);