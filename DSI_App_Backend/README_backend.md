# Mindsye Backend (DSI_App_Backend)

## Overview
This is the backend for the Mindsye Exam App, built with Node.js, Express, and MongoDB (Mongoose). It manages user accounts (NGO Admin, Professional, School Admin, Parent, Teacher), report submissions, school/professional assignments, and analytics endpoints.

---

## Key Features
- User management (NGO Admin, Professional, School Admin, Parent, Teacher)
- School and professional assignment
- Report submission and retrieval
- Manual and model scoring
- Submission analytics (per school, per professional, per NGO)
- Profile editing

---

## Main API Endpoints

### User Management
- `POST /api/users/create-professional` — Create a professional account (with clinic name)
- `POST /api/users/create-school` — Create a school account
- `POST /api/users/create-ngo-admin` — Create an NGO admin
- `POST /api/users/search-number` — Check if a user exists by number
- `GET /api/users/getProfessionalIds` — List all professionals
- `GET /api/users/get-assigned-schools` — Get schools assigned to a professional
- `GET /api/users/verify-professional` — Get professional profile and assigned schools
- `PUT /api/users/edit-profile` — Edit user profile (varies by role)

### Assignment
- `POST /api/users/assign-school-to-professional` — Assign a school to a professional
- `POST /api/users/assign-admin-to-school` — Assign an admin to a school

### Child/Teacher Data
- `GET /api/users/getchildren` — Get children by role/phone
- `POST /api/users/childupload` — Upload child details
- `POST /api/users/teacherupload` — Upload teacher details

### Reports
- `POST /api/reports/store-report-data` — Submit a report (parent, teacher, professional)
- `GET /api/reports/get-professional-reports` — Get all reports for a professional (personal + assigned schools)
- `GET /api/reports/get-report-data-clinic/:id` — Get a single report by ID
- `GET /api/reports/get-parent-submissions` — Get parent submission count for a date
- `GET /api/reports/get-ngo-submissions` — Get NGO admin's school submissions (today/total)
- `GET /api/reports/get-school-submissions` — Get school submissions (today)
- `GET /api/reports/professional-school-submissions` — Get per-school and personal submission counts for a professional

### Child Data
- `GET /api/child-data/get-all-child-data` — Get all child data
- `GET /api/child-data/get-by-role` — Get child data by role/phone
- `PATCH /api/child-data/update-score/:reportId` — Update manual score for a report

---

## Key Models

### Professional
- `name`, `Number`, `Address`, `ProfessionalID`, `workEmail`, `clinicName`, `assignedSchools`

### School
- `schoolName`, `address`, `udiseNumber`, `contactNumber`, `assignedProfessional`

### User (NGOAdmin, SchoolAdmin)
- `name`, `number`, `role`, `assignedSchoolList`

### Report
- `childsName`, `age`, `schoolId`, `schoolName`, `clinicName`, `optionalNotes`, `flagforlabel`, `labelling`, `imageurl`, `houseAns`, `personAns`, `treeAns`, `submittedBy`, `score`, `manualScore`, `submittedAt`

---

## Main Controllers

- `users.controller.js`: Handles user creation, assignment, profile editing, and data upload.
- `reports.controller.js`: Handles report submission, fetching, analytics, and per-role queries.
- `childData.controller.js`: Handles child data retrieval and manual scoring.

---

## Known Issues & Areas for Improvement

- **Professional Personal Submissions:**
  - Ensure `clinicName` is always auto-filled from profile for professional submissions.
  - Only set `schoolId`/`schoolName` for parent/teacher, not professional.
  - Some legacy reports may have `schoolId: ""` (empty string), which can cause MongoDB cast errors. Use only `null` or omit for personal submissions.

- **Edit Profile:**
  - Only allow editing fields that exist in the backend model for each role.
  - Some fields (like `workEmail`, `Address`, `class`) are not present for all roles.

- **Assignment Consistency:**
  - Ensure assigned schools/professionals are always valid ObjectIds.
  - Some endpoints expect school IDs, others expect names—standardize this.

- **Error Handling:**
  - Improve error messages and validation for all endpoints.
  - Add more robust checks for missing/invalid data.

- **Authentication:**
  - JWT middleware exists but is not enforced on all routes.

- **Testing:**
  - Add more unit and integration tests for controllers and models.

---

## Features to Implement or Improve

- **Clinic Name Auto-fill:**
  - Ensure all professional submissions use the clinic name from the professional's profile.
- **Profile Editing:**
  - Allow professionals to edit their clinic name (if needed).
- **Submission Analytics:**
  - Add endpoints for more granular analytics (e.g., per child, per class, per date range).
- **Role-based Access:**
  - Enforce role-based access control on sensitive endpoints.
- **Data Cleanup:**
  - Migrate legacy reports with `schoolId: ""` to `null`.

---

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` file with MongoDB connection and JWT secret.
3. Start the server:
   ```bash
   npm start
   ```
4. The backend runs on `http://localhost:3001` by default.

---

## Integration Notes
- The frontend expects certain fields (e.g., `clinicName`, `schoolName`, `manualScore`) in API responses.
- Always keep API response formats consistent for smooth integration.
- If you change a model or endpoint, update both backend and frontend accordingly.

---

## Contact
For questions or issues, contact the backend maintainer or open an issue in the project repository. 