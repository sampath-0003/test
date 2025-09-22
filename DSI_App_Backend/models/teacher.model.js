

import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    class: {
        type: Number,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    schoolID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
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
    }
}, { timestamps: true });


export const Teacher = mongoose.model('Teacher', TeacherSchema);


