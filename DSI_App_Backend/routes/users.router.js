import { Router } from "express";
import { requireOrganizationContext, enforceOrganizationBoundary } from "../middleware/organization.js";
import { auth } from "../middleware/auth.js";

import { createProfessionalAccount, 
    getProfessionalIds, 
    createSchoolAccount, 
    // createNgoAdminAccount,
     assignAdminToSchool,
    getAdmins,
    createAdmin,
        
        //getAllAdmins,
    getSchools,
    getchilddetails,
    uploadteacherdetails,
    uploadchilddetails,
    searchNumber,
    getSchoolAdmins,
 // createSchoolAdmin,
  getSubmissionsByChild,
  getAssignedSchoolsForProfessional,
    assignSchoolToProfessional,
    getsubmissionsummary ,getAssignedSchoolsForAdmin ,
    verifyProfessional,
    getAllTeachers,
    editUserProfile,
    getProfessionalProfile,detectRoleAndFetchProfile,
    bulkUploadTeachers,
    bulkUploadChildren,
    // new controllers
    deleteUser,
    deleteProfessional,
    deleteSchool,
    deleteTeacher,
    deleteChild,
    unassignAdminFromSchool,
    unassignProfessionalFromSchool,
    getStudentsBySchoolGrouped,
    getTeachersBySchool,
} from "../controllers/users.controller.js";



const router = Router();
// router.route("/testing").post(responder);
router.route("/create-professional").post(auth, requireOrganizationContext, enforceOrganizationBoundary, createProfessionalAccount);
router.route("/getProfessionalIds").get(getProfessionalIds);
router.route("/assign-school-to-professional").post(assignSchoolToProfessional);
router.route("/get-assigned-schools").get(getAssignedSchoolsForProfessional);

router.route("/detect-role-and-fetch-profile").post(detectRoleAndFetchProfile); // ✅ No middleware
// Add after existing routes
router.route("/bulk-upload-teachers").post(bulkUploadTeachers);
router.route("/bulk-upload-children").post(bulkUploadChildren);
router.route("/create-school").post(createSchoolAccount);
router.route("/create-admin").post(auth, requireOrganizationContext, enforceOrganizationBoundary, createAdmin,);

router.route("/verify-professional").get(verifyProfessional);     
router.route("/get-admins").get(auth, requireOrganizationContext, enforceOrganizationBoundary, getAdmins);
router.route("/get-schools").get(auth, requireOrganizationContext, enforceOrganizationBoundary, getSchools);
router.route('/getteachers').get(auth, requireOrganizationContext, enforceOrganizationBoundary, getAllTeachers)
router.route("/teacherupload").post(auth, requireOrganizationContext, enforceOrganizationBoundary, uploadteacherdetails);
router.route("/childupload").post(auth, requireOrganizationContext, enforceOrganizationBoundary, uploadchilddetails);
router.route("/search-number").post(searchNumber);
router.route("/get-school-admins").get(getSchoolAdmins);
//router.route("/create-school-admin").post(createSchoolAdmin);
router.route("/getchildren").get(getchilddetails);
router.route('/get-submissions-by-child').get(getSubmissionsByChild);
router.route('/get-submission-summary').get(getsubmissionsummary);


router.route("/assign-admin-to-school").post(auth, requireOrganizationContext, enforceOrganizationBoundary, assignAdminToSchool);
router.route("/get-assigned-schools-for-admin").get(getAssignedSchoolsForAdmin);      
router.route("/edit-profile").put(editUserProfile);
router.route("/get-professional-profile").get(getProfessionalProfile);

// ========== New Management Routes ==========
// Deletes
router.route('/delete-user/:id').delete(auth, requireOrganizationContext, enforceOrganizationBoundary, deleteUser);
router.route('/delete-professional/:id?').delete(auth, requireOrganizationContext, enforceOrganizationBoundary, deleteProfessional); // also supports ?professionalId=&phone=
router.route('/delete-school/:id').delete(auth, requireOrganizationContext, enforceOrganizationBoundary, deleteSchool);
router.route('/delete-teacher/:id?').delete(auth, requireOrganizationContext, enforceOrganizationBoundary, deleteTeacher); // also supports ?phone=
router.route('/delete-child/:id').delete(auth, requireOrganizationContext, enforceOrganizationBoundary, deleteChild);

// Unassign
router.route('/unassign-admin-from-school').post(auth, requireOrganizationContext, enforceOrganizationBoundary, unassignAdminFromSchool);
router.route('/unassign-professional-from-school').post(auth, requireOrganizationContext, enforceOrganizationBoundary, unassignProfessionalFromSchool);

// Listings for School Admin
router.route('/students-by-school').get(auth, getStudentsBySchoolGrouped); // ?schoolId= or ?schoolName=
router.route('/teachers-by-school').get(auth, getTeachersBySchool); // ?schoolId= or ?schoolName=

export default router;
