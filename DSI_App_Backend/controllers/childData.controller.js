import { Report } from '../models/report.model.js';
import { Child } from '../models/child.model.js';
import { ChildData } from '../models/childData.model.js';
import mongoose from 'mongoose';
// ✅ 1. Get all ChildData entries
export const getAllChildData = async (req, res) => {
    try {
        const data = await ChildData.find({}); // Fetch all child data
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching ChildData:", error);
        res.status(500).json({ error: "Failed to fetch child data" });
    }
};

// ✅ 2. Get ChildData filtered by role (e.g., Professional, Parent, Teacher)
export const getChildDataByRole = async (req, res) => {
    const { role, phone } = req.query;

    // Validate required fields
    if (!role) {
        return res.status(400).json({ error: "Role is required for filtering" });
    }

    try {
        let query = {};

        // Apply role-based filtering
        if (role === "Professional") {
            // Professionals see data they submitted
            if (!phone) {
                return res.status(400).json({ error: "Phone is required for Professional role" });
            }
            query["submittedBy.phone"] = phone;
        } else if (role === "Parent") {
            // Parents see data for their child
            const children = await Child.find({ parentPhoneNumber: phone });
            const childNames = children.map(child => child.name);
            query["child_name"] = { $in: childNames };
        } else if (role === "Teacher") {
            // Teachers see data for their school's children
            const children = await Child.find({ school_name: "SchoolA" }); // Replace with dynamic school name
            const childNames = children.map(child => child.name);
            query["child_name"] = { $in: childNames };
        } else {
            return res.status(400).json({ error: "Invalid role specified" });
        }

        // Fetch filtered data
        const data = await ChildData.find(query);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching child data by role:", error);
        res.status(500).json({ error: "Failed to fetch child data" });
    }
};

// ✅ 3. Update ChildData score for a specific image type
export const updateChildDataScore = async (req, res) => {
    try {
        const reportId = req.params.reportId.replace(':', ''); // Remove colon if present

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ 
                error: 'Invalid report ID format' 
            });
        }

        const { manualScore, labeledBy, imageType } = req.body;

        if (!manualScore || !labeledBy || !imageType) {
            return res.status(400).json({ 
                error: 'Manual score, labeledBy, and imageType are required' 
            });
        }

        // Validate imageType
        if (!['house', 'tree', 'person'].includes(imageType)) {
            return res.status(400).json({ 
                error: 'Invalid imageType. Must be house, tree, or person' 
            });
        }

        // Create update object for the specific image type
        const updateObject = {
            [`images.${imageType}.manualScore`]: manualScore,
            [`images.${imageType}.labeledBy`]: labeledBy,
            [`images.${imageType}.labeledAt`]: new Date(),
            flagforlabel: true
        };

        const updatedReport = await Report.findByIdAndUpdate(
            reportId,
            updateObject,
            { new: true }
        );

        if (!updatedReport) {
            return res.status(404).json({ 
                error: 'Report not found' 
            });
        }

        res.status(200).json({
            message: 'Score updated successfully',
            data: updatedReport
        });

    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({ 
            error: 'Failed to update score',
            details: error.message 
        });
    }
};

// ✅ 4. Update all three scores at once
export const updateAllScores = async (req, res) => {
    try {
        const reportId = req.params.reportId.replace(':', '');

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ 
                error: 'Invalid report ID format' 
            });
        }

        const { houseScore, treeScore, personScore, labeledBy } = req.body;

        if (!houseScore || !treeScore || !personScore || !labeledBy) {
            return res.status(400).json({ 
                error: 'All scores (houseScore, treeScore, personScore) and labeledBy are required' 
            });
        }

        // Validate scores are numbers between 0-100
        const scores = [houseScore, treeScore, personScore];
        for (let score of scores) {
            if (typeof score !== 'number' || score < 0 || score > 100) {
                return res.status(400).json({ 
                    error: 'Scores must be numbers between 0 and 100' 
                });
            }
        }

        // Create update object for all three image types
        const updateObject = {
            'images.house.manualScore': houseScore,
            'images.house.labeledBy': labeledBy,
            'images.house.labeledAt': new Date(),
            'images.tree.manualScore': treeScore,
            'images.tree.labeledBy': labeledBy,
            'images.tree.labeledAt': new Date(),
            'images.person.manualScore': personScore,
            'images.person.labeledBy': labeledBy,
            'images.person.labeledAt': new Date(),
            flagforlabel: true
        };

        const updatedReport = await Report.findByIdAndUpdate(
            reportId,
            updateObject,
            { new: true }
        );

        if (!updatedReport) {
            return res.status(404).json({ 
                error: 'Report not found' 
            });
        }

        res.status(200).json({
            message: 'All scores updated successfully',
            data: updatedReport
        });

    } catch (error) {
        console.error('Error updating all scores:', error);
        res.status(500).json({ 
            error: 'Failed to update scores',
            details: error.message 
        });
    }
};