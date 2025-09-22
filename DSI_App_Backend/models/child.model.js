
import mongoose from 'mongoose';


const ChildSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    rollNumber : {
        type: String,
        required: false
    },
    schoolID: {
        type: mongoose.Schema.Types.ObjectId, // 👈 Now it's an ObjectId reference
        ref: 'School',                         // 👈 Reference to School model
        required: false
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
    parentName: {
        type: String,
        required: false
    },
    parentPhoneNumber: {
      type: String,
      required: false
    },
    class : {
        type: Number,
        required: false
    },
    age : {
        type: Number,
        required: true 
    },

}, { timestamps: true });

export const Child = mongoose.model('Child', ChildSchema);