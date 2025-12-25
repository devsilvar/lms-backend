import { Request, Response } from 'express';
import prisma from '../../config/db.js';
import { z } from 'zod'; 
import { checkCourseOwnership } from './utils/checkOwnership.js';
import { handlePrismaError } from '../../lib/prismaError.js';

// Assuming you are using Zod for validation.
// Define the validation schema for the request body


const createCourseSchema = z.object({
  title: z.string().min(3, "Course title must be at least 3 characters"),
  description: z.string().min(10, "Course description must be at least 10 characters"),
  category: z.string().optional(),
  price: z.number().nonnegative().default(0),
  currency: z.string().default("NGN"),
  duration: z.number().int().positive().optional(), // minutes/hours
  image: z.string().url().optional(),
  tags: z.array(z.string()).default([]), // Course tags for better searchability
  targetAudience: z.array(z.string()).default([]), // Who this course is for
  learningOutcomes: z.array(z.string()).default([]), // What students will learn
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "ARCHIVED"]).optional(),
});

//create curiculum schema
const createCurriculumSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  position: z.number().int().min(0),
  lessonIds: z.array(z.string()).default([]), // Optional lesson IDs to attach to curriculum
});

//update curriculum schema
const updateCurriculumSchema = createCurriculumSchema.partial();

// Schema for attaching/detaching lessons from curriculum
const manageCurriculumLessonsSchema = z.object({
  lessonIds: z.array(z.string()).min(1, "At least one lesson ID is required"),
});

//create lesson schema
const createLessonSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().optional(),
  videoUrl: z.union([z.string().url(), z.string().length(0), z.undefined()]).optional().transform(val => val === "" ? undefined : val),
  docUrl: z.union([z.string().url(), z.string().length(0), z.undefined()]).optional().transform(val => val === "" ? undefined : val),
  duration: z.number().int().min(1).optional(), // in minutes - optional
  type: z.enum(['VIDEO', 'ARTICLE', 'QUIZ']).default('ARTICLE'),
  isPreview: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
  curriculumId: z.string().optional(),
});


export const updateLessonSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().optional(),
  videoUrl: z.union([z.string().url(), z.string().length(0), z.undefined()]).optional().transform(val => val === "" ? undefined : val),
  docUrl: z.union([z.string().url(), z.string().length(0), z.undefined()]).optional().transform(val => val === "" ? undefined : val),
  duration: z.number().int().min(1).optional(), // in minutes - optional
  type: z.enum(['VIDEO', 'ARTICLE', 'QUIZ']).optional(),
  isPreview: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
  curriculumId: z.string().optional(),
});

//create quiz schema
const createQuizSchema = z.object({
  title: z.string().min(1).max(100),

});


//add question to quiz schema
const addQuestionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
  options: z.array(z.string()).default([]), // Default to empty array for schema compatibility
  correctAnswer: z.union([z.string(), z.number(), z.boolean()]),
}).superRefine(({ type, options, correctAnswer }, ctx) => {
  let correctStr = String(correctAnswer); // Normalize to string for storage
  if (type === 'MULTIPLE_CHOICE') {
    if (options.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least 2 options required for multiple choice.' });
    }
    if (!options.includes(correctStr)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Correct answer must match one of the options.' });
    }
  } else if (type === 'TRUE_FALSE') {
    if (correctStr !== 'true' && correctStr !== 'false') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Correct answer must be "true" or "false".' });
    }
  } // Add similar for SHORT_ANSWER if needed
});

//review course schema
const reviewCourseSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(500).optional(),
});

// Instructor review schema (same as student but for instructors)
const instructorReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(500).optional(),
});

// Extend the Request interface to include user property and files
interface UserRequest extends Request {
  user?: {
    id: string;
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  };
  files?: {
    [fieldname: string]: Express.Multer.File[];
  } | Express.Multer.File[];
}





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
 *                 description: Course duration in minutes/hours
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: Course image URL
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
export const createCourse = async (req: UserRequest, res: Response) => {
  try {
    // 1. Handle image upload if provided
    let imageUrl = req.body.image; // Direct URL or uploaded file

    if (req.file && req.file.path) {
      imageUrl = req.file.path; // Use uploaded image URL from Cloudinary
    }

    // 2. Validate input with processed image URL
    const { title, description, category, price, currency, duration, status, tags, targetAudience, learningOutcomes } =
      createCourseSchema.parse({
        ...req.body,
        image: imageUrl
      });

    // 3. Get user from request (populated by auth middleware)
    const user = req.user;

    // 4. Check authorization
    if (!user || (user.role !== "INSTRUCTOR" && user.role !== "ADMIN")) {
      return res.status(403).json({
        error: "Access denied. Only instructors or admins can create courses.",
      });
    }

    // 5. Create course in DB
    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        category,
        price,
        currency,
        duration,
        image: imageUrl,
        tags: tags || [], // Include tags in course creation
        targetAudience: targetAudience || [], // Who this course is for
        learningOutcomes: learningOutcomes || [], // What students will learn
        status: status || "DRAFT", // default
        instructor: { connect: { id: user.id } },
      },
    });

    // 6. Return success response
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation Error", details: err.issues });
    }
    console.error("Error creating course:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





/**
 * [INSTRUCTOR or ADMIN] Delete a course.
 * @route DELETE /api/instructor/courses/:courseId
 */
export const deleteCourse = async (req: UserRequest, res: Response) => {
  const { courseId } = req.params;
  const user = req.user;

  try {
    // Authorization check
    if (!user || (user.role !== "INSTRUCTOR" && user.role !== "ADMIN")) {
      return res.status(403).json({ 
        error: "Access denied. Only instructors or admins can delete courses." 
      });
    }

    // Ownership check for instructors
    if (user.role === "INSTRUCTOR") {
      await checkCourseOwnership(courseId, user); 
    }

    // Delete the course (cascade handles children automatically)
    const deletedCourse = await prisma.course.delete({
      where: { id: courseId },
    });

    return res.status(200).json({ 
      message: "Course deleted successfully", 
      course: deletedCourse 
    });
  } catch (err: any) {
    console.error("Error deleting course:", err);

    // Handle Prisma-specific errors
    return handlePrismaError(err, res, "DeleteCourse");
  }
};



/**
 * [INSTRUCTOR ONLY] Create a curriculum for a course.
 * @route POST /api/instructor/courses/:courseId/curriculum
 */
export const createCurriculum = async (req: UserRequest, res: Response) => {
  // Check authorization - only instructors and admins can create curricula
  const user = req.user;
  if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
    return res.status(403).json({
      error: 'Access denied. Only instructors or admins can create curricula.'
    });
  }

  //get the course id and content you are dealing with
  const { courseId } = req.params;
  const validatedData = createCurriculumSchema.parse(req.body);
  const { title, description, position, lessonIds } = validatedData;

  await checkCourseOwnership(courseId, user);

  try {
    // Create curriculum first
    const curriculum = await prisma.curriculum.create({
      data: {
        title,
        description,
        position,
        course: { connect: { id: courseId } },
      },
    });

    // If lesson IDs are provided, attach them to the curriculum
    if (lessonIds && lessonIds.length > 0) {
      // Verify all lessons belong to the same course
      const lessons = await prisma.lesson.findMany({
        where: {
          id: { in: lessonIds },
          courseId: courseId,
        },
        select: { id: true },
      });

      if (lessons.length !== lessonIds.length) {
        // Some lessons don't belong to this course, clean up and return error
        await prisma.curriculum.delete({ where: { id: curriculum.id } });
        return res.status(400).json({
          error: 'Some lessons do not belong to this course or do not exist.'
        });
      }

      // Update lessons to attach them to the curriculum
      await prisma.lesson.updateMany({
        where: {
          id: { in: lessonIds },
          courseId: courseId,
        },
        data: {
          curriculumId: curriculum.id,
        },
      });
    }

    // Return the created curriculum with attached lessons
    const curriculumWithLessons = await prisma.curriculum.findUnique({
      where: { id: curriculum.id },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            type: true,
            position: true,
            duration: true,
            isPreview: true,
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    res.status(201).json(curriculumWithLessons);
  } catch (err:any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: err.issues });
    }
    console.error("Error creating curriculum:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * [INSTRUCTOR] Attach lessons to a curriculum
 * @route POST /api/instructor/courses/:courseId/curriculum/:curriculumId/lessons
 */
export const attachLessonsToCurriculum = async (req: UserRequest, res: Response) => {
  try {
    const { courseId, curriculumId } = req.params;
    const { lessonIds } = manageCurriculumLessonsSchema.parse(req.body);
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can manage curriculum lessons.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    // Verify curriculum exists and belongs to the course
    const curriculum = await prisma.curriculum.findFirst({
      where: { id: curriculumId, courseId },
    });

    if (!curriculum) {
      return res.status(404).json({
        error: 'Curriculum not found in this course.'
      });
    }

    // Verify all lessons belong to the same course and are not already attached to another curriculum
    const lessons = await prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        courseId: courseId,
      },
      select: { id: true, curriculumId: true },
    });

    if (lessons.length !== lessonIds.length) {
      return res.status(400).json({
        error: 'Some lessons do not belong to this course or do not exist.'
      });
    }

    // Check if any lessons are already attached to another curriculum
    const lessonsInOtherCurriculums = lessons.filter(lesson => lesson.curriculumId && lesson.curriculumId !== curriculumId);
    if (lessonsInOtherCurriculums.length > 0) {
      return res.status(400).json({
        error: 'Some lessons are already attached to another curriculum. Please detach them first.'
      });
    }

    // Attach lessons to the curriculum
    await prisma.lesson.updateMany({
      where: {
        id: { in: lessonIds },
        courseId: courseId,
      },
      data: {
        curriculumId: curriculumId,
      },
    });

    // Return updated curriculum with lessons
    const updatedCurriculum = await prisma.curriculum.findUnique({
      where: { id: curriculumId },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            type: true,
            position: true,
            duration: true,
            isPreview: true,
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Lessons attached to curriculum successfully',
      data: updatedCurriculum,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.issues
      });
    }
    console.error('Error attaching lessons to curriculum:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [INSTRUCTOR] Detach lessons from a curriculum
 * @route DELETE /api/instructor/courses/:courseId/curriculum/:curriculumId/lessons
 */
export const detachLessonsFromCurriculum = async (req: UserRequest, res: Response) => {
  try {
    const { courseId, curriculumId } = req.params;
    const { lessonIds } = manageCurriculumLessonsSchema.parse(req.body);
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can manage curriculum lessons.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    // Verify curriculum exists and belongs to the course
    const curriculum = await prisma.curriculum.findFirst({
      where: { id: curriculumId, courseId },
    });

    if (!curriculum) {
      return res.status(404).json({
        error: 'Curriculum not found in this course.'
      });
    }

    // Verify all lessons belong to the curriculum
    const lessons = await prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        curriculumId: curriculumId,
        courseId: courseId,
      },
      select: { id: true },
    });

    if (lessons.length !== lessonIds.length) {
      return res.status(400).json({
        error: 'Some lessons do not belong to this curriculum or do not exist.'
      });
    }

    // Detach lessons from the curriculum (set curriculumId to null)
    await prisma.lesson.updateMany({
      where: {
        id: { in: lessonIds },
        curriculumId: curriculumId,
        courseId: courseId,
      },
      data: {
        curriculumId: null,
      },
    });

    // Return updated curriculum with remaining lessons
    const updatedCurriculum = await prisma.curriculum.findUnique({
      where: { id: curriculumId },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            type: true,
            position: true,
            duration: true,
            isPreview: true,
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Lessons detached from curriculum successfully',
      data: updatedCurriculum,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.issues
      });
    }
    console.error('Error detaching lessons from curriculum:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [INSTRUCTOR ONLY] Create a lesson under a course (and optionally a curriculum).
 * @route POST /api/instructor/courses/:courseId/lessons
 */
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 videoUrl:
 *                   type: string
 *                 docUrl:
 *                   type: string
 *                 duration:
 *                   type: number
 *                 type:
 *                   type: string
 *                 isPreview:
 *                   type: boolean
 *                 position:
 *                   type: number
 *                 courseId:
 *                   type: string
 *                 curriculumId:
 *                   type: string
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
export const createLesson = async (req: UserRequest, res: Response) => {
  // Check authorization - only instructors and admins can create lessons
  const user = req.user;
  if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
    return res.status(403).json({
      error: 'Access denied. Only instructors or admins can create lessons.'
    });
  }

  const { courseId } = req.params;

  // Handle file uploads
  let videoUrl = req.body.videoUrl;
  let docUrl = req.body.docUrl;

  // Check for uploaded video
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files.video && files.video[0]) {
      videoUrl = files.video[0].path; // Cloudinary URL
    }

    if (files.document && files.document[0]) {
      docUrl = files.document[0].path; // Cloudinary URL
    }
  }

  // Validate with processed URLs
  const validatedData = createLessonSchema.safeParse({
    ...req.body,
    videoUrl,
    docUrl,
  });

  await checkCourseOwnership(courseId, user);

  if (!validatedData.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: validatedData.error.issues
    });
  }

  try {
    const { curriculumId } = validatedData.data!;

    if (curriculumId) {
      const curriculum = await prisma.curriculum.findFirst({
        where: {
          id: curriculumId,
          courseId: courseId
        },
      });

      if (!curriculum) {
        return res.status(400).json({
          error: 'Curriculum not found in this course.'
        });
      }
    }

    // Create lesson data object, excluding curriculumId from the spread to avoid type conflicts
    const { curriculumId: _, ...lessonDataWithoutCurriculumId } = validatedData.data;

    const lesson = await prisma.lesson.create({
      data: {
        ...lessonDataWithoutCurriculumId,
        course: { connect: { id: courseId } },
        ...(curriculumId && {
          curriculum: { connect: { id: curriculumId } }
        }),
      },
    });

    res.status(201).json(lesson);
  } catch (err) {
    console.error("Error creating lesson:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * [STUDENT ONLY] Review a course.
 * @route POST /api/student/courses/:courseId/reviews
 */
export const reviewCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { rating, title, comment } = reviewCourseSchema.parse(req.body);
  const user = (req as UserRequest).user;

  try {
    // Ensure the user is a student before allowing review
    if (user?.role !== "STUDENT") {
      return res.status(403).json({ error: "Forbidden: Only students can review a course." });
    }


    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.id,
        courseId,
        status: 'PAID'
      },
    });

    if (!enrollment) {
      return res.status(403).json({
        error: "You must be enrolled in the course to review it."
      });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        title: title ? (title.trim() || null) : null,
        comment: comment || "",
        course: { connect: { id: courseId } },
        author: { connect: { id: user!.id } },
      },
    });
    res.status(201).json(review);
  } catch (err) {
    // This is more robust than a generic error message
    // Prisma will throw a unique constraint error if a user tries to review a course twice.
    console.error("Error reviewing course:", err);
    res.status(400).json({ error: "Error reviewing course, you may have already submitted a review." });
  }
};

/**
 * [INSTRUCTOR] Get course reviews for instructors to see feedback
 * @route GET /api/instructor/courses/:courseId/reviews
 */
export const getCourseReviews = async (req: UserRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can view course reviews.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    const reviews = await prisma.review.findMany({
      where: { courseId },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
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
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          authorName: review.author.studentProfile ?
            `${review.author.studentProfile.firstName} ${review.author.studentProfile.lastName}`.trim() :
            'Anonymous',
          authorProfilePicture: review.author.studentProfile?.profilePicture,
        })),
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
      },
    });
  } catch (err: any) {
    console.error('Error fetching course reviews:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




// newwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww



/**
 * [INSTRUCTOR] Get instructor's own courses
 * @route GET /api/instructor/courses
 */
// src/controllers/courses/getMyCourses.ts


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
export const getMyCourses = async (req: UserRequest, res: Response) => {
  try {
    const user = req.user;

    // Ensure user is present and authorized
    if (!user || (user.role !== "INSTRUCTOR" && user.role !== "ADMIN")) {
      return res.status(403).json({
        error: "Access denied. Only instructors or admins can view courses.",
      });
    }

    // Fetch courses:
    // - If ADMIN, return all courses
    // - If INSTRUCTOR, return only their courses
    const courses = await prisma.course.findMany({
      where:
        user.role === "ADMIN"
          ? {} // no restriction
          : { instructorId: user.id }, // only this instructor’s courses
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        price: true,
        currency: true,
        duration: true,
        image: true,
        status: true,
        rating: true,
        tags: true,
        targetAudience: true,
        learningOutcomes: true,
        createdAt: true,
        updatedAt: true,
        instructorId: true,
        _count: {
          select: {
            enrollments: true,
            reviews: true,
            lessons: true,
          },
        },
        reviews: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to response shape
    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category || "General", // Add dummy data for empty fields
      price: course.price || 0,
      currency: "NGN", // Add default currency
      duration: course.duration || 60, // Add default duration in minutes
      image: course.image || "", // Handle missing image
      status: course.status || "DRAFT",
      rating: course.rating || 0,
      tags: course.tags || [],
      targetAudience: course.targetAudience || [],
      learningOutcomes: course.learningOutcomes || [],
      totalStudents: course._count?.enrollments || 0,
      totalReviews: course._count?.reviews || 0,
      totalLessons: course._count?.lessons || 0,
      recentReviews: course.reviews || [],
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      total: formattedCourses.length,
      data: formattedCourses,
    });
  } catch (err) {
    console.error("Error fetching instructor courses:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



/**
 * [INSTRUCTOR] Get specific course details
 * @route GET /api/courses/:id/public
 */
export const getPublicCourseById = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            instructorProfile: {
              select: {
                firstName: true,
                lastName: true,
                bio: true,
                expertise: true,
                profilePicture: true,
              },
            },
          },
        },
        curriculum: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                isPreview: true,
                position: true,
                duration: true,
                type: true,
                // content hidden
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { position: "asc" },
        },
        reviews: {
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
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err: any) {
    console.error("Error fetching public course details:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


  //    api/courses/:id
export const getPrivateCourseById = async (req: UserRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let hasAccess = false;

    if (user.role === "ADMIN") {
      hasAccess = true;
    } else if (user.role === "INSTRUCTOR") {
      await checkCourseOwnership(courseId, user);
      hasAccess = true;
    } else if (user.role === "STUDENT") {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          courseId,
          studentId: user.id,
          status: "PAID",
        },
      });
      if (enrollment) hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            instructorProfile: {
              select: {
                firstName: true,
                lastName: true,
                bio: true,
                expertise: true,
                profilePicture: true,
              },
            },
          },
        },
        curriculum: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                content: true,
                videoUrl: true,
                docUrl: true,
                isPreview: true,
                position: true,
                duration: true,
                type: true,
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { position: "asc" },
        },
        quizzes: {
          include: {
            questions: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            student: {
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
        },
        reviews: {
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
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err: any) {
    console.error("Error fetching private course details:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * [INSTRUCTOR] Submit a review for a course (by instructor)
 * @route POST /api/instructor/courses/:courseId/reviews
 */
export const instructorReviewCourse = async (req: UserRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { rating, title, comment } = instructorReviewSchema.parse(req.body);
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can submit reviews.'
      });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Instructors can only review courses they didn't create
    if (user.role === 'INSTRUCTOR' && course.instructorId === user.id) {
      return res.status(400).json({
        error: 'Instructors cannot review their own courses.'
      });
    }

    // Check if user has already reviewed this course
    const existingReview = await prisma.review.findFirst({
      where: {
        courseId,
        authorId: user.id,
      },
    });

    if (existingReview) {
      return res.status(400).json({
        error: 'You have already submitted a review for this course.'
      });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating: rating,
        title: title ? (title.trim() || null) : null,
        comment: comment ? (comment.trim() || "") : "",
        course: { connect: { id: courseId } },
        author: { connect: { id: user.id } },
      },
    });

    // Update course rating
    const allReviews = await prisma.review.findMany({
      where: { courseId },
      select: { rating: true },
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.course.update({
      where: { id: courseId },
      data: { rating: averageRating },
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (err: any) {
    console.error('Error submitting instructor review:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};






/**
 * [INSTRUCTOR] Update course details
 * @route PUT /api/instructor/courses/:courseId
 */
export const updateCourse = async (req: UserRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = req.user;
    const updateData = createCourseSchema.parse(req.body);

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({ 
        error: 'Access denied. Only instructors can update courses.' 
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });

    // Update course rating if there are reviews
    const allReviews = await prisma.review.findMany({
      where: { courseId },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await prisma.course.update({
        where: { id: courseId },
        data: { rating: averageRating },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: err.issues 
      });
    }
    console.error('Error updating course:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



/**
 * [INSTRUCTOR] Get course analytics
 * @route GET /api/instructor/courses/:courseId/analytics
 */
export const getCourseAnalytics = async (req: UserRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can view analytics.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    // Get enrollment stats
    const totalEnrollments = await prisma.enrollment.count({
      where: { courseId },
    });

    const paidEnrollments = await prisma.enrollment.count({
      where: {
        courseId,
        status: 'PAID',
      },
    });

    // Get completion stats
    const totalLessons = await prisma.lesson.count({
      where: { courseId },
    });

    const completedLessons = await prisma.progress.count({
      where: {
        lesson: { courseId },
        completed: true,
      },
    });

    // Get review stats
    const reviews = await prisma.review.findMany({
      where: { courseId },
      select: { rating: true },
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEnrollments = await prisma.enrollment.count({
      where: {
        courseId,
        enrolledAt: { gte: thirtyDaysAgo },
      },
    });

    const recentCompletions = await prisma.progress.count({
      where: {
        lesson: { courseId },
        completed: true,
        completedAt: { gte: thirtyDaysAgo },
      },
    });

    // Get course price for revenue calculation
    const coursePriceResult = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true }
    });

    res.status(200).json({
      success: true,
      data: {
        courseId,
        overview: {
          totalEnrollments,
          paidEnrollments,
          completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews.length,
        },
        recentActivity: {
          enrollmentsThisMonth: recentEnrollments,
          completionsThisMonth: recentCompletions,
        },
        revenue: {
          totalRevenue: paidEnrollments * (coursePriceResult?.price ?? 0),
        },
      },
    });
  } catch (err: any) {
    console.error('Error fetching course analytics:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};







/**
 * [INSTRUCTOR] Update lesson
 * @route PATCH /api/courses/:courseId/lessons/:lessonId
 */
export const updateLesson = async (req: UserRequest, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;
    const user = req.user;

    if (!user || (user.role !== "INSTRUCTOR" && user.role !== "ADMIN")) {
      return res.status(403).json({
        error: "Access denied. Only instructors or admins can update lessons.",
      });
    }

    // Allow partial updates (PATCH)
    const updateData = updateLessonSchema.parse(req.body);

    if (user.role === "INSTRUCTOR") {
      await checkCourseOwnership(courseId, user);
    }

    // Ensure the lesson exists and belongs to this course
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found in this course" });
    }

    // --- ✅ Handle position reordering if position is included ---
    if (
      updateData.position !== undefined &&
      updateData.position !== lesson.position
    ) {
      const oldPosition = lesson.position;
      const newPosition = updateData.position;

      if (newPosition < oldPosition) {
        // Moving UP: shift lessons between newPosition and oldPosition down
        await prisma.lesson.updateMany({
          where: {
            courseId,
            position: { gte: newPosition, lt: oldPosition },
            NOT: { id: lessonId },
          },
          data: { position: { increment: 1 } },
        });
      } else if (newPosition > oldPosition) {
        // Moving DOWN: shift lessons between oldPosition and newPosition up
        await prisma.lesson.updateMany({
          where: {
            courseId,
            position: { lte: newPosition, gt: oldPosition },
            NOT: { id: lessonId },
          },
          data: { position: { decrement: 1 } },
        });
      }
    }

    // --- ✅ Update the lesson itself ---
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully (with reordering if needed)",
      data: updatedLesson,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation Error",
        details: err.issues,
      });
    }
    console.error("Error updating lesson:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * [INSTRUCTOR] Delete lesson
 * @route DELETE /api/courses/:courseId/lessons/:lessonId
 */
export const deleteLesson = async (req: UserRequest, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;
    const user = req.user;

    if (!user || (user.role !== "INSTRUCTOR" && user.role !== "ADMIN")) {
      return res.status(403).json({
        error: "Access denied. Only instructors or admins can delete lessons.",
      });
    }

    if (user.role === "INSTRUCTOR") {
      await checkCourseOwnership(courseId, user);
    }

    // Ensure lesson exists and belongs to the course
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found in this course" });
    }

    // Delete lesson
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    // Reorder positions (shift down lessons after the deleted one)
    await prisma.lesson.updateMany({
      where: {
        courseId,
        position: { gt: lesson.position }, // only lessons after deleted one
      },
      data: {
        position: { decrement: 1 },
      },
    });

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully and positions reordered",
    });
  } catch (err: any) {
    console.error("Error deleting lesson:", err);
    return handlePrismaError(err, res, "DeleteLesson");
  }
};




/**
 * [INSTRUCTOR ONLY] Create a quiz for a course.
 * Your schema links Quizzes to Courses, not Lessons.
 * @route POST /api/instructor/courses/:courseId/quizzes
 */
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 courseId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
export const createQuiz = async (req: UserRequest, res: Response) => {
   const { courseId } = req.params;
   const validatedData = createQuizSchema.parse(req.body);
   const { title } = validatedData;

  try {
    const quiz = await prisma.quiz.create({
      data: {
        title,
        course: { connect: { id: courseId } },
      },
    });
    res.status(201).json(quiz);
  } catch (err:any) {
     if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: err.issues });
    }
    console.error("Error creating quiz:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * [INSTRUCTOR ONLY] Add a question to a quiz.
 * @route POST /api/instructor/quizzes/:quizId/questions
 */
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 text:
 *                   type: string
 *                 type:
 *                   type: string
 *                 options:
 *                   type: array
 *                   items:
 *                     type: string
 *                 correctAnswer:
 *                   type: string
 *                 quizId:
 *                   type: string
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
export const addQuestionToQuiz = async (req: UserRequest, res: Response) => {
   const { quizId } = req.params;
   const validatedData = addQuestionSchema.parse(req.body);
   const { text, type, options, correctAnswer } = validatedData;

  try {
    const newQuestion = await prisma.question.create({
      data: {
        text,
        type,
        options,
        correctAnswer: String(correctAnswer),
        quiz: { connect: { id: quizId } },
      },
    });
    res.status(201).json(newQuestion);
  } catch (err) {
    console.error("Error creating question:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};






/**
 * [INSTRUCTOR] Update quiz
 * @route PUT /api/courses/:courseId/quizzes/:quizId
 */
export const updateQuiz = async (req: UserRequest, res: Response) => {
  try {
    const { courseId, quizId } = req.params;
    const user = req.user;
    const updateData = createQuizSchema.parse(req.body);

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can update quizzes.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    // Check if quiz exists and belongs to course
    const quiz = await prisma.quiz.findFirst({
      where: { 
        id: quizId, 
        courseId 
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found in this course' });
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: updatedQuiz,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: err.issues 
      });
    }
    console.error('Error updating quiz:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [INSTRUCTOR] Delete quiz
 * @route DELETE /api/courses/:courseId/quizzes/:quizId
 */
export const deleteQuiz = async (req: UserRequest, res: Response) => {
  try {
    const { courseId, quizId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can delete quizzes.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    // Check if quiz exists and belongs to course
    const quiz = await prisma.quiz.findFirst({
      where: { 
        id: quizId, 
        courseId 
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found in this course' });
    }

    const deletedQuiz = await prisma.quiz.delete({
      where: { id: quizId },
    });

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
      data: deletedQuiz,
    });
  } catch (err: any) {
    console.error('Error deleting quiz:', err);
    return handlePrismaError(err, res, "DeleteQuiz");
  }
};

/**
 * [INSTRUCTOR] Get all quizzes for a course
 * @route GET /api/instructor/courses/:courseId/quizzes
 */
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
export const getCourseQuizzes = async (req: UserRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can view course quizzes.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    const quizzes = await prisma.quiz.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'asc' }
      ],
    });

    res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (err: any) {
    console.error('Error fetching course quizzes:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [INSTRUCTOR] Get quiz questions
 * @route GET /api/quizzes/:quizId/questions
 */
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
export const getQuizQuestions = async (req: UserRequest, res: Response) => {
  try {
    const { quizId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can view quiz questions.'
      });
    }

    // Get quiz with course to check ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(quiz.course.id, user);
    }

    const questions = await prisma.question.findMany({
      where: { quizId },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (err: any) {
    console.error('Error fetching quiz questions:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [INSTRUCTOR] Update question
 * @route PUT /api/questions/:questionId
 */
export const updateQuestion = async (req: UserRequest, res: Response) => {
  try {
    const { questionId } = req.params;
    const user = req.user;
    const updateData = addQuestionSchema.parse(req.body);

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can update questions.'
      });
    }

    // Get question with quiz and course to check ownership
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(question.quiz.course.id, user);
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        text: updateData.text,
        type: updateData.type,
        options: updateData.options,
        correctAnswer: String(updateData.correctAnswer),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: err.issues 
      });
    }
    console.error('Error updating question:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [INSTRUCTOR] Delete question
 * @route DELETE /api/questions/:questionId
 */
export const deleteQuestion = async (req: UserRequest, res: Response) => {
  try {
    const { questionId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can delete questions.'
      });
    }

    // Get question with quiz and course to check ownership
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(question.quiz.course.id, user);
    }

    const deletedQuestion = await prisma.question.delete({
      where: { id: questionId },
    });

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
      data: deletedQuestion,
    });
  } catch (err: any) {
    console.error('Error deleting question:', err);
    return handlePrismaError(err, res, "DeleteQuestion");
  }
};

/**
 * [INSTRUCTOR] Get curriculums for a course
 * @route GET /api/instructor/courses/:courseId/curriculum
 */
export const getCourseCurriculums = async (req: UserRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can view curriculums.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    const curriculums = await prisma.curriculum.findMany({
      where: { courseId },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            type: true,
            position: true,
            duration: true,
            isPreview: true,
            createdAt: true,
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: curriculums,
    });
  } catch (err: any) {
    console.error('Error fetching course curriculums:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [INSTRUCTOR] Get lessons for a course
 * @route GET /api/instructor/courses/:courseId/lessons
 */
export const getCourseLessons = async (req: UserRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can view lessons.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      include: {
        curriculum: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    res.status(200).json({
      success: true,
      data: lessons,
    });
  } catch (err: any) {
    console.error('Error fetching course lessons:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [INSTRUCTOR] Update curriculum section
 * @route PUT /api/instructor/courses/:courseId/curriculum/:curriculumId
 */
export const updateCurriculum = async (req: UserRequest, res: Response) => {
  try {
    const { courseId, curriculumId } = req.params;
    const user = req.user;
    const updateData = updateCurriculumSchema.parse(req.body);

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors can update curriculum sections.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    // Ensure the curriculum exists and belongs to this course
    const curriculum = await prisma.curriculum.findFirst({
      where: { id: curriculumId, courseId },
      include: {
        lessons: {
          select: { id: true }
        }
      }
    });

    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum section not found in this course' });
    }

    // Handle position reordering if position is included
    if (
      updateData.position !== undefined &&
      updateData.position !== curriculum.position
    ) {
      const oldPosition = curriculum.position;
      const newPosition = updateData.position;

      if (newPosition < oldPosition) {
        // Moving UP: shift curriculums between newPosition and oldPosition down
        await prisma.curriculum.updateMany({
          where: {
            courseId,
            position: { gte: newPosition, lt: oldPosition },
            NOT: { id: curriculumId },
          },
          data: { position: { increment: 1 } },
        });
      } else if (newPosition > oldPosition) {
        // Moving DOWN: shift curriculums between oldPosition and newPosition up
        await prisma.curriculum.updateMany({
          where: {
            courseId,
            position: { lte: newPosition, gt: oldPosition },
            NOT: { id: curriculumId },
          },
          data: { position: { decrement: 1 } },
        });
      }
    }

    // Handle lesson attachment/detachment if lessonIds are provided
    if (updateData.lessonIds !== undefined) {
      const newLessonIds = updateData.lessonIds;
      const currentLessonIds = curriculum.lessons?.map((lesson: any) => lesson.id) || [];

      // Find lessons to attach (in new list but not in current)
      const lessonsToAttach = newLessonIds.filter(id => !currentLessonIds.includes(id));
      // Find lessons to detach (in current but not in new)
      const lessonsToDetach = currentLessonIds.filter(id => !newLessonIds.includes(id));

      // Attach new lessons
      if (lessonsToAttach.length > 0) {
        // Verify all lessons belong to the same course
        const lessons = await prisma.lesson.findMany({
          where: {
            id: { in: lessonsToAttach },
            courseId: courseId,
          },
          select: { id: true, curriculumId: true },
        });

        if (lessons.length !== lessonsToAttach.length) {
          return res.status(400).json({
            error: 'Some lessons do not belong to this course or do not exist.'
          });
        }

        // Check if any lessons are already attached to another curriculum
        const lessonsInOtherCurriculums = lessons.filter(lesson => lesson.curriculumId && lesson.curriculumId !== curriculumId);
        if (lessonsInOtherCurriculums.length > 0) {
          return res.status(400).json({
            error: 'Some lessons are already attached to another curriculum. Please detach them first.'
          });
        }

        // Attach lessons to the curriculum
        await prisma.lesson.updateMany({
          where: {
            id: { in: lessonsToAttach },
            courseId: courseId,
          },
          data: {
            curriculumId: curriculumId,
          },
        });
      }

      // Detach removed lessons
      if (lessonsToDetach.length > 0) {
        await prisma.lesson.updateMany({
          where: {
            id: { in: lessonsToDetach },
            curriculumId: curriculumId,
            courseId: courseId,
          },
          data: {
            curriculumId: null,
          },
        });
      }
    }

    // Update the curriculum itself (excluding lessonIds from the update)
    const { lessonIds, ...curriculumUpdateData } = updateData;
    const updatedCurriculum = await prisma.curriculum.update({
      where: { id: curriculumId },
      data: curriculumUpdateData,
    });

    // Return the updated curriculum with attached lessons
    const curriculumWithLessons = await prisma.curriculum.findUnique({
      where: { id: curriculumId },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            type: true,
            position: true,
            duration: true,
            isPreview: true,
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Curriculum section updated successfully',
      data: curriculumWithLessons,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.issues
      });
    }
    console.error('Error updating curriculum:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [INSTRUCTOR] Delete curriculum section
 * @route DELETE /api/instructor/courses/:courseId/curriculum/:curriculumId
 */
export const deleteCurriculum = async (req: UserRequest, res: Response) => {
  try {
    const { courseId, curriculumId } = req.params;
    const user = req.user;

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Access denied. Only instructors or admins can delete curriculum sections.'
      });
    }

    // Check ownership for instructors
    if (user.role === 'INSTRUCTOR') {
      await checkCourseOwnership(courseId, user);
    }

    // Ensure the curriculum exists and belongs to this course
    const curriculum = await prisma.curriculum.findFirst({
      where: { id: curriculumId, courseId },
      include: {
        lessons: true,
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum section not found in this course' });
    }

    // Check if curriculum has lessons
    if (curriculum._count.lessons > 0) {
      return res.status(400).json({
        error: 'Cannot delete curriculum with existing lessons. Please move or delete lessons first.'
      });
    }

    // Delete the curriculum
    const deletedCurriculum = await prisma.curriculum.delete({
      where: { id: curriculumId },
    });

    // Reorder positions (shift down curriculums after the deleted one)
    await prisma.curriculum.updateMany({
      where: {
        courseId,
        position: { gt: curriculum.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Curriculum section deleted successfully and positions reordered',
      data: deletedCurriculum,
    });
  } catch (err: any) {
    console.error('Error deleting curriculum:', err);
    return handlePrismaError(err, res, "DeleteCurriculum");
  }
};




