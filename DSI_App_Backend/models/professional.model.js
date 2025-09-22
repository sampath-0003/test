import mongoose from 'mongoose';

const ProfessionalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    Number: {
        type: String,
        required: true
    },
    Address: {
        type: String,
        required: true
    },
    workEmail: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Require valid format
          },
          message: props => `${props.value} is not a valid email address!`
        }
      },
    clinicName: { type: String, required: true },
    ProfessionalID: {
        type: String,
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
    assignedSchools: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    }]
}, { timestamps: true });

export const Professional = mongoose.model('Professional', ProfessionalSchema);
