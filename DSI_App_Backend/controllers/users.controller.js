import {Professional} from '../models/professional.model.js';
import {School} from '../models/school.model.js';
import {Organization} from '../models/organization.model.js';
import { HOUSE_QUESTIONS, PERSON_QUESTIONS, TREE_QUESTIONS } from '../models/questions.js';
import {Report} from '../models/report.model.js';
import {Teacher} from '../models/teacher.model.js';
import {Child} from '../models/child.model.js';

import {User} from '../models/user.model.js';
import { ROLES, FRONTEND_ROLES, normalizeRole, denormalizeRole } from '../constants/roles.js';
import { standardResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../middleware/errorHandler.js';
import { authenticateUser, getOrganizationContext } from '../services/authService.js';

const responder = (req, res) => {
    res.status(200).json({ message: "Hello World" });
};

const createProfessionalAccount = async (req, res) => {
  try {
    const {
      name,
      Number: phoneNumber,
      Address,
      ProfessionalID,
      workEmail,
      clinicName
    } = req.body;

    // Get organizationId from auth context
    const organizationId = req.organizationId;

    const professional = new Professional({
      name,
      Number: phoneNumber,
      Address,
      ProfessionalID,
      workEmail,
      clinicName,
      organizationId
    });

    await professional.save();

    return res.status(201).json({
      success: true,
      message: "Professional account created successfully",
      data: professional
    });

  } catch (error) {
    console.error('Create professional error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating professional account"
    });
  }
};


// Get all assigned schools for a professional
const getAssignedSchoolsForProfessional = async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: "Phone number is required" });
  }

  try {
    const professional = await Professional.findOne({ Number: phoneNumber });

    if (!professional) {
      return res.status(404).json({ success: false, error: "Professional not found" });
    }

    // ✅ Query schools where professional._id is in School.assignedProfessionals
    const assignedSchools = await School.find(
      { assignedProfessionals: professional._id },
      { schoolName: 1 }
    );

    if (!assignedSchools || assignedSchools.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No schools assigned to this professional",
      });
    }

    res.status(200).json({
      success: true,
      data: assignedSchools.map(s => s.schoolName),
      message: "Assigned schools fetched successfully",
    });

  } catch (error) {
    console.error(`Error fetching assigned schools: ${error.message}`);
    res.status(500).json({ success: false, error: "Server error" });
  }
};


// Assign a school to a professional (and vice versa)
const assignSchoolToProfessional = async (req, res) => {
  const { professionalId, schoolName } = req.body;

  // Validate inputs
  if (!professionalId || !schoolName) {
    return res.status(400).json({
      success: false,
      error: "Both 'professionalId' and 'schoolName' are required.",
    });
  }

  try {
    // 1. Find professional by ProfessionalID (string like "96")
    const professional = await Professional.findOne({ ProfessionalID: professionalId });
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: "Professional not found",
      });
    }

    // 2. Find school by schoolName
const school = await School.findOne({ schoolName: schoolName });
if (!school) {
  return res.status(404).json({
    success: false,
    error: "School not found",
  });
}

// 3. Prevent duplicate assignments
const alreadyInProfessional = professional.assignedSchools.includes(school._id); // ✅ Compare with ObjectId
const alreadyInSchool = school.assignedProfessionals.some(
  (id) => id.toString() === professional._id.toString()
);

    if (alreadyInProfessional && alreadyInSchool) {
      return res.status(200).json({
        success: true,
        message: "School is already assigned to this professional.",
      });
    }

    // 4. Update both collections
    if (!alreadyInProfessional) {
      await Professional.updateOne(
        { ProfessionalID: professionalId },
        { $addToSet: { assignedSchools: school._id } }
      );
    }

    if (!alreadyInSchool) {
      await School.updateOne(
        { schoolName: schoolName },
        { $addToSet: { assignedProfessionals: professional._id } }
      );
    }

    // ✅ Success response
    res.status(200).json({
      success: true,
      message: "School assigned to professional successfully",
    });

  } catch (error) {
    console.error(`Error assigning school: ${error.message}`, {
      stack: error.stack,
      body: req.body,
    });

    // 🛑 Server error
    res.status(500).json({
      success: false,
      error: "Failed to assign school to professional",
    });
  }
};
const getProfessionalIds = async (req, res) => {
  try {
    // 🔁 Find all professionals and populate their assigned schools
    const professionals = await Professional.find({})
      .populate('assignedSchools', 'schoolName'); // 👈 Populates schoolName field

    const formattedProfessionals = professionals.map(p => {
      const schoolNames = Array.isArray(p.assignedSchools)
        ? p.assignedSchools.map(s => s.schoolName || 'Unknown School')
        : [];

      return {
        name: p.name,
        Number: p.Number || 'N/A',
        ProfessionalID: p.ProfessionalID || 'N/A',
        assignedSchools: schoolNames,
        clinicName: p.clinicName || 'N/A'
      };
    });

    res.status(200).json(formattedProfessionals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error Fetching Professional IDs" });
  }
};


const createSchoolAccount = async (req, res) => {
  const data = req.body;

  try {
    const { schoolName, udiseNumber, address, contactNumber, assignedProfessionalId, organizationId } = data;

    // Validation: Make schoolName, udiseNumber, address, contactNumber, and organizationId required
    if (!schoolName || !udiseNumber || !address || !contactNumber || !organizationId) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: schoolName, udiseNumber, address, contactNumber, and organizationId are required" 
      });
    }

    // 1. Validate organization exists and is active
    const organization = await Organization.findOne({ 
      _id: organizationId, 
      isActive: true 
    });
    if (!organization) {
      return res.status(404).json({ 
        success: false,
        message: "Organization not found or inactive" 
      });
    }

    // 2. Check for existing UDISE number
    const existingSchool = await School.findOne({ udiseNumber: udiseNumber });
    if (existingSchool) {
      return res.status(400).json({ 
        success: false,
        message: "UDISE number already exists" 
      });
    }

    // 3. Create the school
    const school = new School({
      schoolName: schoolName.trim(),
      udiseNumber: udiseNumber.trim(),
      address: address.trim(),
      contactNumber,
      organizationId,
      assignedProfessionals: [],
    });

    // 4. If professional ID provided, validate and add
    let professional = null;
    if (assignedProfessionalId) {
      // First find by ProfessionalID
      professional = await Professional.findOne({ 
        ProfessionalID: assignedProfessionalId 
      });

      if (!professional) {
        return res.status(404).json({ 
          success: false,
          message: "Professional not found" 
        });
      }

      // Add to array (supports multiple professionals in future)
      school.assignedProfessionals.push(professional._id);
    }

    await school.save();

    // 5. Update professional's assigned schools (optional)
    if (assignedProfessionalId && professional) {
      if (!professional.assignedSchools.includes(school._id)) {
        professional.assignedSchools.push(school._id);
        await professional.save();
      }
    }

    // 6. Populate organization data for response
    await school.populate('organizationId', 'name address contactNumber');

    res.status(201).json({
      success: true,
      message: "School Account Created Successfully",
      data: school
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ 
      success: false,
      message: "Error Creating School Account",
      error: error.message 
    });
  }
};

const getSchoolAdmins = async (req, res) => {
    try {
      const data = await schoolAdmin.find({});
      console.log(data);
      res.status(200).json(data);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Error Fetching School Admins' });
    }
  };




const createAdmin = async (req, res) => {
  const { name, number, role, assignedSchoolList = [], organizationId } = req.body;
  try {
    // ✅ Use only req.organizationId (ignore body)
    const targetOrgId = req.organizationId;
    if (!targetOrgId) {
      return res.status(500).json({ message: 'Organization context missing' });
    }
    // Check if number exists
    const existingUser = await User.findOne({ number });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    // Proceed with creation
    const newUser = new User({ name, number, role, organizationId: targetOrgId, assignedSchoolList });
    await newUser.save(); // 👈 Only one save()
    // ✅ Generate and return token
    const token = generateAuthToken(newUser);
    res.status(201).json({
      message: 'Admin created successfully',
      user: newUser,
      token: token // 👈 Return token to Flutter
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Error creating admin' });
  }
};



const assignAdminToSchool = async (req, res) => {
  const { adminNumber, schoolName } = req.body;

  if (!adminNumber || !schoolName) {
    return res.status(400).json({
      success: false,
      error: "Both 'adminNumber' and 'schoolName' are required.",
    });
  }

  try {
    const admin = await User.findOne({ number: adminNumber });
    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin not found" });
    }

    const school = await School.findOne({ schoolName: schoolName });
    if (!school) {
      return res.status(404).json({ success: false, error: "School not found" });
    }

    // Prevent duplicate assignments
    const alreadyInAdmin = admin.assignedSchoolList.includes(schoolName);
    const alreadyInSchool = school.assignedAdmins?.some(
      (id) => id.toString() === admin._id.toString()
    );

    if (alreadyInAdmin && alreadyInSchool) {
      return res.status(200).json({
        success: true,
        message: "School is already assigned to this admin.",
      });
    }

    // Update both collections
    if (!alreadyInAdmin) {
      await User.updateOne(
        { number: adminNumber },
        { $addToSet: { assignedSchoolList: schoolName } }
      );
    }

    if (!alreadyInSchool) {
      await School.updateOne(
        { schoolName: schoolName },
        { $addToSet: { assignedAdmins: admin._id } }
      );
    }

    res.status(200).json({
      success: true,
      message: "School assigned to admin successfully",
    });

  } catch (error) {
    console.error(`Error assigning school: ${error.message}`);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const getAdmins = async (req, res) => {
  try {
    const { phone, organizationId } = req.query;

    let admins;
    if (phone) {
      // Fetch single admin by phone number
      admins = await User.findOne({ number: phone });
    } else {
      // Fetch all admins
      const filter = organizationId ? { organizationId } : {};
      admins = await User.find(filter);
    }

    // ✅ Handle no results (single or multiple)
    if (!admins || (Array.isArray(admins) && admins.length === 0)) {
      return res.status(404).json({ message: "No admins found" });
    }

    // ✅ Normalize assignedSchoolList (ensure array format)
    const normalizeSchoolList = (list) => {
      if (Array.isArray(list)) return list;
      if (typeof list === 'string') {
        return list
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      return [];
    };

    // ✅ Sanitize and format response
    const formatAdmin = (admin) => {
      const obj = admin.toObject();
      return {
        _id: obj._id,
        name: obj.name,
        number: obj.number,
        role: obj.role,
        organizationId: obj.organizationId,
        assignedSchoolList: normalizeSchoolList(obj.assignedSchoolList)
      };
    };

    // ✅ Return appropriate response
    if (phone) {
      return res.status(200).json(formatAdmin(admins));
    } else {
      return res.status(200).json(admins.map(formatAdmin));
    }

  } catch (error) {
    console.error(`Error fetching admins: ${error.message}`, {
      stack: error.stack
    });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({});
    res.status(200).json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching admins' });
  }
};

// ========== DELETE ENDPOINTS ==========
// Delete NGO/School Admin user by id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent deletion if user still assigned to schools
    const assigned = Array.isArray(user.assignedSchoolList) ? user.assignedSchoolList : [];
    if (assigned.length > 0) {
      return res.status(400).json({ success: false, message: 'Unassign all schools from this user before deleting' });
    }

    await User.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete professional by id or identifier
const deleteProfessional = async (req, res) => {
  try {
    const { id } = req.params; // mongoose _id
    const { professionalId, phone } = req.query; // ProfessionalID or Number

    let professional = null;
    if (id) professional = await Professional.findById(id);
    if (!professional && professionalId) professional = await Professional.findOne({ ProfessionalID: professionalId });
    if (!professional && phone) professional = await Professional.findOne({ Number: phone });
    if (!professional) return res.status(404).json({ success: false, message: 'Professional not found' });

    // Prevent deletion if assigned to schools
    if (professional.assignedSchools && professional.assignedSchools.length > 0) {
      return res.status(400).json({ success: false, message: 'Unassign professional from all schools before deleting' });
    }

    await Professional.findByIdAndDelete(professional._id);
    return res.status(200).json({ success: true, message: 'Professional deleted' });
  } catch (error) {
    console.error('Error deleting professional:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete school by id (only if no teachers/children assigned)
const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findById(id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    // Check references
    const teacherCount = await Teacher.countDocuments({ _id: { $in: school.teachers } });
    const childCount = await Child.countDocuments({ schoolID: school._id });
    if (teacherCount > 0 || childCount > 0) {
      return res.status(400).json({ success: false, message: 'Remove all teachers and students before deleting the school' });
    }

    // Ensure no admins/professionals still linked
    if ((school.assignedAdmins?.length || 0) > 0 || (school.assignedProfessionals?.length || 0) > 0) {
      return res.status(400).json({ success: false, message: 'Unassign all admins and professionals before deleting the school' });
    }

    await School.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'School deleted' });
  } catch (error) {
    console.error('Error deleting school:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete teacher by id or phone
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.query;
    let teacher = null;
    if (id) teacher = await Teacher.findById(id);
    if (!teacher && phone) teacher = await Teacher.findOne({ phone });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // Remove from school's teachers[] if exists
    const school = await School.findOne({ teachers: teacher._id });
    if (school) {
      await School.updateOne({ _id: school._id }, { $pull: { teachers: teacher._id } });
    }

    await Teacher.findByIdAndDelete(teacher._id);
    return res.status(200).json({ success: true, message: 'Teacher deleted' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete child by id
const deleteChild = async (req, res) => {
  try {
    const { id } = req.params;
    const child = await Child.findById(id);
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    await Child.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Child deleted' });
  } catch (error) {
    console.error('Error deleting child:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ========== UNASSIGN ENDPOINTS ==========
// Unassign NGO/School admin from a school
const unassignAdminFromSchool = async (req, res) => {
  try {
    const { adminNumber, schoolName } = req.body;
    if (!adminNumber || !schoolName) {
      return res.status(400).json({ success: false, message: "'adminNumber' and 'schoolName' are required" });
    }

    const admin = await User.findOne({ number: adminNumber });
    const school = await School.findOne({ schoolName });
    if (!admin || !school) return res.status(404).json({ success: false, message: 'Admin or school not found' });

    await User.updateOne({ _id: admin._id }, { $pull: { assignedSchoolList: schoolName } });
    await School.updateOne({ _id: school._id }, { $pull: { assignedAdmins: admin._id } });

    return res.status(200).json({ success: true, message: 'Admin unassigned from school' });
  } catch (error) {
    console.error('Error unassigning admin from school:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Unassign professional from a school
const unassignProfessionalFromSchool = async (req, res) => {
  try {
    const { professionalId, schoolName } = req.body; // professionalId is ProfessionalID string
    if (!professionalId || !schoolName) {
      return res.status(400).json({ success: false, message: "'professionalId' and 'schoolName' are required" });
    }

    const professional = await Professional.findOne({ ProfessionalID: professionalId });
    const school = await School.findOne({ schoolName });
    if (!professional || !school) return res.status(404).json({ success: false, message: 'Professional or school not found' });

    await Professional.updateOne({ _id: professional._id }, { $pull: { assignedSchools: school._id } });
    await School.updateOne({ _id: school._id }, { $pull: { assignedProfessionals: professional._id } });

    return res.status(200).json({ success: true, message: 'Professional unassigned from school' });
  } catch (error) {
    console.error('Error unassigning professional from school:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ========== SCHOOL ADMIN LISTING ==========
// Get students grouped by class for a given school (by id or name)
const getStudentsBySchoolGrouped = async (req, res) => {
  try {
    const { schoolId, schoolName } = req.query;
    let school = null;
    if (schoolId) school = await School.findById(schoolId);
    if (!school && schoolName) school = await School.findOne({ schoolName });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    const children = await Child.find({ schoolID: school._id });
    const grouped = {};
    for (const c of children) {
      const cls = (c.class ?? 'Unassigned').toString();
      if (!grouped[cls]) grouped[cls] = [];
      grouped[cls].push({
        _id: c._id,
        name: c.name,
        age: c.age,
        rollNumber: c.rollNumber,
        parentName: c.parentName,
        parentPhoneNumber: c.parentPhoneNumber,
        class: c.class,
      });
    }
    return res.status(200).json({ success: true, data: grouped });
  } catch (error) {
    console.error('Error getting students by school:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get teachers for a given school (by id or name)
const getTeachersBySchool = async (req, res) => {
  try {
    const { schoolId, schoolName } = req.query;
    let school = null;
    if (schoolId) school = await School.findById(schoolId);
    if (!school && schoolName) school = await School.findOne({ schoolName: schoolName });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    // Teacher model now uses schoolID as ObjectId reference
    const teachers = await Teacher.find({ schoolID: school._id });
    return res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    console.error('Error getting teachers by school:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getSchools = async (req, res) => {
    try {
        const { organizationId } = req.query;
        
        let query = {};
        
        // Filter by organization if provided
        if (organizationId) {
            query.organizationId = organizationId;
        }
        
        const data = await School.find(query)
            .populate('organizationId', 'name address contactNumber')
            .populate('assignedProfessionals', 'name ProfessionalID')
            .populate('assignedAdmins', 'name number role')
            .sort({ createdAt: -1 });
            
        res.status(200).json({
            success: true,
            data: data,
            count: data.length
        });
    }
    catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).json({ 
            success: false,
            message: "Error Fetching Schools",
            error: error.message 
        });
    }
}


const uploadteacherdetails = async (req, res) => {
  try {
    const { name, class: classNum, phone, school } = req.body;
    
    // 1. Validate inputs
    if (!name || !classNum || !phone || !school) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // 2. Find admin by name (not using JWT token, relying on frontend validation)
    const { adminNumber } = req.body;

const admin = await User.findOne({ number: adminNumber });
if (!admin) {
  return res.status(404).json({ 
    success: false,
    message: "Admin not found" 
  });
}

    // 3. ✅ Handle both formats: string or array
    const assignedSchoolList = typeof admin.assignedSchoolList === 'string'
      ? admin.assignedSchoolList.split(',').map(s => s.trim())
      : Array.isArray(admin.assignedSchoolList) 
        ? admin.assignedSchoolList 
        : [];

    // 4. Validate school assignment
    const isAssigned = assignedSchoolList.includes(school);
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this school"
      });
    }

    // 5. Create teacher
    const teacher = new Teacher({
      name,
      class: parseInt(classNum),
      phone,
      schoolID: school._id,
      organizationId: school.organizationId
    });

    await teacher.save();

    // 6. Update school's teachers array
    const schoolDoc = await School.findOne({ schoolName: school });
    if (!schoolDoc) {
      return res.status(404).json({ 
        success: false,
        message: "School not found" 
      });
    }

    schoolDoc.teachers.push(teacher._id);
    await schoolDoc.save();

    // 7. ✅ Success response
    res.status(200).json({
      success: true,
      message: "Teacher Account Created",
      teacher
    });

  } catch (error) {
    console.error(`Error creating teacher: ${error.message}`);
    res.status(500).json({ 
      success: false,
      message: "Error Creating Teacher Account",
      error: error.message
    });
  }
};

const getAssignedSchoolsForAdmin = async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: "Phone number is required" });
  }

  try {
    const admin = await User.findOne({ number: phoneNumber });

    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin not found" });
    }

    // ✅ Query schools where admin._id is in School.assignedAdmins
    const assignedSchools = await School.find(
      { assignedAdmins: admin._id },
      { schoolName: 1 }
    );

    if (!assignedSchools || assignedSchools.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No schools assigned to this admin",
      });
    }

    res.status(200).json({
      success: true,
      data: assignedSchools.map(s => s.schoolName),
      message: "Assigned schools fetched successfully",
    });

  } catch (error) {
    console.error(`Error fetching assigned schools for admin: ${error.message}`);
    res.status(500).json({ success: false, error: "Server error" });
  }
};


const getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find(); // Fetch all teachers
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching teachers", error });
    }
};

const uploadchilddetails = async (req, res) => {
  try {
    const { name, rollNumber, schoolID, parentName, parentPhoneNumber, class: classNum, age } = req.body;

    // 1. Basic validation
    if (!name || !age || !schoolID) {
      return res.status(400).json({
        success: false,
        message: "Name, Age, and School ID are required"
      });
    }

    
    // 2. Find admin by name (from frontend)
    const { adminNumber } = req.body;

const admin = await User.findOne({ number: adminNumber });
if (!admin) {
  return res.status(404).json({ 
    success: false,
    message: "Admin not found" 
  });
}

    // 3. ✅ Handle string or array format
    const assignedSchoolList = Array.isArray(admin.assignedSchoolList)
  ? admin.assignedSchoolList
  : typeof admin.assignedSchoolList === 'string'
    ? admin.assignedSchoolList.split(',').map(s => s.trim())
    : [];

const isAuthorized = assignedSchoolList.includes(req.body.schoolID || req.body.school);

if (!isAuthorized) {
  return res.status(403).json({ message: "Not authorized for this school" });
}

    // 4. Validate school assignment
    const isAssigned = assignedSchoolList.includes(schoolID);
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this school"
      });
    }
    const school = await School.findOne({ schoolName: schoolID }).select('_id organizationId');
if (!school) {
  return res.status(404).json({
    success: false,
    message: "School not found"
  });
}


    // 5. Create child document
    const child = new Child({
      name,
      rollNumber,
      schoolID: school._id,
      organizationId: school.organizationId,
      parentName,
      parentPhoneNumber: parentPhoneNumber, // Keep as string
      class: classNum ? parseInt(classNum) : undefined,
      age: parseInt(age)
    });

    await child.save();

    // 6. ✅ Success response
    await child.save();

res.status(201).json({
  success: true,
  message: "Child added successfully",
  child: {
    ...child.toObject(),
    schoolName: school.schoolName
  }
});

  } catch (error) {
    console.error(`Error adding child: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error adding child",
      error: error.message
    });
  }
};


const getchilddetails = async (req, res) => {
    try {
        const { phone, role } = req.query;

        if (!role) {
            return res.status(400).json({ message: "Role is required" });
        }

        let children = [];

        if (role === "Parent") {
            if (!phone) {
                return res.status(400).json({ message: "Phone number is required for parents" });
            }

            // Fetch children where parent's phone number matches exactly
            children = await Child.find({ parentPhoneNumber: phone })
        .populate('schoolID', 'schoolName');
        } else if (role === "Teacher") {
            // Fetch all children for teachers
            children = await Child.find()
        .populate('schoolID', 'schoolName');
        } else {
            return res.status(400).json({ message: "Invalid role" });
        }
        const formattedChildren = children.map(child => {
          const school = child.schoolID || {};
          return {
            _id: child._id,
            name: child.name,
            age: child.age,
            rollNumber: child.rollNumber,
            parentName: child.parentName,
            parentPhoneNumber: child.parentPhoneNumber,
            class: child.class,
            schoolId: child.schoolID?._id?.toString() || '', // MongoDB ObjectId
            schoolName: school.schoolName || '' // Human-readable name
          };
        });
    
        res.status(200).json(formattedChildren);
    } catch (error) {
        console.error("Error fetching children:", error);
        res.status(500).json({ message: "Error fetching children" });
    }
};
const verifyProfessional = async (req, res) => {
  try {
    const { professionalId } = req.query;
    console.log('Verifying professional:', professionalId);

    const professional = await Professional.findOne({ Number: professionalId });
    if (!professional) {
      return res.status(404).json({ 
        found: false,
        message: 'Professional not found' 
      });
    }

    // Get school names for assigned schools
    const schools = await School.find({
      _id: { $in: professional.assignedSchools }
    });

    const schoolInfo = schools.map(school => ({
      id: school._id,
      name: school.schoolName
    }));

    res.json({
  found: true,
  professional: {
    name: professional.name,
    phone: professional.Number,
    clinicName: professional.clinicName || 'Private Practice', // ✅ Add clinicName
    assignedSchools: schoolInfo
  }
});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const storeReportData = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log incoming request data

    const data = req.body;

    // Parse submittedBy from JSON string
    let submittedBy = {};
    try {
      submittedBy = data.submittedBy ? JSON.parse(data.submittedBy) : {};
    } catch (e) {
      return res.status(400).json({ error: "Invalid submittedBy format" });
    }

    if (submittedBy.id && !submittedBy.phone) {
      submittedBy.phone = submittedBy.id;
    }
    
    if (!submittedBy || !submittedBy.role || !submittedBy.phone) {
      console.error("User information is missing or invalid.");
      return res.status(400).json({ error: "User information is missing or invalid." });
    }
    

    console.log("Submitted By:", submittedBy); // Log submittedBy object

    // Parse nested objects (houseAns, personAns, treeAns)
   
    try {
      // Parse answers (expect JSON strings from frontend)
      const houseAnswers = req.body.houseAns ? JSON.parse(req.body.houseAns) : {};
      const treeAnswers = req.body.treeAns ? JSON.parse(req.body.treeAns) : {};
      const personAnswers = req.body.personAns ? JSON.parse(req.body.personAns) : {};
  
      console.log("🔍 Raw request body fields:", Object.keys(req.body));
      console.log("🔍 houseAns field:", req.body.houseAns);
      console.log("🔍 personAns field:", req.body.personAns);
      console.log("🔍 treeAns field:", req.body.treeAns);
      console.log("🔍 Parsed houseAnswers:", houseAnswers);
      console.log("🔍 HOUSE_QUESTIONS expected:", HOUSE_QUESTIONS);
  
      // Validate answers against fixed questions
      const validateAnswers = (answers, questions) => {
        const isValid = questions.every(q => answers.hasOwnProperty(q) && answers[q] != null);
        console.log(`🔍 Validation for ${questions.length} questions:`, isValid);
        questions.forEach(q => {
          console.log(`  - ${q}: ${answers.hasOwnProperty(q) ? '✅' : '❌'} (value: ${answers[q]})`);
        });
        return isValid;
      };
  
      if (!validateAnswers(houseAnswers, HOUSE_QUESTIONS)) {
        return res.status(400).json({ error: 'Invalid or missing house answers' });
      }
      if (!validateAnswers(treeAnswers, TREE_QUESTIONS)) {
        return res.status(400).json({ error: 'Invalid or missing tree answers' });
      }
      if (!validateAnswers(personAnswers, PERSON_QUESTIONS)) {
        return res.status(400).json({ error: 'Invalid or missing person answers' });
      }

    console.log("House Answers:", houseAnswers); // Log grouped answers
    console.log("Person Answers:", personAnswers);
    console.log("Tree Answers:", treeAnswers);

    // Validate required fields in nested objects
    const requiredFields = [
      "Who_Lives_Here",
      "Are_there_Happy",
      "Do_People_Visit_Here",
      "What_else_people_want",
      "Who_is_this_person",
      "How_old_are_they",
      "Whats_thier_fav_thing",
      "What_they_dont_like",
      "What_kind_of_tree",
      "how_old_is_it",
      "what_season_is_it",
      "anyone_tried_to_cut",
      "what_else_grows",
      "who_waters",
      "does_it_get_enough_sunshine",
    ];


    const missingFields = requiredFields.filter(
      (field) => !(houseAnswers[field] || personAnswers[field] || treeAnswers[field])
    );
    if (missingFields.length > 0) {
      console.error("Missing Fields:", missingFields);
      return res.status(400).json({
        error: "The following fields are missing:",
        missingFields,
      });
    }

    // Extract role-specific fields
    let clinicName = "";

    let childsName = "";
    let age = null;
    let optionalNotes = "";
    let flagforlabel = false; // Default to false
    let labelling = "";

    // Populate role-specific fields only for Professionals
    if (submittedBy.role === "Professional") {
      clinicName = Professional.clinicName;
      childsName = data.childsName || "";
      age = data.age || null;
      optionalNotes = data.optionalNotes || "";
      flagforlabel = typeof data.flagforlabel === "string"
        ? data.flagforlabel.toLowerCase() === "true"
        : !!data.flagforlabel; // Handle both string and Boolean inputs
      labelling = data.labelling || "";
    } else if (submittedBy.role === "Parent" || submittedBy.role === "Teacher") {
      // Validate child data for Parent and Teacher
      if (!data.childsName || !data.age) {
        return res.status(400).json({
          error: "Child name and age are required for Parent and Teacher roles.",
        });
      }
      childsName = data.childsName;
      age = data.age;
    }
    const { schoolId } = data;
    let schoolName = '';
    let organizationId = null;
    if (schoolId) {
      const school = await School.findById(schoolId).select('schoolName organizationId');
      if (school) {
        schoolName = school.schoolName;
        organizationId = school.organizationId;
      }
    }
    // Create the report object
    const report = new Report({
      clinicName,
      childsName,
      age,
      schoolId,
      schoolName,
      organizationId,
      optionalNotes,
      flagforlabel,
      labelling,
      images: {
        house: {
          path: req.files.houseImage?.[0]?.path || null,
          score: 0,
          manualScore: null,
          labeledBy: null,
          labeledAt: null
        },
        tree: {
          path: req.files.treeImage?.[0]?.path || null,
          score: 0,
          manualScore: null,
          labeledBy: null,
          labeledAt: null
        },
        person: {
          path: req.files.personImage?.[0]?.path || null,
          score: 0,
          manualScore: null,
          labeledBy: null,
          labeledAt: null
        }
      },
      houseAns: houseAnswers,
      treeAns: treeAnswers,
      personAns: personAnswers,
      submittedBy: {
        role: submittedBy.role,
        phone: submittedBy.phone,
       
      },
      childId: req.body.childId || null, // Set from frontend for parent/teacher, null for professional
    });

    console.log("Report Object:", report); // Log the report object

    // Save the report
    await report.save();
    console.log("Report Saved Successfully"); // Log successful save
    console.log("📢 Incoming report data:", JSON.stringify(data, null, 2));
    console.log("📎 Submitted by:", data.submittedBy);
    console.log("📌 Child name:", data.childsName);
    console.log("🏫 schoolId:", data.schoolId); // This may be null
    // Respond with success
    return res.status(201).json({
      message: "Report submitted successfully.",
      report,
    });
  } catch (error) {
    console.error("Error storing report data:", error); // Log the error

    // Handle validation errors explicitly
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: "Validation failed.",
        details: validationErrors,
      });
    }

    // Ensure only one response is sent
    if (!res.headersSent) {
      return res.status(500).json({
        error: "An error occurred while processing the report.",
      });
    }
  }
    } catch (error) {
    console.error("Error in storeReportData:", error);
    res.status(500).json({ error: "An error occurred while storing report data." });
  }
};


const editUserProfile = async (req, res) => {
  try {
    const { role, phone } = req.body;
    if (!role || !phone) {
      return res.status(400).json({ success: false, message: 'role and phone are required' });
    }

    // Shallow clone and sanitize
    const updateData = { ...req.body };
    delete updateData.role;
    // Avoid changing unique lookup keys inadvertently via generic assignment

    // Helper to apply updates except protected fields
    const applyUpdates = (doc, protectedKeys = []) => {
      Object.keys(updateData).forEach((key) => {
        if (protectedKeys.includes(key)) return;
        const value = updateData[key];
        if (value !== undefined && value !== null && value !== '') {
          doc[key] = value;
        }
      });
    };

    if (role === ROLES.PARENT) {
      const parent = await Child.findOne({ parentPhoneNumber: phone });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent not found' });

      // Map common profile keys to Child fields
      // Allowed keys: parentName, parentPhoneNumber, name (child name), age, class, rollNumber
      applyUpdates(parent, ['organizationId']);

      // Support updating parentPhoneNumber explicitly
      if (updateData.parentPhoneNumber) {
        parent.parentPhoneNumber = updateData.parentPhoneNumber;
      }
      await parent.save();
      return res.json({ success: true, message: 'Profile updated successfully', updatedUser: parent });
    }

    if (role === ROLES.TEACHER) {
      const teacher = await Teacher.findOne({ phone: phone });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
      // Allowed keys: name, phone, class
      applyUpdates(teacher, ['organizationId']);
      await teacher.save();
      return res.json({ success: true, message: 'Profile updated successfully', updatedUser: teacher });
    }

    if (role === ROLES.PROFESSIONAL) {
      const pro = await Professional.findOne({ Number: phone });
      if (!pro) return res.status(404).json({ success: false, message: 'Professional not found' });
      // Allowed keys: name, Number (via newPhone), Address, workEmail, clinicName
      applyUpdates(pro, ['Number', 'organizationId']);
      if (updateData.newPhone) {
        pro.Number = updateData.newPhone;
      }
      await pro.save();
      return res.json({ success: true, message: 'Profile updated successfully', updatedUser: pro });
    }

    if (role === ROLES.SCHOOL_ADMIN || role === ROLES.NGO_ADMIN || role === ROLES.ORGANIZATION_ADMIN) {
      const admin = await User.findOne({ number: phone, role: role });
      if (!admin) return res.status(404).json({ success: false, message: 'User not found' });
      // Allowed keys: name, number (via newPhone)
      applyUpdates(admin, ['number', 'assignedSchoolList', 'role', 'organizationId']);
      if (updateData.newPhone) {
        admin.number = updateData.newPhone;
      }
      await admin.save();
      return res.json({ success: true, message: 'Profile updated successfully', updatedUser: admin });
    }

    return res.status(400).json({ success: false, message: 'Unsupported role' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getsubmissionsummary = async (req, res) => {  
  try {
    const { role, phone } = req.query;

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    let query = {};
    if (role === "Parent") {
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required for parents" });
      }
      query = { "submittedBy.phone": phone };
    }

    // Aggregate submissions by child name
    const summary = await Report.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$childsName",
          submissionCount: { $sum: 1 },
        },
      },
      {
        $project: {
          childsName: "$_id",
          submissionCount: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching submission summary:", error);
    res.status(500).json({ error: "Error fetching submission summary" });
  }
};

// Endpoint 2: Fetch Submissions by Child Name
const getSubmissionsByChild = async (req, res) => {
  try {
    const { role, phone, childsName } = req.query;

    if (!role || !childsName) {
      return res.status(400).json({ error: "Role and child name are required" });
    }

    let query = { childsName };

    if (role === "Parent") {
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required for parents" });
      }
      query["submittedBy.phone"] = phone;
    }

    // Fetch submissions
    const submissions = await Report.find(query).populate('schoolId', 'schoolName');

    // Optional: Fetch child details too
    const child = await Child.findOne({ name: childsName });

    // ✅ Now we can log child info
    console.log("📚 Child Data:", JSON.stringify({
      name: child?.name,
      age: child?.age,
      schoolID: child?.schoolID
    }, null, 2));

    // ✅ Log submission data
    console.log("📚 Submissions Fetched:", JSON.stringify(submissions.map(s => ({
      childsName: s.childsName,
      age: s.age,
      schoolId: s.schoolId,
      submittedAt: s.submittedAt
    })), null, 2));

    return res.status(200).json(submissions);

  } catch (error) {
    console.error("Error fetching submissions by child:", error);
    return res.status(500).json({ error: "Error fetching submissions by child" });
  }
};



// Inside users.controller.js

import { generateAuthToken } from '../authService.js';

const searchNumber = async (req, res) => {
  console.log("📢 Request received at /api/users/search-number");
  try {
    const { number, usertype } = req.body;
    console.log(`🔍 Searching for user with number ${number} in ${usertype} role.`);

    // 1. Search in User model (Admins)
    let user = await User.findOne({ number });
    if (user) {
      console.log(`✅ Found user in User model (Admin): ${user.role}`);
      const token = generateAuthToken(user);
      return res.status(200).json({
        success: true,
        exists: true,
        message: `User found as ${user.role}`,
        data: {
          role: user.role,
          number: user.number,
          organizationId: user.organizationId,
          name: user.name,
          token: token
        }
      });
    }

    // 2. Search in Professional model
    const professional = await Professional.findOne({ Number: number });
    if (professional) {
      console.log(`✅ Found professional: ${professional.name}`);
      // Create a mock user object for token generation
      const mockUser = {
        _id: professional._id,
        role: 'Professional',
        number: professional.Number,
        organizationId: professional.organizationId,
        name: professional.name
      };
      const token = generateAuthToken(mockUser);
      return res.status(200).json({
        success: true,
        exists: true,
        message: "Professional found",
        data: {
          role: 'Professional',
          number: professional.Number,
          organizationId: professional.organizationId,
          name: professional.name,
          token: token
        }
      });
    }

    // 3. Not found
    return res.status(404).json({
      success: false,
      exists: false,
      message: "User not found"
    });
  } catch (error) {
    console.error(`💥 Error in searchNumber:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
const getProfessionalProfile = async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: "Phone is required" });
  const professional = await Professional.findOne({ Number: phone });
  if (!professional) return res.status(404).json({ error: "Not found" });
  res.json({
    name: professional.name,
    number: professional.Number,
    clinicName: professional.clinicName,
    // ...any other fields you want
  });
};
// Inside users.controller.js
// ============ BULK UPLOAD FOR TEACHERS ============
const bulkUploadTeachers = async (req, res) => {
  try {
    const { teachers, adminNumber } = req.body;

    // 1. Validate input
    if (!Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Teachers array is required and must not be empty",
      });
    }
    if (!adminNumber) {
      return res.status(400).json({
        success: false,
        message: "Admin phone number is required",
      });
    }

    // 2. Find admin
    const admin = await User.findOne({ number: adminNumber });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // 3. Normalize assignedSchoolList (string → array)
    const assignedSchoolList = Array.isArray(admin.assignedSchoolList)
      ? admin.assignedSchoolList
      : typeof admin.assignedSchoolList === "string"
      ? admin.assignedSchoolList.split(",").map((s) => s.trim())
      : [];

    // 4. For SchoolAdmin → enforce single school from assigned list (first one or assignedSchool if provided)
    let targetSchool = null;
    if (admin.role === "SchoolAdmin") {
      if (assignedSchoolList.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No school assigned to this admin",
        });
      }
      targetSchool = assignedSchoolList[0]; // or use req.body.school if you want to allow override (not recommended)
    } else {
      // NGOAdmin → must provide school in request body
      targetSchool = req.body.school;
      if (!targetSchool) {
        return res.status(400).json({
          success: false,
          message: "School name is required for NGO Admin",
        });
      }
      if (!assignedSchoolList.includes(targetSchool)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized for this school",
        });
      }
    }

    // 5. Validate and process each teacher
    const results = {
      successCount: 0,
      failures: [],
    };

    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i];
      const { name, class: classNum, phone } = t;

      // Validate required fields
      if (!name || !classNum || !phone) {
        results.failures.push({
          row: i + 1,
          reason: "Missing required fields (name, class, phone)",
        });
        continue;
      }

      // Validate class is number 1-12
      const classInt = parseInt(classNum);
      if (isNaN(classInt) || classInt < 1 || classInt > 12) {
        results.failures.push({
          row: i + 1,
          reason: "Class must be between 1 and 12",
        });
        continue;
      }

      // Validate phone is 10 digits
      if (!/^\d{10}$/.test(phone)) {
        results.failures.push({
          row: i + 1,
          reason: "Phone must be exactly 10 digits",
        });
        continue;
      }

      // Check if teacher already exists by phone
      const existingTeacher = await Teacher.findOne({ phone });
      if (existingTeacher) {
        results.failures.push({
          row: i + 1,
          reason: "Teacher with this phone already exists",
        });
        continue;
      }

      // Create teacher
      const teacher = new Teacher({
        name: name.trim(),
        class: classInt,
        phone,
        schoolID: schoolDoc._id,
        organizationId: schoolDoc.organizationId,
      });

      try {
        await teacher.save();

        // Update school's teachers array
        const schoolDoc = await School.findOne({ schoolName: targetSchool });
        if (schoolDoc) {
          schoolDoc.teachers.push(teacher._id);
          await schoolDoc.save();
        }

        results.successCount++;
      } catch (saveError) {
        results.failures.push({
          row: i + 1,
          reason: "Database error saving teacher",
        });
        continue;
      }
    }

    // 6. Return results
    res.status(200).json({
      success: true,
      message: `${results.successCount} teachers uploaded successfully`,
      ...results,
    });
  } catch (error) {
    console.error(`Error in bulkUploadTeachers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error during bulk upload",
      error: error.message,
    });
  }
};

// ============ BULK UPLOAD FOR CHILDREN ============
const bulkUploadChildren = async (req, res) => {
  try {
    const { children, adminNumber } = req.body;

    // 1. Validate input
    if (!Array.isArray(children) || children.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Children array is required and must not be empty",
      });
    }
    if (!adminNumber) {
      return res.status(400).json({
        success: false,
        message: "Admin phone number is required",
      });
    }

    // 2. Find admin
    const admin = await User.findOne({ number: adminNumber });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // 3. Normalize assignedSchoolList
    const assignedSchoolList = Array.isArray(admin.assignedSchoolList)
      ? admin.assignedSchoolList
      : typeof admin.assignedSchoolList === "string"
      ? admin.assignedSchoolList.split(",").map((s) => s.trim())
      : [];

    // 4. Determine target school
    let targetSchool = null;
    if (admin.role === "SchoolAdmin") {
      if (assignedSchoolList.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No school assigned to this admin",
        });
      }
      targetSchool = assignedSchoolList[0];
    } else {
      targetSchool = req.body.school;
      if (!targetSchool) {
        return res.status(400).json({
          success: false,
          message: "School name is required for NGO Admin",
        });
      }
      if (!assignedSchoolList.includes(targetSchool)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized for this school",
        });
      }
    }

    // 5. Find school to get _id and organizationId
    const schoolDoc = await School.findOne({ schoolName: targetSchool }).select(
      "_id organizationId"
    );
    if (!schoolDoc) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    // 6. Process each child
    const results = {
      successCount: 0,
      failures: [],
    };

    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      const {
        name,
        rollNumber,
        parentName,
        parentPhoneNumber,
        class: classNum,
        age,
      } = c;

      // Validate required fields
      if (!name || !age) {
        results.failures.push({
          row: i + 1,
          reason: "Missing required fields (name, age)",
        });
        continue;
      }

      // Validate age
      const ageInt = parseInt(age);
      if (isNaN(ageInt) || ageInt < 3 || ageInt > 18) {
        results.failures.push({
          row: i + 1,
          reason: "Age must be between 3 and 18",
        });
        continue;
      }

      // Validate phone if provided
      if (parentPhoneNumber && !/^\d{10}$/.test(parentPhoneNumber)) {
        results.failures.push({
          row: i + 1,
          reason: "Parent phone must be 10 digits",
        });
        continue;
      }

      // Validate class if provided
      let classInt = null;
      if (classNum) {
        classInt = parseInt(classNum);
        if (isNaN(classInt) || classInt < 1 || classInt > 12) {
          results.failures.push({
            row: i + 1,
            reason: "Class must be between 1 and 12",
          });
          continue;
        }
      }

      // Create child
      const child = new Child({
        name: name.trim(),
        rollNumber: rollNumber ? rollNumber.trim() : null,
        schoolID: schoolDoc._id,
        organizationId: schoolDoc.organizationId,
        parentName: parentName ? parentName.trim() : null,
        parentPhoneNumber: parentPhoneNumber || null,
        class: classInt,
        age: ageInt,
      });

      try {
        await child.save();
        results.successCount++;
      } catch (saveError) {
        results.failures.push({
          row: i + 1,
          reason: "Database error saving child",
        });
        continue;
      }
    }

    // 7. Return results
    res.status(200).json({
      success: true,
      message: `${results.successCount} children uploaded successfully`,
      ...results,
    });
  } catch (error) {
    console.error(`Error in bulkUploadChildren: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error during bulk upload",
      error: error.message,
    });
  }
};

// --- NEW FUNCTION: Detect Role and Fetch Profile ---
const detectRoleAndFetchProfile = async (req, res) => {
  try {
    const { number, phone } = req.body; // Accept both number and phone parameters
    const phoneNumber = number || phone; // Use whichever is provided

    console.log(`🔍 Detecting role for phone: ${phoneNumber}`);
    

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
        timestamp: new Date().toISOString()
      });
    }

    // Search in User model
     let user = await User.findOne({ number: phoneNumber });
    
    if (user) {
      const token = generateAuthToken(user); // 👈 Generate token
      return res.status(200).json({
        success: true,
        message: `User found with role: ${user.role}`,
        timestamp: new Date().toISOString(),
        data: {
          detectedRole: user.role,
          profileData: {
            name: user.name,
            number: user.number,
            organizationId: user.organizationId,
            assignedSchoolList: user.assignedSchoolList || []
          },
          token: token // 👈 Return token
        }
      });
    }
    // Search in Professional model
const professional = await Professional.findOne({ Number: phoneNumber });
if (professional) {
  // Create a mock user object for token generation
  const mockUser = {
    _id: professional._id,
    role: 'Professional',
    number: professional.Number,
    organizationId: professional.organizationId,
    name: professional.name
  };
  const token = generateAuthToken(mockUser); // 👈 Generate token
  return res.status(200).json({
    success: true,
    message: `Professional found`,
    timestamp: new Date().toISOString(),
    data: {
      detectedRole: 'Professional',
      profileData: {
        name: professional.name,
        number: professional.Number,
        organizationId: professional.organizationId,
        assignedSchoolList: []
      },
      token: token // 👈 Return token
    }
  });
}

    console.log(`❌ User not found for number ${phoneNumber}`);
    return res.status(404).json({
      success: false,
      message: "User not found",
      timestamp: new Date().toISOString()
    });
    

  } catch (error) {
    console.error('Role detection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error detecting role',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
// --- END NEW FUNCTION ---


export default responder;
export { createProfessionalAccount,
    getProfessionalIds, 
    createSchoolAccount, 
    detectRoleAndFetchProfile,
    // createNgoAdminAccount,
     assignAdminToSchool,
    getAdmins,
    createAdmin,
  
    getAllAdmins,
    getSchools,
    storeReportData,
    verifyProfessional,
    uploadteacherdetails,
    getAllTeachers,
    getchilddetails,
    uploadchilddetails,
    getSubmissionsByChild,
    getsubmissionsummary ,
    getAssignedSchoolsForAdmin ,
    getAssignedSchoolsForProfessional,
    assignSchoolToProfessional,
    searchNumber,
    getSchoolAdmins,
    editUserProfile,
    getProfessionalProfile,
    bulkUploadTeachers,
    bulkUploadChildren,
    // --- Admin/Management helpers ---
    deleteUser,
    deleteProfessional,
    deleteSchool,
    deleteTeacher,
    deleteChild,
    unassignAdminFromSchool,
    unassignProfessionalFromSchool,
    getStudentsBySchoolGrouped,
    getTeachersBySchool,

};