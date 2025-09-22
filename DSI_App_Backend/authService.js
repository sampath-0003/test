import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateAuthToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role,
      number: user.number,
      organizationId: user.organizationId,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};