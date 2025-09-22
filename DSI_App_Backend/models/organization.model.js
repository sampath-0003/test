import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Optional: Support for organization hierarchy in the future
    parentOrganizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null
    },
    level: {
        type: String,
        enum: ['district', 'school', 'ngo'],
        default: 'school'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for schools count
OrganizationSchema.virtual('schoolsCount', {
    ref: 'School',
    localField: '_id',
    foreignField: 'organizationId',
    count: true
});

// Index for better query performance
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ createdBy: 1 });
OrganizationSchema.index({ isActive: 1 });

export const Organization = mongoose.model('Organization', OrganizationSchema);
