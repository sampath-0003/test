export const ROLE_FIELDS = {
    Professional: {
      required: ['name'],
      optional: ['Number', 'workEmail', 'Address', 'clinicName'],
      immutable: ['ProfessionalID'],
      validation: {
        workEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        Number: (value) => /^\d{10}$/.test(value)
      }
    },
    Teacher: {
      required: ['name'],
      optional: ['class'],
      immutable: ['phone', 'school_name'],
      validation: {
        class: (value) => !isNaN(value) && parseInt(value) > 0
      }
    },
    Parent: {
      required: ['name'],
      optional: [],
      immutable: ['parentPhoneNumber'],
      validation: {}
    },
    SchoolAdmin: {
      required: ['name'],
      optional: ['number'],
      immutable: ['role', 'assignedSchoolList'],
      validation: {
        number: (value) => /^\d{10}$/.test(value)
      }
    },
    NGOAdmin: {
      required: ['name'],
      optional: ['number'],
      immutable: ['role', 'assignedSchoolList'],
      validation: {
        number: (value) => /^\d{10}$/.test(value)
      }
    }
  };