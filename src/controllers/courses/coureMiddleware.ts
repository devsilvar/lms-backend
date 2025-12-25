// middleware/checkCourseOwnership.ts
import prisma from "../../config/db.js";
import { Request, Response, NextFunction } from "express";
interface UserRequest extends Request {
  user?: {
    id: string;
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  };
}


export const checkCourseOwnership = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const user = req.user!;

    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        ...(user.role === 'INSTRUCTOR' && { instructorId: user.id })
        // Admins bypass ownership check
      },
    });

    if (!course) {
      return res.status(404).json({ 
        error: 'Course not found or access denied' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};