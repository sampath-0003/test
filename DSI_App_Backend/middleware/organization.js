import { User } from '../models/user.model.js';
import { Professional } from '../models/professional.model.js';
import { normalizeRole } from '../constants/roles.js';

// Middleware to enforce organization context and data isolation
export const requireOrganizationContext = async (req, res, next) => {
  try {
    let userOrgId = null;

    if (req.user && req.user.organizationId) {
      // Already authenticated → use existing user
      userOrgId = req.user.organizationId;
    } else {
      // Fallback → extract from request (for cases without JWT)
      const phone = req.body.phone || req.query.phone || req.body.phoneNumber || req.query.phoneNumber;
      const role = req.body.role || req.query.role || req.body.usertype || req.query.usertype;

      if (!phone || !role) {
        return res.status(400).json({ success: false, message: "Phone and role are required" });
      }

      const normalizedRole = normalizeRole(role);

      if (['OrganizationAdmin','NGOAdmin','SchoolAdmin'].includes(normalizedRole)) {
        const user = await User.findOne({ number: phone, role: normalizedRole });
        userOrgId = user?.organizationId;
      } else if (normalizedRole === 'Professional') {
        const professional = await Professional.findOne({ Number: phone });
        userOrgId = professional?.organizationId;
      } else if (normalizedRole === 'Teacher') {
        const { Teacher } = await import('../models/teacher.model.js');
        const teacher = await Teacher.findOne({ phone }).populate('schoolID');
        userOrgId = teacher?.schoolID?.organizationId;
      } else if (normalizedRole === 'Parent') {
        const { Child } = await import('../models/child.model.js');
        const { School } = await import('../models/school.model.js');
        const child = await Child.findOne({ parentPhoneNumber: phone });
        const school = child ? await School.findById(child.schoolID) : null;
        userOrgId = school?.organizationId;
      }
    }

    if (!userOrgId) {
      return res.status(403).json({ success: false, message: "No organization context found" });
    }

    req.organizationId = userOrgId;
    next();
  } catch (error) {
    console.error("Organization context middleware error:", error);
    res.status(500).json({ success: false, message: "Server error in organization context", error: error.message });
  }
};

// Middleware to ensure user can only access their organization's data
export const enforceOrganizationBoundary = (req, res, next) => {
  const userOrgId = req.organizationId;
  const targetOrgId = req.params.organizationId || req.query.organizationId || req.body.organizationId;

  // If no target organization specified, use user's organization
  if (!targetOrgId) {
    req.targetOrganizationId = userOrgId;
    return next();
  }

  // Check if user is trying to access data outside their organization
  if (targetOrgId !== userOrgId.toString()) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Cannot access data outside your organization' 
    });
  }

  req.targetOrganizationId = targetOrgId;
  next();
};

// Helper function to get organization context for any user
export const getOrganizationContext = async (phone, role) => {
  try {
    const normalizedRole = normalizeRole(role);
    
    if (normalizedRole === 'OrganizationAdmin' || normalizedRole === 'NGOAdmin' || normalizedRole === 'SchoolAdmin') {
      const user = await User.findOne({ number: phone, role: normalizedRole });
      return user?.organizationId;
    } else if (normalizedRole === 'Professional') {
      const professional = await Professional.findOne({ Number: phone });
      return professional?.organizationId;
    }
    // For teachers and parents, organization comes from school
    return null;
  } catch (error) {
    console.error('Error getting organization context:', error);
    return null;
  }
};
