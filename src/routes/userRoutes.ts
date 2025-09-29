import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { getStudentProfile, updateAdminProfile, updateInstructorProfile, updateStudentProfile } from "../controllers/userController.js";

const router = Router();

/**
 * @openapi
 * /profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get the profile of the authenticated student
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched student profile
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       404:
 *         description: User not found
 */
router.get("/", authenticate, getStudentProfile);

/**
 * @openapi
 * /profile/student:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update student profile
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
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               location:
 *                 type: string
 *               bio:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Student profile updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a student)
 */
router.put("/profile/student", authenticate, updateStudentProfile);

/**
 * @openapi
 * /profile/instructor:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update instructor profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expertise:
 *                 type: string
 *               bio:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Instructor profile updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an instructor)
 */
router.put("/profile/instructor", authenticate, updateInstructorProfile);

/**
 * @openapi
 * /profile/admin:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update admin profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Admin profile updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 */
router.put("/profile/admin", authenticate, updateAdminProfile);

export default router;
