// Unified authentication service
import { User } from '../models/user.model.js';
import { Professional } from '../models/professional.model.js';
import { Teacher } from '../models/teacher.model.js';
import { Child } from '../models/child.model.js';
import { School } from '../models/school.model.js';
import { ROLES, normalizeRole, denormalizeRole } from '../constants/roles.js';
import { standardResponse, errorResponse, notFoundResponse } from '../middleware/errorHandler.js';

// Unified login service
export const authenticateUser = async (phoneNumber, role = null) => {
  try {
    console.log(`🔍 Authenticating user: ${phoneNumber}, role: ${role || 'Any'}`);

    let user = null;
    let detectedRole = null;
    let profileData = null;

    // If specific role is provided, check only that role
    if (role && role !== 'Any') {
      const normalizedRole = normalizeRole(role);
      return await authenticateByRole(phoneNumber, normalizedRole);
    }

    // Check all roles in order of priority
    const roleChecks = [
      { model: User, roles: [ROLES.ORGANIZATION_ADMIN, ROLES.NGO_ADMIN, ROLES.SCHOOL_ADMIN], field: 'number' },
      { model: Professional, roles: [ROLES.PROFESSIONAL], field: 'Number' },
      { model: Teacher, roles: [ROLES.TEACHER], field: 'phone' },
      { model: Child, roles: [ROLES.PARENT], field: 'parentPhoneNumber' }
    ];

    for (const check of roleChecks) {
      const result = await checkRole(phoneNumber, check);
      if (result) {
        return result;
      }
    }

    // No user found
    return {
      success: false,
      message: `User not found for phone number ${phoneNumber} in any role.`
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: 'Authentication failed',
      error: error.message
    };
  }
};

// Check specific role
const authenticateByRole = async (phoneNumber, normalizedRole) => {
  try {
    let user = null;
    let profileData = null;

    if ([ROLES.ORGANIZATION_ADMIN, ROLES.NGO_ADMIN, ROLES.SCHOOL_ADMIN].includes(normalizedRole)) {
      user = await User.findOne({ number: phoneNumber, role: normalizedRole }).lean();
      if (user) {
        profileData = {
          name: user.name,
          number: user.number,
          organizationId: user.organizationId,
          assignedSchoolList: Array.isArray(user.assignedSchoolList)
            ? user.assignedSchoolList.filter(s => s && typeof s === 'string')
            : (typeof user.assignedSchoolList === 'string'
               ? user.assignedSchoolList.split(',').map(s => s.trim()).filter(Boolean)
               : [])
        };
      }
    } else if (normalizedRole === ROLES.PROFESSIONAL) {
      user = await Professional.findOne({ Number: phoneNumber }).lean();
      if (user) {
        profileData = {
          name: user.name,
          number: user.Number,
          clinicName: user.clinicName,
          organizationId: user.organizationId,
          assignedSchoolIds: user.assignedSchools ? user.assignedSchools.map(id => id.toString()) : []
        };
      }
    } else if (normalizedRole === ROLES.TEACHER) {
      user = await Teacher.findOne({ phone: phoneNumber }).populate('schoolID').lean();
      if (user) {
        profileData = {
          name: user.name,
          number: user.phone,
          schoolID: user.schoolID?._id,
          schoolName: user.schoolID?.schoolName,
          class: user.class,
          organizationId: user.organizationId
        };
      }
    } else if (normalizedRole === ROLES.PARENT) {
      user = await Child.findOne({ parentPhoneNumber: phoneNumber }).populate('schoolID').lean();
      if (user) {
        profileData = {
          name: user.parentName,
          number: user.parentPhoneNumber,
          schoolID: user.schoolID?._id,
          schoolName: user.schoolID?.schoolName,
          organizationId: user.organizationId
        };
      }
    }

    if (!user) {
      return {
        success: false,
        message: `${denormalizeRole(normalizedRole)} not found`
      };
    }

    return {
      success: true,
      detectedRole: denormalizeRole(normalizedRole),
      profileData,
      message: `User found with role: ${denormalizeRole(normalizedRole)}`
    };

  } catch (error) {
    console.error('Role-specific authentication error:', error);
    return {
      success: false,
      message: 'Authentication failed',
      error: error.message
    };
  }
};

// Check role helper
const checkRole = async (phoneNumber, check) => {
  try {
    let user = null;
    let profileData = null;

    if (check.model === User) {
      // Check all admin roles
      for (const role of check.roles) {
        user = await User.findOne({ number: phoneNumber, role: role }).lean();
        if (user) {
          console.log(`✅ Found user in User model with role: ${user.role}`);
          profileData = {
            name: user.name,
            number: user.number,
            organizationId: user.organizationId,
            assignedSchoolList: Array.isArray(user.assignedSchoolList)
              ? user.assignedSchoolList.filter(s => s && typeof s === 'string')
              : (typeof user.assignedSchoolList === 'string'
                 ? user.assignedSchoolList.split(',').map(s => s.trim()).filter(Boolean)
                 : [])
          };
          return {
            success: true,
            detectedRole: denormalizeRole(user.role),
            profileData,
            message: `User found with role: ${denormalizeRole(user.role)}`
          };
        }
      }
    } else if (check.model === Professional) {
      user = await Professional.findOne({ Number: phoneNumber }).lean();
      if (user) {
        console.log("✅ Found user in Professional model");
        profileData = {
          name: user.name,
          number: user.Number,
          clinicName: user.clinicName,
          organizationId: user.organizationId,
          assignedSchoolIds: user.assignedSchools ? user.assignedSchools.map(id => id.toString()) : []
        };
        return {
          success: true,
          detectedRole: ROLES.PROFESSIONAL,
          profileData,
          message: "User found with role: Professional"
        };
      }
    } else if (check.model === Teacher) {
      user = await Teacher.findOne({ phone: phoneNumber }).populate('schoolID').lean();
      if (user) {
        console.log("✅ Found user in Teacher model");
        profileData = {
          name: user.name,
          number: user.phone,
          schoolID: user.schoolID?._id,
          schoolName: user.schoolID?.schoolName,
          class: user.class,
          organizationId: user.organizationId
        };
        return {
          success: true,
          detectedRole: ROLES.TEACHER,
          profileData,
          message: "User found with role: Teacher"
        };
      }
    } else if (check.model === Child) {
      user = await Child.findOne({ parentPhoneNumber: phoneNumber }).populate('schoolID').lean();
      if (user) {
        console.log("✅ Found user in Child model (Parent)");
        profileData = {
          name: user.parentName,
          number: user.parentPhoneNumber,
          schoolID: user.schoolID?._id,
          schoolName: user.schoolID?.schoolName,
          organizationId: user.organizationId
        };
        return {
          success: true,
          detectedRole: ROLES.PARENT,
          profileData,
          message: "User found with role: Parent"
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`Error checking ${check.model.modelName}:`, error);
    return null;
  }
};

// Get organization context for user
export const getOrganizationContext = async (phoneNumber, role) => {
  try {
    const normalizedRole = normalizeRole(role);
    
    if ([ROLES.ORGANIZATION_ADMIN, ROLES.NGO_ADMIN, ROLES.SCHOOL_ADMIN].includes(normalizedRole)) {
      const user = await User.findOne({ number: phoneNumber, role: normalizedRole });
      return user?.organizationId;
    } else if (normalizedRole === ROLES.PROFESSIONAL) {
      const professional = await Professional.findOne({ Number: phoneNumber });
      return professional?.organizationId;
    } else if (normalizedRole === ROLES.TEACHER) {
      const teacher = await Teacher.findOne({ phone: phoneNumber }).populate('schoolID');
      return teacher?.schoolID?.organizationId;
    } else if (normalizedRole === ROLES.PARENT) {
      const child = await Child.findOne({ parentPhoneNumber: phoneNumber }).populate('schoolID');
      return child?.schoolID?.organizationId;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting organization context:', error);
    return null;
  }
};
