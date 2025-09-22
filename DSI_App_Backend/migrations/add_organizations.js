import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Organization } from '../models/organization.model.js';
import { School } from '../models/school.model.js';
import { User } from '../models/user.model.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindseye';

async function migrateToOrganizations() {
  try {
    console.log('🚀 Starting organization migration...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Create default organization
    console.log('📝 Creating default organization...');
    
    // Find the first NGO admin to be the creator
    const ngoAdmin = await User.findOne({ role: 'NGOAdmin' });
    if (!ngoAdmin) {
      throw new Error('No NGO admin found. Please create an NGO admin first.');
    }

    const defaultOrganization = new Organization({
      name: 'Default Organization',
      description: 'Default organization for existing schools',
      address: 'System Generated',
      contactNumber: '0000000000',
      email: 'default@system.com',
      createdBy: ngoAdmin._id,
      isActive: true,
      level: 'ngo'
    });

    await defaultOrganization.save();
    console.log(`✅ Created default organization: ${defaultOrganization._id}`);

    // Step 2: Get all existing schools
    console.log('📚 Fetching existing schools...');
    const existingSchools = await School.find({});
    console.log(`Found ${existingSchools.length} existing schools`);

    if (existingSchools.length === 0) {
      console.log('ℹ️ No existing schools found. Migration complete.');
      return;
    }

    // Step 3: Update all schools with organizationId
    console.log('🔄 Updating schools with organization ID...');
    
    const updateResult = await School.updateMany(
      { organizationId: { $exists: false } },
      { $set: { organizationId: defaultOrganization._id } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} schools with organization ID`);

    // Step 4: Verify the migration
    console.log('🔍 Verifying migration...');
    
    const schoolsWithOrg = await School.countDocuments({ 
      organizationId: defaultOrganization._id 
    });
    
    const schoolsWithoutOrg = await School.countDocuments({ 
      organizationId: { $exists: false } 
    });

    console.log(`✅ Verification complete:`);
    console.log(`   - Schools with organization: ${schoolsWithOrg}`);
    console.log(`   - Schools without organization: ${schoolsWithoutOrg}`);

    if (schoolsWithoutOrg > 0) {
      console.log('⚠️ Warning: Some schools were not migrated. Please check manually.');
    }

    // Step 5: Update related models (optional - for future use)
    console.log('🔄 Updating related models...');
    
    // Update User model to include organizationId for future use
    // This is optional and can be implemented later when needed
    
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Default organization created: ${defaultOrganization.name}`);
    console.log(`   - Schools migrated: ${updateResult.modifiedCount}`);
    console.log(`   - Organization ID: ${defaultOrganization._id}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToOrganizations()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateToOrganizations };
