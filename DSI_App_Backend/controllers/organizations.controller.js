import { Organization } from '../models/organization.model.js';
import { School } from '../models/school.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

// Create a new organization
const createOrganization = async (req, res) => {
  try {
    const { name, description, address, contactNumber, email, createdBy } = req.body;

    // Validate required fields
    if (!name || !address || !contactNumber || !createdBy) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, address, contact number, and createdBy are required" 
      });
    }

    // Check if organization name already exists
    const existingOrg = await Organization.findOne({ name: name.trim() });
    if (existingOrg) {
      return res.status(400).json({ 
        success: false, 
        message: "Organization with this name already exists" 
      });
    }

    // Verify that createdBy user exists and is an NGOAdmin
    const creator = await User.findById(createdBy);
    if (!creator) {
      return res.status(404).json({ 
        success: false, 
        message: "Creator user not found" 
      });
    }

    if (creator.role !== 'NGOAdmin') {
      return res.status(403).json({ 
        success: false, 
        message: "Only NGO admins can create organizations" 
      });
    }

    // Create the organization
    const organization = new Organization({
      name: name.trim(),
      description: description?.trim(),
      address: address.trim(),
      contactNumber: contactNumber.trim(),
      email: email?.trim(),
      createdBy: createdBy
    });

    await organization.save();

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: organization
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating organization",
      error: error.message 
    });
  }
};

// Get all organizations
const getOrganizations = async (req, res) => {
  try {
    const { createdBy, isActive } = req.query;
    
    let query = {};
    
    // Filter by creator if provided
    if (createdBy) {
      query.createdBy = createdBy;
    }
    
    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const organizations = await Organization.find(query)
      .populate('createdBy', 'name number role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: organizations,
      count: organizations.length
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching organizations",
      error: error.message 
    });
  }
};

// Get organization by ID
const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid organization ID" 
      });
    }

    const organization = await Organization.findById(id)
      .populate('createdBy', 'name number role')
      .populate('schoolsCount');

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching organization",
      error: error.message 
    });
  }
};

// Update organization
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid organization ID" 
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // If name is being updated, check for duplicates
    if (updateData.name) {
      const existingOrg = await Organization.findOne({ 
        name: updateData.name.trim(),
        _id: { $ne: id }
      });
      if (existingOrg) {
        return res.status(400).json({ 
          success: false, 
          message: "Organization with this name already exists" 
        });
      }
      updateData.name = updateData.name.trim();
    }

    const organization = await Organization.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name number role');

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: organization
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating organization",
      error: error.message 
    });
  }
};

// Delete organization (soft delete)
const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid organization ID" 
      });
    }

    // Check if organization has schools
    const schoolsCount = await School.countDocuments({ organizationId: id });
    if (schoolsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete organization. It has ${schoolsCount} schools assigned. Please reassign or delete schools first.` 
      });
    }

    // Soft delete by setting isActive to false
    const organization = await Organization.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Organization deleted successfully",
      data: organization
    });

  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting organization",
      error: error.message 
    });
  }
};

// Get schools within an organization
const getOrganizationSchools = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid organization ID" 
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    const skip = (page - 1) * limit;
    const schools = await School.find({ organizationId: id })
      .populate('assignedProfessionals', 'name ProfessionalID')
      .populate('assignedAdmins', 'name number role')
      .populate('teachers', 'name phone class')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalSchools = await School.countDocuments({ organizationId: id });

    res.status(200).json({
      success: true,
      data: schools,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSchools / limit),
        totalSchools,
        hasNext: skip + schools.length < totalSchools,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching organization schools:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching organization schools",
      error: error.message 
    });
  }
};

// Get organization statistics
const getOrganizationStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid organization ID" 
      });
    }

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    // Get statistics
    const schoolsCount = await School.countDocuments({ organizationId: id });
    const teachersCount = await School.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$teachers' },
      { $count: 'totalTeachers' }
    ]);

    const professionalsCount = await School.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$assignedProfessionals' },
      { $count: 'totalProfessionals' }
    ]);

    const adminsCount = await School.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$assignedAdmins' },
      { $count: 'totalAdmins' }
    ]);

    res.status(200).json({
      success: true,
      data: {
        organization: {
          id: organization._id,
          name: organization.name,
          isActive: organization.isActive
        },
        statistics: {
          schoolsCount,
          teachersCount: teachersCount[0]?.totalTeachers || 0,
          professionalsCount: professionalsCount[0]?.totalProfessionals || 0,
          adminsCount: adminsCount[0]?.totalAdmins || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching organization statistics",
      error: error.message 
    });
  }
};

export {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getOrganizationSchools,
  getOrganizationStats
};
