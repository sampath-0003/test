import mongoose from 'mongoose'; // 👈 Add this line

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ['OrganizationAdmin', 'NGOAdmin', 'NGO Master','SchoolAdmin'],
    required: true,
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
  assignedSchoolList: {
    type: [String],
    default: [],
    validate: {
      validator: function (arr) { 
        return this.role === 'SchoolAdmin' ? arr.length <= 1 : true;
      },
      message: 'School Admin can only be assigned one school.'
    }
  }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);