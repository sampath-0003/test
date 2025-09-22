import { Router } from 'express';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getOrganizationSchools,
  getOrganizationStats
} from '../controllers/organizations.controller.js';

const router = Router();

// Organization CRUD routes
router.route('/')
  .post(createOrganization)    // Create new organization
  .get(getOrganizations);      // Get all organizations

router.route('/:id')
  .get(getOrganizationById)    // Get organization by ID
  .put(updateOrganization)     // Update organization
  .delete(deleteOrganization); // Delete organization

// Organization-specific routes
router.route('/:id/schools')
  .get(getOrganizationSchools); // Get schools within organization

router.route('/:id/stats')
  .get(getOrganizationStats);   // Get organization statistics

export default router;
