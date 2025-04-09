import { Request, Response } from 'express';
import prisma from '../../config/db';
import { UserRole } from '../../types';
import { handleApiError, ErrorCodes } from './utils';

// Get a user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isOwnProfile = req.user?.id === id;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'User not found'
        }
      });
    }

    // Filter data based on role and ownership
    let filteredUser;
    
    if (isAdmin) {
      // Admins see everything except password
      filteredUser = { ...user, password: undefined };
    } else if (isOwnProfile) {
      // Users can see their own data except password
      filteredUser = { ...user, password: undefined };
    } else {
      // Others see limited info
      filteredUser = {
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
      };
    }

    res.json({ success: true, data: filteredUser });
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch user');
  }
}; 