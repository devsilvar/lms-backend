import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { uploadImage, handleUploadError } from "../middlewares/uploadMiddleware.js";
import { getStudentProfile, updateAdminProfile, updateInstructorProfile, updateStudentProfile } from "../controllers/userController.js";
import prisma from '../config/db.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: User Profile Management
 *     description: User profile operations for all user types (student, instructor, admin)
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get the profile of the authenticated user
 *     description: Retrieve the profile information of the currently authenticated user (works for student, instructor, and admin roles)
 *     tags: [User Profile Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [STUDENT, INSTRUCTOR, ADMIN]
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         bio:
 *                           type: string
 *                         profilePicture:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         location:
 *                           type: string
 *                         expertise:
 *                           type: string
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticate, getStudentProfile);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get the profile of the authenticated user
 *     description: Retrieve the profile information of the currently authenticated user with role-specific data
 *     tags: [User Profile Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     location:
 *                       type: string
 *                     expertise:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/profile", authenticate, async (req: any, res: any) => {
  try {
    const user = req.user;

    // Get user with profile data based on role
    let userProfile;
    if (user.role === 'INSTRUCTOR') {
      userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          instructorProfile: true,
        }
      });
    } else if (user.role === 'STUDENT') {
      userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          studentProfile: true,
        }
      });
    } else {
      userProfile = await prisma.user.findUnique({
        where: { id: user.id }
      });
    }

    if (!userProfile) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Return the user profile data as-is (the include will add the profile relations)
    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /profile/student:
 *   put:
 *     summary: Update student profile
 *     description: Update profile information for authenticated student users
 *     tags: [User Profile Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Student's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Student's last name
 *                 example: "Doe"
 *               phoneNumber:
 *                 type: string
 *                 description: Contact phone number
 *                 example: "+1234567890"
 *               location:
 *                 type: string
 *                 description: Student's location
 *                 example: "New York, USA"
 *               bio:
 *                 type: string
 *                 description: Student biography
 *                 example: "Passionate learner interested in technology"
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *                 description: URL to profile picture
 *                 example: "https://example.com/profile.jpg"
 *     responses:
 *       200:
 *         description: Student profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     location:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       403:
 *         description: Forbidden (user is not a student)
 *       500:
 *         description: Internal server error
 */
router.put("/profile/student", authenticate, updateStudentProfile);

/**
 * @swagger
 * /profile/instructor:
 *   put:
 *     summary: Update instructor profile
 *     description: Update profile information for authenticated instructor users
 *     tags: [User Profile Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Instructor's first name
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 description: Instructor's last name
 *                 example: "Smith"
 *               expertise:
 *                 type: string
 *                 description: Areas of expertise
 *                 example: "Full Stack Development, React, Node.js"
 *               bio:
 *                 type: string
 *                 description: Instructor biography
 *                 example: "Experienced software engineer with 10+ years in web development"
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *                 description: URL to profile picture
 *                 example: "https://example.com/instructor.jpg"
 *     responses:
 *       200:
 *         description: Instructor profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     expertise:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       403:
 *         description: Forbidden (user is not an instructor)
 *       500:
 *         description: Internal server error
 */
router.put("/profile/instructor", authenticate, updateInstructorProfile);

/**
 * @swagger
 * /profile/admin:
 *   put:
 *     summary: Update admin profile
 *     description: Update profile information for authenticated admin users
 *     tags: [User Profile Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: Admin's display name
 *                 example: "Admin User"
 *               phoneNumber:
 *                 type: string
 *                 description: Contact phone number
 *                 example: "+1234567890"
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *                 description: URL to profile picture
 *                 example: "https://example.com/admin.jpg"
 *               permissions:
 *                 type: object
 *                 description: Admin permissions object
 *                 example: {"userManagement": true, "courseApproval": true}
 *     responses:
 *       200:
 *         description: Admin profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                     permissions:
 *                       type: object
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       403:
 *         description: Forbidden (user is not an admin)
 *       500:
 *         description: Internal server error
 */
router.put("/profile/admin", authenticate, updateAdminProfile);

/**
 * @swagger
 * /user/upload-profile-image:
 *   post:
 *     summary: Upload profile image for authenticated user
 *     description: Upload and update profile picture for the authenticated user
 *     tags: [User Profile Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (JPG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile image updated successfully"
 *                 url:
 *                   type: string
 *                   description: URL of the uploaded image
 *       400:
 *         description: Validation error or invalid file type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/upload-profile-image", authenticate, uploadImage, handleUploadError, async (req: any, res: any) => {
  try {
    const user = req.user;

    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    // Update user profile with new image URL based on role
    if (user.role === 'INSTRUCTOR') {
      await prisma.instructorProfile.update({
        where: { userId: user.id },
        data: {
          profilePicture: req.file.path, // Cloudinary URL
        }
      });
    } else if (user.role === 'STUDENT') {
      await prisma.studentProfile.update({
        where: { userId: user.id },
        data: {
          profilePicture: req.file.path, // Cloudinary URL
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      url: req.file.path,
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
