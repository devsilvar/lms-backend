import { Router } from "express";
import { authorizeRoles } from "../middlewares/roleMiddlewares.js";
import {
  createCourse,
  deleteCourse,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  attachLessonsToCurriculum,
  detachLessonsFromCurriculum,
  createLesson,
  createQuiz,
  addQuestionToQuiz,
  reviewCourse,
  instructorReviewCourse,
  getMyCourses,
  getPrivateCourseById,
  updateCourse,
  getCourseCurriculums,
  getCourseLessons,
  updateLesson,
  deleteLesson,
  updateQuiz,
  deleteQuiz,
  getQuizQuestions,
  updateQuestion,
  deleteQuestion,
  getCourseAnalytics,
  getCourseQuizzes,
  getCourseReviews,
} from '../controllers/courses/instructorControllers.js';
import { authenticate } from "../middlewares/authMiddleware.js";
import { uploadImage, uploadLessonFiles, handleUploadError } from "../middlewares/uploadMiddleware.js";
import { uploadVideo } from "../middlewares/uploadMiddleware.js";
import prisma from '../config/db.js';
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Instructor - Course Management
 *     description: Course creation, management, and analytics for instructors
 *   - name: Instructor - Quiz Management
 *     description: Quiz and question management for instructors
 *   - name: Instructor - Lesson Management
 *     description: Lesson and curriculum management for instructors
 *   - name: Instructor - Question Management
 *     description: Question management within quizzes for instructors
 *
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Course ID
 *         title:
 *           type: string
 *           description: Course title
 *         description:
 *           type: string
 *           description: Course description
 *         category:
 *           type: string
 *           description: Course category
 *         level:
 *           type: string
 *           description: Course level (beginner, intermediate, advanced)
 *         price:
 *           type: number
 *           description: Course price
 *         currency:
 *           type: string
 *           description: Currency code
 *         duration:
 *           type: number
 *           description: Course duration in minutes
 *         image:
 *           type: string
 *           description: Course image URL
 *         status:
 *           type: string
 *           enum: [DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, ARCHIVED]
 *           description: Course status
 *         rating:
 *           type: number
 *           description: Course rating
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Course tags
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// All instructor routes require authentication


/**
 * @swagger
 * /api/instructor/courses:
 *   get:
 *     summary: Get instructor's courses
 *     description: Retrieve all courses created by the authenticated instructor or all courses if admin
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
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
 *                 total:
 *                   type: number
 *                   description: Total number of courses
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
 *                         description: Course level
 *                       price:
 *                         type: number
 *                         description: Course price
 *                       duration:
 *                         type: number
 *                         description: Course duration
 *                       image:
 *                         type: string
 *                         description: Course image URL
 *                       status:
 *                         type: string
 *                         description: Course status
 *                       rating:
 *                         type: number
 *                         description: Course rating
 *                       totalStudents:
 *                         type: number
 *                         description: Number of enrolled students
 *                       totalReviews:
 *                         type: number
 *                         description: Number of reviews
 *                       totalLessons:
 *                         type: number
 *                         description: Number of lessons
 *                       recentReviews:
 *                         type: array
 *                         description: Recent course reviews
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/instructor/courses', authenticate  , getMyCourses as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}:
 *   get:
 *     summary: Get specific course details
 *     description: Retrieve detailed information about a specific course (private view for instructors)
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.get('/instructor/courses/:courseId', authenticate ,getPrivateCourseById as any);

/**
 * @swagger
 * /api/instructor/courses:
 *   post:
 *     summary: Create a new course
 *     description: Allows instructors and admins to create new courses
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 description: Course title
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 description: Course description
 *               category:
 *                 type: string
 *                 description: Course category
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 description: Course difficulty level
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 description: Course price
 *               currency:
 *                 type: string
 *                 default: "NGN"
 *                 description: Currency code
 *               duration:
 *                 type: number
 *                 description: Course duration in minutes
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: Course image URL
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Course tags for better searchability
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, ARCHIVED]
 *                 description: Course status
 *     responses:
 *       201:
 *         description: Course created successfully
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
 *                   example: "Course created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/courses',authenticate ,uploadImage, handleUploadError, createCourse as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}:
 *   put:
 *     summary: Update course details
 *     description: Update course information for authorized instructors
 *     tags: [Instructor - Course Management]
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
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 description: Course title
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 description: Course description
 *               category:
 *                 type: string
 *                 description: Course category
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 description: Course difficulty level
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Course price
 *               currency:
 *                 type: string
 *                 description: Currency code
 *               duration:
 *                 type: number
 *                 description: Course duration in minutes
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: Course image URL
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Course tags
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, ARCHIVED]
 *                 description: Course status
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.put('/instructor/courses/:courseId',authenticate  , updateCourse as any);

/**
 * @swagger
 * /api/courses/{courseId}/image:
 *   put:
 *     summary: Update course image
 *     description: Update the image for an existing course
 *     tags: [Instructor - Course Management]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (JPG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Image updated successfully
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
 *                   example: "Image updated successfully"
 *                 url:
 *                   type: string
 *                   description: URL of the updated image
 *       400:
 *         description: Invalid file or validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.put('/courses/:courseId/image', authenticate, uploadImage, handleUploadError, async (req: any, res: any) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can update course images.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId: user.id }
      });
      if (!course) {
        return res.status(403).json({
          error: 'Access denied. You do not own this course.'
        });
      }
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    // Update course with new image URL
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        image: req.file.path // Cloudinary URL
      }
    });

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      url: updatedCourse.image
    });
  } catch (error) {
    console.error('Error updating course image:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/instructor/courses/{courseId}:
 *   delete:
 *     summary: Delete a course
 *     description: Delete a course and all its associated content (lessons, quizzes, etc.)
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.delete('/instructor/courses/:courseId',authenticate  , deleteCourse as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/curriculum:
 *   post:
 *     summary: Create a curriculum for a course
 *     description: Create a new curriculum section within a course
 *     tags: [Instructor - Lesson Management]
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
 *               - title
 *               - position
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Curriculum title
 *               description:
 *                 type: string
 *                 description: Curriculum description
 *               position:
 *                 type: number
 *                 minimum: 0
 *                 description: Curriculum position/order
 *     responses:
 *       201:
 *         description: Curriculum created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/courses/:courseId/curriculum', authenticate ,createCurriculum as any);

/**
 * @swagger
 * /instructor/courses/{courseId}/curriculum/{curriculumId}/lessons:
 *   post:
 *     summary: Attach lessons to a curriculum
 *     description: Attach existing lessons to a specific curriculum
 *     tags: [Instructor - Lesson Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: curriculumId
 *         required: true
 *         schema:
 *           type: string
 *         description: Curriculum ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonIds
 *             properties:
 *               lessonIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of lesson IDs to attach to the curriculum
 *     responses:
 *       200:
 *         description: Lessons attached successfully
 *       400:
 *         description: Validation error or lessons don't belong to course
 *       403:
 *         description: Access denied
 *       404:
 *         description: Curriculum not found
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/courses/:courseId/curriculum/:curriculumId/lessons', authenticate, attachLessonsToCurriculum as any);

/**
 * @swagger
 * /instructor/courses/{courseId}/curriculum/{curriculumId}/lessons:
 *   delete:
 *     summary: Detach lessons from a curriculum
 *     description: Remove lessons from a specific curriculum
 *     tags: [Instructor - Lesson Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: curriculumId
 *         required: true
 *         schema:
 *           type: string
 *         description: Curriculum ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonIds
 *             properties:
 *               lessonIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of lesson IDs to detach from the curriculum
 *     responses:
 *       200:
 *         description: Lessons detached successfully
 *       400:
 *         description: Validation error or lessons don't belong to curriculum
 *       403:
 *         description: Access denied
 *       404:
 *         description: Curriculum not found
 *       500:
 *         description: Internal server error
 */
router.delete('/instructor/courses/:courseId/curriculum/:curriculumId/lessons', authenticate, detachLessonsFromCurriculum as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/lessons:
 *   post:
 *     summary: Create a lesson for a course
 *     description: Create a new lesson for a specific course (optionally under a curriculum)
 *     tags: [Instructor - Lesson Management]
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
 *               - title
 *               - position
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Lesson title
 *               content:
 *                 type: string
 *                 description: Lesson content (markdown)
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *                 description: Video URL
 *               docUrl:
 *                 type: string
 *                 format: uri
 *                 description: Document URL
 *               duration:
 *                 type: number
 *                 description: Lesson duration in minutes
 *               type:
 *                 type: string
 *                 enum: [VIDEO, ARTICLE, QUIZ]
 *                 default: ARTICLE
 *                 description: Lesson type
 *               isPreview:
 *                 type: boolean
 *                 default: false
 *                 description: Whether lesson is a preview
 *               position:
 *                 type: number
 *                 minimum: 0
 *                 description: Lesson position/order
 *               curriculumId:
 *                 type: string
 *                 description: Curriculum ID (optional)
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/courses/:courseId/lessons',authenticate  , uploadLessonFiles, handleUploadError, createLesson as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/lessons/upload-video:
 *   post:
 *     summary: Upload video for lesson creation
 *     description: Upload a video file that can be used when creating a lesson
 *     tags: [Instructor - Lesson Management]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file to upload (MP4, AVI, MOV, MKV, WEBM)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
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
 *                   example: "Video uploaded successfully"
 *                 url:
 *                   type: string
 *                   description: Cloudinary URL of uploaded video
 *       400:
 *         description: Validation error or invalid file type
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/courses/:courseId/lessons/upload-video', authenticate, uploadVideo, handleUploadError, async (req: any, res: any) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can upload videos.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId: user.id }
      });
      if (!course) {
        return res.status(403).json({
          error: 'Access denied. You do not own this course.'
        });
      }
    }

    // Check if video file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No video file provided'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      url: req.file.path // Cloudinary URL
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/instructor/courses/{courseId}/lessons/{lessonId}/upload:
 *   post:
 *     summary: Upload video for an existing lesson
 *     description: Upload or update video file for a specific lesson
 *     tags: [Instructor - Lesson Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file to upload (MP4, AVI, MOV, MKV, WEBM)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
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
 *                   example: "Video uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     videoUrl:
 *                       type: string
 *                       description: Cloudinary URL of uploaded video
 *       400:
 *         description: Validation error or invalid file type
 *       403:
 *         description: Access denied
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/courses/:courseId/lessons/:lessonId/upload', authenticate, uploadVideo, handleUploadError, async (req: any, res: any) => {
  try {
    const { courseId, lessonId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can upload lesson videos.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId: user.id }
      });
      if (!course) {
        return res.status(403).json({
          error: 'Access denied. You do not own this course.'
        });
      }
    }

    // Check if lesson exists and belongs to the course
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId }
    });

    if (!lesson) {
      return res.status(404).json({
        error: 'Lesson not found in this course'
      });
    }

    // Check if video file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No video file provided'
      });
    }

    // Update lesson with new video URL
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoUrl: req.file.path, // Cloudinary URL
        type: req.file.mimetype.startsWith('video/') ? 'VIDEO' : lesson.type
      }
    });

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        id: updatedLesson.id,
        videoUrl: updatedLesson.videoUrl,
        type: updatedLesson.type
      }
    });
  } catch (error) {
    console.error('Error uploading lesson video:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}:
 *   put:
 *     summary: Update lesson details
 *     description: Update lesson information and handle position reordering
 *     tags: [Instructor - Lesson Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Lesson title
 *               content:
 *                 type: string
 *                 description: Lesson content
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *                 description: Video URL
 *               docUrl:
 *                 type: string
 *                 format: uri
 *                 description: Document URL
 *               duration:
 *                 type: number
 *                 description: Lesson duration
 *               type:
 *                 type: string
 *                 enum: [VIDEO, ARTICLE, QUIZ]
 *                 description: Lesson type
 *               isPreview:
 *                 type: boolean
 *                 description: Whether lesson is a preview
 *               position:
 *                 type: number
 *                 minimum: 0
 *                 description: New lesson position (triggers reordering)
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Internal server error
 */
router.put('/courses/:courseId/lessons/:lessonId', authenticate ,updateLesson as any);

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}:
 *   put:
 *     summary: Update lesson details
 *     description: Update lesson information and handle position reordering
 *     tags: [Instructor - Lesson Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Lesson title
 *               content:
 *                 type: string
 *                 description: Lesson content
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *                 description: Video URL
 *               docUrl:
 *                 type: string
 *                 format: uri
 *                 description: Document URL
 *               duration:
 *                 type: number
 *                 description: Lesson duration
 *               type:
 *                 type: string
 *                 enum: [VIDEO, ARTICLE, QUIZ]
 *                 description: Lesson type
 *               isPreview:
 *                 type: boolean
 *                 description: Whether lesson is a preview
 *               position:
 *                 type: number
 *                 minimum: 0
 *                 description: New lesson position (triggers reordering)
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Internal server error
 */
router.put('/courses/:courseId/lessons/:lessonId', authenticate, updateLesson as any);

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}:
 *   delete:
 *     summary: Delete a lesson
 *     description: Delete a lesson and reorder remaining lessons automatically
 *     tags: [Instructor - Lesson Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Lesson deleted successfully and positions reordered
 *       403:
 *         description: Access denied
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Internal server error
 */
router.delete('/courses/:courseId/lessons/:lessonId', authenticate, deleteLesson as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/quizzes:
 *   get:
 *     summary: Get all quizzes for a course
 *     description: Retrieve all quizzes associated with a specific course
 *     tags: [Instructor - Quiz Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Quizzes retrieved successfully
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
 *                       title:
 *                         type: string
 *                       courseId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       _count:
 *                         type: object
 *                         properties:
 *                           questions:
 *                             type: number
 *                           attempts:
 *                             type: number
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.get('/instructor/courses/:courseId/quizzes', authenticate, getCourseQuizzes as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/quizzes:
 *   post:
 *     summary: Create a quiz for a course
 *     description: Create a new quiz associated with a specific course
 *     tags: [Instructor - Quiz Management]
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Quiz title
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/courses/:courseId/quizzes', authenticate ,createQuiz as any);

/**
 * @swagger
 * /api/courses/{courseId}/quizzes/{quizId}:
 *   put:
 *     summary: Update quiz details
 *     description: Update quiz information for authorized instructors
 *     tags: [Instructor - Quiz Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Quiz title
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.put('/courses/:courseId/quizzes/:quizId',authenticate  ,updateQuiz as any);

/**
 * @swagger
 * /api/courses/{courseId}/quizzes/{quizId}:
 *   delete:
 *     summary: Delete a quiz
 *     description: Delete a quiz and all its associated questions
 *     tags: [Instructor - Quiz Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.delete('/courses/:courseId/quizzes/:quizId',authenticate , deleteQuiz as any);

/**
 * @swagger
 * /api/instructor/quizzes/{quizId}/questions:
 *   post:
 *     summary: Add a question to a quiz
 *     description: Add a new question to an existing quiz
 *     tags: [Instructor - Question Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - type
 *               - correctAnswer
 *             properties:
 *               text:
 *                 type: string
 *                 description: Question text
 *               type:
 *                 type: string
 *                 enum: [MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER]
 *                 description: Question type
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Answer options (required for MULTIPLE_CHOICE)
 *               correctAnswer:
 *                 type: string
 *                 description: Correct answer
 *     responses:
 *       201:
 *         description: Question added successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/quizzes/:quizId/questions', authenticate , addQuestionToQuiz as any);

/**
 * @swagger
 * /api/quizzes/{quizId}/questions:
 *   get:
 *     summary: Get quiz questions
 *     description: Retrieve all questions for a specific quiz
 *     tags: [Instructor - Question Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
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
 *                       text:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER]
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                       correctAnswer:
 *                         type: string
 *                       position:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.get('/quizzes/:quizId/questions',authenticate, getQuizQuestions as any);

/**
 * @swagger
 * /api/questions/{questionId}:
 *   put:
 *     summary: Update question details
 *     description: Update question information for authorized instructors
 *     tags: [Instructor - Question Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - type
 *               - correctAnswer
 *             properties:
 *               text:
 *                 type: string
 *                 description: Question text
 *               type:
 *                 type: string
 *                 enum: [MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER]
 *                 description: Question type
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Answer options
 *               correctAnswer:
 *                 type: string
 *                 description: Correct answer
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.put('/questions/:questionId', authenticate ,updateQuestion as any);

/**
 * @swagger
 * /api/questions/{questionId}:
 *   delete:
 *     summary: Delete a question
 *     description: Delete a question from a quiz
 *     tags: [Instructor - Question Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.delete('/questions/:questionId', authenticate, deleteQuestion as any);

// Analytics
router.get('/instructor/courses/:courseId/analytics', authenticate , getCourseAnalytics as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/curriculum:
 *   get:
 *     summary: Get course curriculums
 *     description: Retrieve all curriculums for a specific course
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Curriculums retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/instructor/courses/:courseId/curriculum', authenticate, getCourseCurriculums as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/curriculum/{curriculumId}:
 *   put:
 *     summary: Update curriculum section
 *     description: Update curriculum section details for authorized instructors
 *     tags: [Instructor - Lesson Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: curriculumId
 *         required: true
 *         schema:
 *           type: string
 *         description: Curriculum ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Curriculum title
 *               description:
 *                 type: string
 *                 description: Curriculum description
 *               position:
 *                 type: number
 *                 minimum: 0
 *                 description: Curriculum position/order
 *     responses:
 *       200:
 *         description: Curriculum updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Curriculum not found
 *       500:
 *         description: Internal server error
 */
router.put('/instructor/courses/:courseId/curriculum/:curriculumId', authenticate, updateCurriculum as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/curriculum/{curriculumId}:
 *   delete:
 *     summary: Delete curriculum section
 *     description: Delete a curriculum section and reorder remaining sections automatically
 *     tags: [Instructor - Lesson Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: curriculumId
 *         required: true
 *         schema:
 *           type: string
 *         description: Curriculum ID
 *     responses:
 *       200:
 *         description: Curriculum deleted successfully and positions reordered
 *       400:
 *         description: Cannot delete curriculum with existing lessons
 *       403:
 *         description: Access denied
 *       404:
 *         description: Curriculum not found
 *       500:
 *         description: Internal server error
 */
router.delete('/instructor/courses/:courseId/curriculum/:curriculumId', authenticate, deleteCurriculum as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/lessons:
 *   get:
 *     summary: Get course lessons
 *     description: Retrieve all lessons for a specific course
 *     tags: [Instructor - Lesson Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Lessons retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/instructor/courses/:courseId/lessons', authenticate, getCourseLessons as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/reviews:
 *   get:
 *     summary: Get course reviews
 *     description: Retrieve all reviews for a specific course (for instructors to see feedback)
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
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
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   rating:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *                   comment:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   author:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.get('/instructor/courses/:courseId/reviews', authenticate, getCourseReviews as any);

/**
 * @swagger
 * /instructor/courses/{courseId}/reviews:
 *   post:
 *     summary: Submit a review for a course (by instructor)
 *     description: Allows instructors to submit reviews for courses they didn't create
 *     tags: [Instructor - Course Management]
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
 *         description: Validation error or already reviewed or own course
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/courses/:courseId/reviews', authenticate, instructorReviewCourse as any);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/whoFor:
 *   post:
 *     summary: Add items to "Who this course is for" field
 *     description: Allows instructors and admins to add items to the whoFor array for a course
 *     tags: [Instructor - Course Management]
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
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of strings to add to whoFor field
 *     responses:
 *       200:
 *         description: Items added successfully
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
 *                   example: "Items added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     whoFor:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.post('/instructor/courses/:courseId/whoFor', authenticate, async (req: any, res: any) => {
  try {
    const { courseId } = req.params;
    const { items } = req.body;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can manage course fields.'
      });
    }

    // Validate input
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Items must be a non-empty array of strings'
      });
    }

    // Check if course exists and user has permission
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(user.role === 'INSTRUCTOR' ? { instructorId: user.id } : {})
      }
    });

    if (!course) {
      return res.status(404).json({
        error: 'Course not found or access denied'
      });
    }

    // Add new items to existing targetAudience array (avoid duplicates)
    const currentTargetAudience = course.targetAudience || [];
    const newItems = items.filter((item: string) => !currentTargetAudience.includes(item));
    const updatedTargetAudience = [...currentTargetAudience, ...newItems];

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        targetAudience: updatedTargetAudience
      }
    });

    res.status(200).json({
      success: true,
      message: 'Items added successfully',
      data: {
        targetAudience: updatedCourse.targetAudience
      }
    });
  } catch (error) {
    console.error('Error adding whoFor items:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/instructor/courses/{courseId}/whoFor/{index}:
 *   delete:
 *     summary: Remove an item from "Who this course is for" field
 *     description: Allows instructors and admins to remove a specific item from the whoFor array
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *         description: Index of the item to remove
 *     responses:
 *       200:
 *         description: Item removed successfully
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
 *                   example: "Item removed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     whoFor:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid index
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.delete('/instructor/courses/:courseId/whoFor/:index', authenticate, async (req: any, res: any) => {
  try {
    const { courseId, index } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can manage course fields.'
      });
    }

    const itemIndex = parseInt(index);
    if (isNaN(itemIndex) || itemIndex < 0) {
      return res.status(400).json({
        error: 'Invalid index provided'
      });
    }

    // Check if course exists and user has permission
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(user.role === 'INSTRUCTOR' ? { instructorId: user.id } : {})
      }
    });

    if (!course) {
      return res.status(404).json({
        error: 'Course not found or access denied'
      });
    }

    const currentTargetAudience = course.targetAudience || [];
    if (itemIndex >= currentTargetAudience.length) {
      return res.status(400).json({
        error: 'Index out of range'
      });
    }

    // Remove item at specified index
    const updatedTargetAudience = currentTargetAudience.filter((_, i) => i !== itemIndex);

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        targetAudience: updatedTargetAudience
      }
    });

    res.status(200).json({
      success: true,
      message: 'Item removed successfully',
      data: {
        targetAudience: updatedCourse.targetAudience
      }
    });
  } catch (error) {
    console.error('Error removing whoFor item:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/instructor/courses/{courseId}/whoFor:
 *   put:
 *     summary: Update "Who this course is for" field
 *     description: Allows instructors and admins to completely replace the whoFor array
 *     tags: [Instructor - Course Management]
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
 *               - whoFor
 *             properties:
 *               whoFor:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of strings for whoFor field
 *     responses:
 *       200:
 *         description: Field updated successfully
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
 *                   example: "Field updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     whoFor:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.put('/instructor/courses/:courseId/whoFor', authenticate, async (req: any, res: any) => {
  try {
    const { courseId } = req.params;
    const { targetAudience } = req.body;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can manage course fields.'
      });
    }

    // Validate input
    if (!Array.isArray(targetAudience)) {
      return res.status(400).json({
        error: 'targetAudience must be an array of strings'
      });
    }

    // Check if course exists and user has permission
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(user.role === 'INSTRUCTOR' ? { instructorId: user.id } : {})
      }
    });

    if (!course) {
      return res.status(404).json({
        error: 'Course not found or access denied'
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        targetAudience: targetAudience
      }
    });

    res.status(200).json({
      success: true,
      message: 'Field updated successfully',
      data: {
        targetAudience: updatedCourse.targetAudience
      }
    });
  } catch (error) {
    console.error('Error updating whoFor field:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Edit a review
 *     description: Allows review authors, course instructors, and admins to edit a review
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               title:
 *                 type: string
 *                 description: Review title/summary
 *               body:
 *                 type: string
 *                 description: Review content
 *     responses:
 *       200:
 *         description: Review updated successfully
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
 *                   example: "Review updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     title:
 *                       type: string
 *                     body:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.put('/reviews/:reviewId', authenticate, async (req: any, res: any) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN' && user.role !== 'STUDENT')) {
      return res.status(403).json({
        error: 'Access denied.'
      });
    }

    // Find the review with course information
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        course: true,
        author: true
      }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    // Check permissions
    const isAuthor = review.authorId === user.id;
    const isInstructor = review.course.instructorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isAuthor && !isInstructor && !isAdmin) {
      return res.status(403).json({
        error: 'Access denied. You can only edit your own reviews or reviews for your courses.'
      });
    }

    // Students can only edit their own reviews
    if (user.role === 'STUDENT' && !isAuthor) {
      return res.status(403).json({
        error: 'Access denied. Students can only edit their own reviews.'
      });
    }

    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    if (comment && comment.trim().length === 0) {
      return res.status(400).json({
        error: 'Review comment cannot be empty'
      });
    }

    // Update the review
    const updateData: any = {
      updatedAt: new Date()
    };

    if (rating) updateData.rating = parseInt(rating);
    if (title !== undefined) updateData.title = title?.trim() ? (title.trim() || null) : null;
    if (comment !== undefined) updateData.comment = comment.trim() || null;

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            studentProfile: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    // Update course rating
    const allReviews = await prisma.review.findMany({
      where: { courseId: review.courseId },
      select: { rating: true },
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.course.update({
      where: { id: review.courseId },
      data: { rating: averageRating },
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: {
        ...updatedReview,
        authorName: updatedReview.author.studentProfile ?
          `${updatedReview.author.studentProfile.firstName} ${updatedReview.author.studentProfile.lastName}`.trim() :
          'Anonymous',
        authorProfilePicture: updatedReview.author.studentProfile?.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     description: Allows review authors, course instructors, and admins to delete a review
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
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
 *                   example: "Review deleted successfully"
 *       403:
 *         description: Access denied
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.delete('/reviews/:reviewId', authenticate, async (req: any, res: any) => {
  try {
    const { reviewId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN' && user.role !== 'STUDENT')) {
      return res.status(403).json({
        error: 'Access denied.'
      });
    }

    // Find the review with course information
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        course: true,
        author: true
      }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    // Check permissions
    const isAuthor = review.authorId === user.id;
    const isInstructor = review.course.instructorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isAuthor && !isInstructor && !isAdmin) {
      return res.status(403).json({
        error: 'Access denied. You can only delete your own reviews or reviews for your courses.'
      });
    }

    // Students can only delete their own reviews
    if (user.role === 'STUDENT' && !isAuthor) {
      return res.status(403).json({
        error: 'Access denied. Students can only delete their own reviews.'
      });
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId }
    });

    // Update course rating
    const remainingReviews = await prisma.review.findMany({
      where: { courseId: review.courseId },
      select: { rating: true },
    });

    const averageRating = remainingReviews.length > 0
      ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length
      : 0;

    await prisma.course.update({
      where: { id: review.courseId },
      data: { rating: averageRating },
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}/reply:
 *   post:
 *     summary: Reply to a review
 *     description: Allows course instructors and admins to reply to a review
 *     tags: [Instructor - Course Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 description: Reply content
 *     responses:
 *       200:
 *         description: Reply added successfully
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
 *                   example: "Reply added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     reply:
 *                       type: string
 *                     repliedBy:
 *                       type: string
 *                     repliedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or reply already exists
 *       403:
 *         description: Access denied
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.post('/reviews/:reviewId/reply', authenticate, async (req: any, res: any) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can reply to reviews.'
      });
    }

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        error: 'Reply content is required'
      });
    }

    // Find the review with course information
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        course: true
      }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    // Check if user is the course instructor or admin
    const isInstructor = review.course.instructorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        error: 'Access denied. You can only reply to reviews for your courses.'
      });
    }

    // Check if reply already exists
    if (review.reply) {
      return res.status(400).json({
        error: 'Reply already exists for this review'
      });
    }

    // Add reply to the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply: reply.trim(),
        repliedBy: user.id,
        repliedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            studentProfile: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      data: {
        ...updatedReview,
        authorName: updatedReview.author.studentProfile ?
          `${updatedReview.author.studentProfile.firstName} ${updatedReview.author.studentProfile.lastName}`.trim() :
          'Anonymous',
        authorProfilePicture: updatedReview.author.studentProfile?.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error adding reply to review:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
