import {Report} from '../models/report.model.js';
import mongoose from 'mongoose';
import {Professional} from '../models/professional.model.js'; 
import {School} from '../models/school.model.js';
import {User} from '../models/user.model.js'; // Import User model for NGO admin lookups
import { Teacher } from '../models/teacher.model.js';
import { Child } from '../models/child.model.js';
// New imports for fixed questions and formatting
import { HOUSE_QUESTIONS, PERSON_QUESTIONS, TREE_QUESTIONS } from '../models/questions.js';

const testing = (req, res) => {
    res.status(200).json({ message: "Hello World" });
}
import { Types } from 'mongoose';
const { ObjectId } = Types;
const formatReport = (report) => {
  return {
    id: report._id,
    clinicsName: report.clinicsName,
    childsName: report.childsName,
    age: report.age,
    schoolId: report.schoolId,
    schoolName: report.schoolId?.schoolName || (report.schoolId == null ? 'Personal Submission' : 'Unknown School'),
    optionalNotes: report.optionalNotes,
    flagforlabel: report.flagforlabel,
    labelling: report.labelling,
    submittedBy: report.submittedBy,
    submittedAt: report.submittedAt,
    clinicName: report.clinicName,
    childId: report.childId,
    house: {
      image: report.images.house.path || null,
      autoScore: report.images.house.score || 0,
      manualScore: report.images.house.manualScore || null,
      questionsAndAnswers: HOUSE_QUESTIONS.map(q => ({
        question: q,
        answer: report.houseAns[q] || 'N/A'
      }))
    },
    tree: {
      image: report.images.tree.path || null,
      autoScore: report.images.tree.score || 0,
      manualScore: report.images.tree.manualScore || null,
      questionsAndAnswers: TREE_QUESTIONS.map(q => ({
        question: q,
        answer: report.treeAns[q] || 'N/A'
      }))
    },
    person: {
      image: report.images.person.path || null,
      autoScore: report.images.person.score || 0,
      manualScore: report.images.person.manualScore || null,
      questionsAndAnswers: PERSON_QUESTIONS.map(q => ({
        question: q,
        answer: report.personAns[q] || 'N/A'
      }))
    }
  };
};
const getProfessionalReports = async (req, res) => {
  try {
    const { professionalId } = req.query;
    console.log('Fetching reports for professional:', professionalId);

    // Get professional's assigned schools
    const professional = await Professional.findOne({ Number: professionalId });
    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    // Get school names for assigned schools
    // Get school documents for assigned schools
const assignedSchools = await School.find({
  _id: { $in: professional.assignedSchools }
});

// Extract just the ObjectId strings
const assignedSchoolIds = assignedSchools.map(s => s._id.toString());
    // Fetch reports from assigned schools or submitted by this professional
    const reports = await Report.find({
  $or: [
    { 'submittedBy.phone': professionalId }, // ✅ Reports submitted by this pro
    { schoolId: { 
      $in: assignedSchoolIds.map(id => new ObjectId(id)) 
    }} // ✅ From assigned schools
  ]
}).populate('schoolId', 'schoolName'); 

res.json(
  reports.map(report => ({
    ...report.toObject(),
    schoolName: report.schoolId?.schoolName || (report.schoolId == null ? 'Personal Submission' : 'Unknown School'),
  }))
);
  } catch (error) {
    console.error('Error in getProfessionalReports:', error);
    res.status(500).json({ error: error.message });
  }
};


const getReportDataClinic = async (req, res) => {
    try {
        const reports = await Report.find({});
        res.status(200).json(reports);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error Fetching Reports" });
    }
}
const getParentSubmissions = async (req, res) => {
  try {
    const { parentPhone, date } = req.query;
    
    // Convert ISO date string to Date object range
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const count = await Report.countDocuments({
      'submittedBy.phone': parentPhone,
      submittedAt: {
        $gte: startDate,
        $lt: endDate
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error in getParentSubmissions:', error);
    res.status(500).json({ error: error.message });
  }
};


const getOneClinicReport = async (req, res) => {
    const { id } = req.params;
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }
  
    try {
      const report = await Report.findById(id);
  
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
  
      // Enhancement: If manualScore and labeledBy, fetch professional info
      let professionalInfo = null;
      if (report.manualScore && report.labeledBy) {
        professionalInfo = await Professional.findOne({ Number: report.labeledBy });
        if (professionalInfo) {
          professionalInfo = {
            name: professionalInfo.name,
            Number: professionalInfo.Number,
          };
        }
      }

      // Add professionalInfo to the response object
      const reportObj = report.toObject();
      reportObj.professionalInfo = professionalInfo;
  
      res.status(200).json(reportObj);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching report' });
    }
  };
  const getNgoSubmissions = async (req, res) => {
    try {
      const { ngoAdminPhone, date } = req.query;
      
      // Convert ISO date string to Date object range
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
  
      // Update the role check to match "NGOAdmin" instead of "NGO Master"
      const ngoAdmin = await User.findOne({ 
        number: ngoAdminPhone, 
        role: "NGOAdmin"  // Changed from "NGO Master" to "NGOAdmin"
      });
  
      if (!ngoAdmin) {
        return res.status(404).json({ 
          error: 'NGO admin not found',
          details: `No NGO admin found with phone: ${ngoAdminPhone}`
        });
      }
  
      // Get all school IDs assigned to this NGO admin
      const assignedSchoolIds = ngoAdmin.assignedSchoolList || [];
  
      // Convert school names to ObjectIds if they're not already
      const schoolIds = await Promise.all(assignedSchoolIds.map(async (schoolId) => {
        if (mongoose.Types.ObjectId.isValid(schoolId)) {
          return new ObjectId(schoolId);
        }
        // If it's a school name, find its ID
        const school = await School.findOne({ schoolName: schoolId });
        return school ? school._id : null;
      }));
  
      // Filter out null values
      const validSchoolIds = schoolIds.filter(id => id !== null);
  
      // Get today's submissions count
      const todayCount = await Report.countDocuments({
        schoolId: { $in: validSchoolIds },
        submittedAt: {
          $gte: startDate,
          $lt: endDate
        }
      });
  
      // Get total submissions count
      const totalCount = await Report.countDocuments({
        schoolId: { $in: validSchoolIds }
      });
  
      res.json({ 
        todayCount, 
        totalCount,
        date: startDate,
        ngoAdmin: ngoAdminPhone,
        schoolCount: validSchoolIds.length
      });
  
    } catch (error) {
      console.error('Error in getNgoSubmissions:', error);
      res.status(500).json({ error: error.message });
    }
  };
  

const getSchoolSubmissions = async (req, res) => {
  try {
    const { schoolId, date } = req.query;
    if (!schoolId || !date) {
      return res.status(400).json({ error: "schoolId and date are required" });
    }
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const count = await Report.countDocuments({
      schoolId: schoolId,
      submittedAt: {
        $gte: startDate,
        $lt: endDate
      }
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfessionalSchoolSubmissions = async (req, res) => {
  try {
    const { professionalId, organizationId } = req.query;
    if (!professionalId) {
      return res.status(400).json({ error: "professionalId is required" });
    }

    // 1. Find the professional
    const professional = await Professional.findOne({ Number: professionalId });
    if (!professional) {
      return res.status(404).json({ error: "Professional not found" });
    }

    // 2. Get assigned schools
    const schoolQuery = { _id: { $in: professional.assignedSchools } };
    if (organizationId) {
      schoolQuery.organizationId = organizationId;
    }
    const assignedSchools = await School.find(schoolQuery);

    // 3. For each school, get submission counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const results = await Promise.all(
      assignedSchools.map(async (school) => {
        // Count all reports for this school, including those submitted by the professional
        const todayCount = await Report.countDocuments({
          schoolId: school._id,
          $or: [
            { 'submittedBy.phone': professionalId },
            { schoolId: school._id }
          ],
          submittedAt: { $gte: today, $lt: tomorrow }
        });
        const totalCount = await Report.countDocuments({
          schoolId: school._id,
          $or: [
            { 'submittedBy.phone': professionalId },
            { schoolId: school._id }
          ]
        });
        return {
          schoolId: school._id,
          schoolName: school.schoolName,
          todayCount,
          totalCount
        };
      })
    );

    // Count personal/clinic submissions (no schoolId)
    const personalTodayCount = await Report.countDocuments({
      'submittedBy.phone': professionalId,
      $or: [
        { schoolId: { $exists: false } },
        { schoolId: null }
      ],
      submittedAt: { $gte: today, $lt: tomorrow }
    });
    const personalTotalCount = await Report.countDocuments({
      'submittedBy.phone': professionalId,
      $or: [
        { schoolId: { $exists: false } },
        { schoolId: null }
      ]
    });
    results.push({
      schoolId: null,
      schoolName: "Personal Submissions",
      todayCount: personalTodayCount,
      totalCount: personalTotalCount
    });

    res.json(results);
  } catch (error) {
    console.error('Error in getProfessionalSchoolSubmissions:', error);
    res.status(500).json({ error: error.message });
  }
};



const getTeacherSubmissions = async (req, res) => {
  const { teacherPhone } = req.query;
  if (!teacherPhone) return res.status(400).json({ error: "teacherPhone required" });

  // 1. Find teacher
  const teacher = await Teacher.findOne({ phone: teacherPhone });
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  // 2. Get assigned school and class
  const schoolName = teacher.school_name;
  const classNum = teacher.class;

  // 2.1. Find the school by name to get its ObjectId
  const school = await School.findOne({ schoolName: schoolName });
  if (!school) return res.status(404).json({ error: "School not found" });

  // 3. Find all children in that school and class
  const children = await Child.find({ schoolID: school._id, class: classNum });
  const childIds = children.map(child => child._id);

  // 4. Find all reports for those children
  const reports = await Report.find({ childId: { $in: childIds } });

  res.json(reports);
};

export { testing,
    getReportDataClinic,
    getOneClinicReport,
    getProfessionalReports ,
    getParentSubmissions,
    getNgoSubmissions,
    getSchoolSubmissions,
    getProfessionalSchoolSubmissions,
    getTeacherSubmissions
 };