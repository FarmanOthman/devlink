import { Request, Response } from 'express';
import prisma from '../../config/db';
import { UserRole } from '../../types';
import { handleApiError } from './utils';

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    
    // Filter sensitive information based on user role
    let filteredUsers;
    if (req.user?.role === UserRole.ADMIN) {
      // Admins can see everything except passwords
      filteredUsers = users.map(user => ({
        ...user,
        password: undefined
      }));
    } else {
      // Regular users can only see non-sensitive information
      filteredUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        location: user.location,
        bio: user.bio,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        portfolioUrl: user.portfolioUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Exclude sensitive fields like password, tokenVersion, etc.
      }));
    }
    
    res.json({ success: true, data: filteredUsers });
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch users');
  }
}; 