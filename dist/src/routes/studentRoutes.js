import { Router } from 'express';
import { getAllCourses, getCourseBySlug, getCourseCategories, getCourseLevels, 
// getEnrolledCourses,
// enrollInCourse,
// getCourseProgress,
// completeLesson,
getCourseReviews, submitCourseReview,
//   getCourseLessons,
 } from '../controllers/courses/studentController.js';
const router = Router();
/**
 * @swagger
 * tags:
 *   - name: Public - Course Browsing
 *     description: Public access to course information (no authentication required)
 *   - name: Student - Course Enrollment
 *     description: Course enrollment and progress tracking for students
 *   - name: Student - Lesson Progress
 *     description: Lesson completion and progress tracking for enrolled students
 */
// Public routes (no authentication required)
/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all available courses
 *     description: Retrieve a list of all published courses available for enrollment
 *     tags: [Public - Course Browsing]
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Course ID
 *                       title:
 *                         type: string
 *                         description: Course title
 *                       description:
 *                         type: string
 *                         description: Course description
 *                       category:
 *                         type: string
 *                         description: Course category
 *                       level:
 *                         type: string
 *                         description: Course difficulty level
 *                       price:
 *                         type: number
 *                         description: Course price
 *                       currency:
 *                         type: string
 *                         description: Currency code
 *                       duration:
 *                         type: number
 *                         description: Course duration in minutes
 *                       image:
 *                         type: string
 *                         description: Course image URL
 *                       rating:
 *                         type: number
 *                         description: Course rating
 *                       status:
 *                         type: string
 *                         description: Course status
 *                       instructor:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                       totalStudents:
 *                         type: number
 *                         description: Number of enrolled students
 *                       totalLessons:
 *                         type: number
 *                         description: Number of lessons
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/courses', getAllCourses);
/**
 * @swagger
 * /courses/categories:
 *   get:
 *     summary: Get all course categories
 *     description: Retrieve a list of all available course categories
 *     tags: [Public - Course Browsing]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Web Development", "Data Science", "Mobile Development", "DevOps"]
 *       500:
 *         description: Internal server error
 */
router.get('/courses/categories', getCourseCategories);
/**
 * @swagger
 * /courses/levels:
 *   get:
 *     summary: Get all course levels
 *     description: Retrieve a list of all available course difficulty levels
 *     tags: [Public - Course Browsing]
 *     responses:
 *       200:
 *         description: Levels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Beginner", "Intermediate", "Advanced"]
 *       500:
 *         description: Internal server error
 */
router.get('/courses/levels', getCourseLevels);
/**
 * @swagger
 * /courses/{courseId}:
 *   get:
 *     summary: Get course details by ID or slug
 *     description: Retrieve detailed information about a specific course including curriculum and instructor details. Supports both UUID and URL-friendly slug formats.
 *     tags: [Public - Course Browsing]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID (UUID) or course slug (URL-friendly title)
 *     responses:
 *       200:
 *         description: Course details retrieved successfully
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
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     category:
 *                       type: string
 *                     level:
 *                       type: string
 *                     price:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     duration:
 *                       type: number
 *                     image:
 *                       type: string
 *                     instructor:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         bio:
 *                           type: string
 *                         expertise:
 *                           type: string
 *                         profilePicture:
 *                           type: string
 *                     curriculum:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           position:
 *                             type: number
 *                           lessons:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 title:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *                                 isPreview:
 *                                   type: boolean
 *                                 position:
 *                                   type: number
 *                                 duration:
 *                                   type: number
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.get('/courses/:courseId', getCourseBySlug);
/**
 * @swagger
 * /courses/{courseId}/reviews:
 *   get:
 *     summary: Get course reviews
 *     description: Retrieve all reviews for a specific course (public access)
 *     tags: [Public - Course Browsing]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       rating:
 *                         type: number
 *                         minimum: 1
 *                         maximum: 5
 *                       comment:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       authorName:
 *                         type: string
 *                       authorProfilePicture:
 *                         type: string
 *                 averageRating:
 *                   type: number
 *                   description: Average rating for the course
 *                 totalReviews:
 *                   type: number
 *                   description: Total number of reviews
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.get('/courses/:courseId/reviews', getCourseReviews);
// // Protected routes (authentication required)
// router.use(authenticate); // All routes below require authentication
/**
 * @swagger
 * /student/courses/{courseId}/reviews:
 *   post:
 *     summary: Submit a review for a course
 *     description: Allows enrolled students to submit reviews for courses they are enrolled in
 *     tags: [Student - Course Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional review comment
 *     responses:
 *       201:
 *         description: Review submitted successfully
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
 *                   example: "Review submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     comment:
 *                       type: string
 *                     courseId:
 *                       type: string
 *                     authorId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or already reviewed
 *       403:
 *         description: Not enrolled in course or not a student
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.post('/student/courses/:courseId/reviews', submitCourseReview);
// Student-only routes (authentication required)
// router.use(authenticate); // All routes below require authentication
// router.get('/student/courses', getEnrolledCourses);
// router.post('/courses/:courseId/enroll', enrollInCourse);
// router.get('/student/courses/:courseId/progress', getCourseProgress);
// router.get('/courses/:courseId/lessons', getCourseLessons);
// router.put('/student/courses/:courseId/lessons/:lessonId/complete', completeLesson);
export default router;
//# sourceMappingURL=studentRoutes.js.map