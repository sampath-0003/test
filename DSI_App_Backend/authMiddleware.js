import jwt from 'jsonwebtoken';
import { verifyToken } from '../services/authService.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid authentication'
    });
  }
};
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role, // "NGO Admin" or "School Admin"
      assignedSchool: decoded.assignedSchool || null, // For School Admins
      assignedSchoolList: decoded.assignedSchoolList || [] // For NGO Admins
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};