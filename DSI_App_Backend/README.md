# MindsEye Backend API

## 🎯 Overview

The MindsEye Backend is a Node.js/Express.js REST API that powers the child psychology assessment platform. It provides comprehensive endpoints for user management, report generation, school administration, and data analytics.

## 🏗️ Architecture

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based
- **File Handling**: Image upload and processing
- **API**: RESTful endpoints

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn** package manager

## 🚀 Installation & Setup

### 1. Clone and Navigate
```bash
cd DSI_App_Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/updated_code
DB_NAME=updated_code

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Optional: Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 4. Database Setup
Ensure MongoDB is running locally or update the `MONGO_URI` in your `.env` file to point to your MongoDB instance.

### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### 1. User Search
```http
POST /api/users/search-number
Content-Type: application/json

{
  "usertype": "Professional|Teacher|Parent|School Admin|NGO Master",
  "number": "phone_number"
}
```

#### 2. Professional Management
```http
POST /api/users/create-professional
Content-Type: application/json

{
  "name": "Professional Name",
  "Number": "phone_number",
  "Address": "address",
  "ProfessionalID": "unique_id",
  "workEmail": "email@example.com"
}
```

```http
GET /api/users/getProfessionalIds
```

```http
POST /api/users/assign-school-to-professional
Content-Type: application/json

{
  "professionalId": "professional_id",
  "schoolName": "school_name"
}
```

#### 3. School Management
```http
POST /api/users/create-school
Content-Type: application/json

{
  "schoolName": "School Name",
  "udiseNumber": "udise_number",
  "address": "school_address",
  "contactNumber": "contact_number",
  "assignedProfessionalId": "professional_id"
}
```

```http
GET /api/users/get-schools
```

#### 4. Admin Management
```http
POST /api/users/create-ngo-admin
Content-Type: application/json

{
  "name": "Admin Name",
  "number": "phone_number",
  "role": "NGOAdmin|SchoolAdmin",
  "assignedSchoolList": ["school1", "school2"]
}
```

```http
GET /api/users/get-admins?phone=phone_number
```

```http
POST /api/users/assign-admin-to-school
Content-Type: application/json

{
  "adminNumber": "admin_phone",
  "schoolName": "school_name"
}
```

#### 5. Teacher Management
```http
POST /api/users/teacherupload
Content-Type: application/json

{
  "name": "Teacher Name",
  "class": "class_number",
  "phone": "phone_number",
  "school": "school_name",
  "adminNumber": "admin_phone"
}
```

```http
GET /api/users/getteachers
```

#### 6. Student Management
```http
POST /api/users/childupload
Content-Type: application/json

{
  "name": "Child Name",
  "rollNumber": "roll_number",
  "schoolID": "school_name",
  "parentName": "Parent Name",
  "parentPhoneNumber": "parent_phone",
  "class": "class_number",
  "age": "age",
  "adminNumber": "admin_phone"
}
```

```http
GET /api/users/getchildren?role=Parent&phone=phone_number
```

#### 7. Profile Management
```http
PUT /api/users/edit-profile
Content-Type: application/json

{
  "role": "user_role",
  "phone": "phone_number",
  "name": "updated_name",
  "address": "updated_address"
}
```

### Report Management Endpoints

#### 1. Submit Report
```http
POST /api/reports/submit
Content-Type: application/json

{
  "clinicsName": "clinic_name",
  "childsName": "child_name",
  "age": "age",
  "schoolId": "school_id",
  "optionalNotes": "notes",
  "flagforlabel": "true|false",
  "labelling": "manual_labels",
  "imageurl": "image_url",
  "houseAns": {
    "Who_Lives_Here": "answer",
    "Are_there_Happy": "answer",
    "Do_People_Visit_Here": "answer",
    "What_else_people_want": "answer"
  },
  "personAns": {
    "Who_is_this_person": "answer",
    "How_old_are_they": "answer",
    "Whats_thier_fav_thing": "answer",
    "What_they_dont_like": "answer"
  },
  "treeAns": {
    "What_kind_of_tree": "answer",
    "how_old_is_it": "answer",
    "what_season_is_it": "answer",
    "anyone_tried_to_cut": "answer",
    "what_else_grows": "answer",
    "who_waters": "answer",
    "does_it_get_enough_sunshine": "answer"
  },
  "submittedBy": {
    "role": "Professional|Teacher|Parent",
    "phone": "phone_number"
  }
}
```

#### 2. Get Professional Reports
```http
GET /api/reports/get-professional-reports?professionalId=professional_id
```

#### 3. Get All Reports
```http
GET /api/reports/get-all-reports
```

#### 4. Get Single Report
```http
GET /api/reports/get-report/:id
```

#### 5. Get Submissions by Child
```http
GET /api/users/get-submissions-by-child?role=Parent&phone=phone_number&childsName=child_name
```

#### 6. Get Submission Summary
```http
GET /api/users/get-submission-summary?role=Parent&phone=phone_number
```

### Analytics Endpoints

#### 1. Parent Submissions Count
```http
GET /api/reports/parent-submissions?parentPhone=phone_number&date=2024-01-01
```

#### 2. NGO Submissions Count
```http
GET /api/reports/ngo-submissions?ngoAdminPhone=phone_number&date=2024-01-01
```

#### 3. School Submissions Count
```http
GET /api/reports/school-submissions?schoolId=school_id&date=2024-01-01
```

## 🗄️ Database Models

### User Model
- **User**: Unified user model for admins
- **Professional**: Professional psychologists
- **Teacher**: School teachers
- **Child**: Students with parent information
- **School**: Educational institutions
- **Report**: Assessment reports and analysis

### Key Relationships
- Schools can have multiple assigned professionals and admins
- Professionals can be assigned to multiple schools
- Teachers belong to specific schools
- Children are associated with schools and parents
- Reports are linked to children, schools, and submitters

## 🔐 Security Features

### Authentication
- JWT-based token authentication
- Role-based access control
- Secure password handling
- Session management

### Data Validation
- Input sanitization
- Schema validation with Mongoose
- Error handling and logging
- CORS configuration

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=3001
   MONGO_URI=mongodb://your_production_mongo_uri
   JWT_SECRET=your_secure_jwt_secret
   ```

2. **PM2 Deployment**
   ```bash
   npm install -g pm2
   pm2 start index.js --name "mindseye-backend"
   pm2 save
   pm2 startup
   ```

3. **Docker Deployment**
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment mode | No | development |
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `DB_NAME` | Database name | No | updated_code |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | JWT refresh secret | No | - |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | No | - |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | No | - |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | No | - |

## 🧪 Testing

### Running Tests
```bash
# Install test dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

### API Testing with Postman
Import the provided Postman collection for comprehensive API testing.

## 📊 Monitoring & Logging

### Logging
- Request/response logging
- Error tracking
- Performance monitoring
- Database query logging

### Health Checks
```http
GET /health
```

## 🔧 Development

### Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server
npm run migrate:schools  # Run database migrations
```

### Code Structure
```
DSI_App_Backend/
├── controllers/     # Route handlers
├── models/         # Database models
├── routes/         # API routes
├── middleware/     # Custom middleware
├── db/            # Database connection
├── app.js         # Express app setup
├── index.js       # Server entry point
└── package.json   # Dependencies
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper token format

3. **CORS Errors**
   - Update CORS configuration in `app.js`
   - Check frontend URL in allowed origins

4. **File Upload Issues**
   - Verify file size limits
   - Check upload directory permissions
   - Ensure proper content-type headers

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

## 📄 License

This project is licensed under the Apache License 2.0.

---

**MindsEye Backend** - Powering child psychology assessment through robust APIs. 