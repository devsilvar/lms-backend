import { Request, Response } from 'express';
import prisma from '../../config/db.js';
import { z } from 'zod';

// // Extend the Request interface to include user property

interface UserRequest extends Request {
  user?: {
    id: string;
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  };
}

// // Validation schemas for student endpoints

const getCoursesQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'price-low', 'price-high', 'rating']).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

const enrollCourseSchema = z.object({
  courseId: z.string(),
});

// Define validation schema for course enrollment
const enrollmentSchema = z.object({
  courseId: z.string(),
});

// /**
//  * [PUBLIC] Get all courses with optional filtering and pagination
//  * @route GET /api/courses
//  */


export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      sortBy = 'newest',
      page = 1,
      limit = 10
    } = getCoursesQuerySchema.parse(req.query);

    // Build where clause for filtering
    const where: any = {
      // Only show published courses to public users
      // You might want to add a 'status' field to your Course model
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }


    // Build order by clause for sorting
    const orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'oldest':
        orderBy.createdAt = 'asc';
        break;
      case 'price-low':
        orderBy.price = 'asc';
        break;
      case 'price-high':
        orderBy.price = 'desc';
        break;
      case 'rating':
        orderBy.rating = 'desc';
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get courses with related data
    const courses = await prisma.course.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        instructor: {
          select: {
            id: true,
            instructorProfile: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                studentProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });


    // Get total count for pagination
    const totalCourses = await prisma.course.count({ where });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCourses / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format the response
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      duration: course.duration,
      image: course.image,
      instructor: course.instructor?.instructorProfile ? {
        id: course.instructor.id,
        firstName: course.instructor.instructorProfile.firstName,
        lastName: course.instructor.instructorProfile.lastName,
        profilePicture: course.instructor.instructorProfile.profilePicture,
      } : { id: course.instructorId },
      rating: course.rating || 0,
      totalRatings: course._count?.reviews || 0,
      enrolledCount: course._count?.enrollments || 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      recentReviews: course.reviews || [],
    }));

    res.status(200).json({
      success: true,
      data: formattedCourses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCourses,
        hasNextPage,
        hasPrevPage,
        limit,
      },
      filters: {
        search,
        category,
        sortBy,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: err.issues 
      });
    }
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [PUBLIC] Get a specific course by slug or ID with full details
 * @route GET /api/courses/:courseId
 */
export const getCourseBySlug = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // First try to find by ID (UUID)
    let course = await prisma.course.findUnique({
      where: { id: courseId },
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
        createdAt: true,
        updatedAt: true,
        instructorId: true,
        instructor: {
          select: {
            id: true,
            instructorProfile: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
                bio: true,
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
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
        quizzes: {
          select: {
            id: true,
            title: true,
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
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    // If not found by ID, try to find by slug (URL-friendly title)
    if (!course) {
      const coursesList = await prisma.course.findMany({
        include: {
          instructor: {
            select: {
              id: true,
              instructorProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  bio: true,
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
                orderBy: { position: 'asc' },
              },
            },
            orderBy: { position: 'asc' },
          },
          quizzes: {
            select: {
              id: true,
              title: true,
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
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
      });

      // Create slug from title for comparison
      const createSlug = (str: string) => {
        return str
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
          .replace(/--+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
      };

      course = coursesList.find(c => createSlug(c.title || '') === courseId) || null;
    }

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Format the response
    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      duration: course.duration,
      image: course.image,
      instructor: course.instructor ? {
        id: course.instructor.id,
        firstName: course.instructor.instructorProfile?.firstName,
        lastName: course.instructor.instructorProfile?.lastName,
        profilePicture: course.instructor.instructorProfile?.profilePicture,
        bio: course.instructor.instructorProfile?.bio,
      } : null,
      rating: course.rating || 0,
      totalRatings: course._count?.reviews || 0,
      enrolledCount: course._count?.enrollments || 0,
      targetAudience: course.targetAudience || [],
      curriculum: course.curriculum || [],
      quizzes: course.quizzes || [],
      reviews: course.reviews?.map((review: any) => ({
        ...review,
        authorName: review.author.studentProfile ?
          `${review.author.studentProfile.firstName} ${review.author.studentProfile.lastName}`.trim() :
          'Anonymous',
        authorProfilePicture: review.author.studentProfile?.profilePicture,
      })) || [],
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedCourse,
    });
  } catch (err: any) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [PUBLIC] Get a specific course by ID with full details
 * @route GET /api/courses/:courseId
 */
export const getCourseById = async (req: Request, res: Response) => {
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
                profilePicture: true,
                bio: true,
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
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
        quizzes: {
          select: {
            id: true,
            title: true,
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
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Format the response
    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      duration: course.duration,
      image: course.image,
      instructor: course.instructor ? {
        id: course.instructor.id,
        firstName: course.instructor.instructorProfile?.firstName,
        lastName: course.instructor.instructorProfile?.lastName,
        profilePicture: course.instructor.instructorProfile?.profilePicture,
        bio: course.instructor.instructorProfile?.bio,
      } : null,
      rating: course.rating || 0,
      totalRatings: course._count?.reviews || 0,
      enrolledCount: course._count?.enrollments || 0,
      curriculum: course.curriculum || [],
      quizzes: course.quizzes || [],
      reviews: course.reviews?.map((review: any) => ({
        ...review,
        authorName: review.author.studentProfile ?
          `${review.author.studentProfile.firstName} ${review.author.studentProfile.lastName}`.trim() :
          'Anonymous',
        authorProfilePicture: review.author.studentProfile?.profilePicture,
      })) || [],
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedCourse,
    });
  } catch (err: any) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [PUBLIC] Get course categories
 * @route GET /api/courses/categories
 */
export const getCourseCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.course.findMany({
      select: { category: true },
      where: {
        // Only include published courses
        // Add status filter when you implement course status
      },
    });

    const uniqueCategories = [...new Set(categories.map(c => c.category).filter(Boolean))];

    res.status(200).json({
      success: true,
      data: uniqueCategories,
    });
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [PUBLIC] Get course levels
 * @route GET /api/courses/levels
 */
export const getCourseLevels = async (req: Request, res: Response) => {
  try {
    const levels = await prisma.course.findMany({
      select: { level: true },
      where: {
        // Only include published courses
      },
    });

    const uniqueLevels = [...new Set(levels.map(c => c.level).filter(Boolean))];

    res.status(200).json({
      success: true,
      data: uniqueLevels,
    });
  } catch (err: any) {
    console.error('Error fetching levels:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * [STUDENT] Get student's enrolled courses
 * @route GET /api/student/courses
 */
export const getEnrolledCourses = async (req: UserRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user || user.role !== 'STUDENT') {
      return res.status(403).json({
        error: 'Access denied. Only students can view enrolled courses.'
      });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: user.id,
        status: 'PAID', // Only show paid enrollments
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                instructorProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
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
                    position: true,
                    duration: true,
                  },
                  orderBy: { position: 'asc' },
                },
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Calculate progress for each course
    const enrolledCoursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await prisma.course.findUnique({
          where: { id: enrollment.courseId },
          include: {
            instructor: {
              select: {
                id: true,
                instructorProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                  },
                },
              },
            },
            curriculum: {
              include: {
                lessons: true,
              },
            },
          },
        });

        if (!course) {
          throw new Error(`Course with ID ${enrollment.courseId} not found`);
        }

        // Get completed lessons count
        const completedLessons = await prisma.progress.count({
          where: {
            enrollment: {
              studentId: user.id,
              courseId: course.id,
            },
            completed: true,
          },
        });

        const totalLessons = course.curriculum.reduce(
          (total: number, curriculum) => total + curriculum.lessons.length,
          0
        );

        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          image: course.image,
          instructor: course.instructor,
          category: course.category,
          price: course.price,
          duration: course.duration,
          rating: course.rating || 0,
          progress,
          completedLessons,
          totalLessons,
          status: progress === 100 ? 'completed' : 'in-progress',
          enrolledAt: enrollment.enrolledAt,
          lastAccessed: enrollment.updatedAt,
          certificateEarned: progress === 100,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrolledCoursesWithProgress,
      total: enrolledCoursesWithProgress.length,
    });
  } catch (err: any) {
    console.error('Error fetching enrolled courses:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// /**
//  * [STUDENT] Enroll in a course
//  * @route POST /api/courses/:courseId/enroll
//  */
// export const enrollInCourse = async (req: UserRequest, res: Response) => {
//   try {
//     const { courseId } = req.params;
//     const user = req.user;

//     if (!user || user.role !== 'STUDENT') {
//       return res.status(403).json({ 
//         error: 'Access denied. Only students can enroll in courses.' 
//       });
//     }

//     // Check if course exists
//     const course = await prisma.course.findUnique({
//       where: { id: courseId },
//     });

//     if (!course) {
//       return res.status(404).json({ error: 'Course not found' });
//     }

//     // Check if already enrolled
//     const existingEnrollment = await prisma.enrollment.findFirst({
//       where: { 
//         studentId: user.id, 
//         courseId 
//       },
//     });

//     if (existingEnrollment) {
//       return res.status(400).json({ 
//         error: 'Already enrolled in this course' 
//       });
//     }

//     // Create enrollment
//     const enrollment = await prisma.enrollment.create({
//       data: {
//         studentId: user.id,
//         courseId,
//         status: 'PAID', // Assuming immediate enrollment for now
//         amount: course.price,
//         enrolledAt: new Date(),
//       },
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Successfully enrolled in course',
//       data: enrollment,
//     });
//   } catch (err: any) {
//     console.error('Error enrolling in course:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// /**
//  * [STUDENT] Get course progress details
//  * @route GET /api/student/courses/:courseId/progress
//  */
// export const getCourseProgress = async (req: UserRequest, res: Response) => {
//   try {
//     const { courseId } = req.params;
//     const user = req.user;

//     if (!user || user.role !== 'STUDENT') {
//       return res.status(403).json({ 
//         error: 'Access denied. Only students can view course progress.' 
//       });
//     }

//     // Check if enrolled in course
//     const enrollment = await prisma.enrollment.findFirst({
//       where: { 
//         studentId: user.id, 
//         courseId,
//         status: 'PAID',
//       },
//     });

//     if (!enrollment) {
//       return res.status(403).json({ 
//         error: 'Not enrolled in this course' 
//       });
//     }

//     // Get course details
//     const course = await prisma.course.findUnique({
//       where: { id: courseId },
//       include: {
//         curriculum: {
//           include: {
//             lessons: {
//               select: {
//                 id: true,
//                 title: true,
//                 position: true,
//                 duration: true,
//               },
//               orderBy: { position: 'asc' },
//             },
//           },
//           orderBy: { position: 'asc' },
//         },
//       },
//     });

//     if (!course) {
//       return res.status(404).json({ error: 'Course not found' });
//     }

//     // Get completed lessons
//     const completedLessons = await prisma.progress.findMany({
//       where: {
//         studentId: user.id,
//         lesson: {
//           courseId,
//         },
//         completed: true,
//       },
//       include: {
//         lesson: {
//           select: {
//             id: true,
//             title: true,
//             position: true,
//           },
//         },
//       },
//     });

//     const totalLessons = course.curricula.reduce(
//       (total, curriculum) => total + curriculum.lessons.length, 
//       0
//     );

//     const progress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

//     res.status(200).json({
//       success: true,
//       data: {
//         courseId,
//         progress,
//         completedLessons: completedLessons.length,
//         totalLessons,
//         status: progress === 100 ? 'completed' : 'in-progress',
//         lastAccessed: enrollment.updatedAt,
//         completedLessonsList: completedLessons.map(lp => ({
//           id: lp.lesson.id,
//           title: lp.lesson.title,
//           completedAt: lp.completedAt,
//         })),
//       },
//     });
//   } catch (err: any) {
//     console.error('Error fetching course progress:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// /**
//  * [STUDENT] Mark lesson as complete
//  * @route PUT /api/student/courses/:courseId/lessons/:lessonId/complete
//  */
// export const completeLesson = async (req: UserRequest, res: Response) => {
//   try {
//     const { courseId, lessonId } = req.params;
//     const user = req.user;

//     if (!user || user.role !== 'STUDENT') {
//       return res.status(403).json({ 
//         error: 'Access denied. Only students can complete lessons.' 
//       });
//     }

//     // Check if enrolled in course
//     const enrollment = await prisma.enrollment.findFirst({
//       where: { 
//         studentId: user.id, 
//         courseId,
//         status: 'PAID',
//       },
//     });

//     if (!enrollment) {
//       return res.status(403).json({ 
//         error: 'Not enrolled in this course' 
//       });
//     }

//     // Check if lesson exists and belongs to course
//     const lesson = await prisma.lesson.findFirst({
//       where: { 
//         id: lessonId, 
//         courseId 
//       },
//     });

//     if (!lesson) {
//       return res.status(404).json({ error: 'Lesson not found in this course' });
//     }

//     // Check if already completed
//     const existingProgress = await prisma.progress.findFirst({
//       where: {
//         studentId: user.id,
//         lessonId,
//       },
//     });

//     if (existingProgress && existingProgress.completed) {
//       return res.status(400).json({ 
//         error: 'Lesson already completed' 
//       });
//     }

//     // Create or update lesson progress
//     const lessonProgress = await prisma.progress.upsert({
//       where: {
//         studentId_lessonId: {
//           studentId: user.id,
//           lessonId,
//         },
//       },
//       update: {
//         completed: true,
//         completedAt: new Date(),
//       },
//       create: {
//         studentId: user.id,
//         lessonId,
//         completed: true,
//         completedAt: new Date(),
//       },
//     });

//     // Update enrollment's last accessed
//     await prisma.enrollment.update({
//       where: { id: enrollment.id },
//       data: { updatedAt: new Date() },
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Lesson marked as completed',
//       data: lessonProgress,
//     });
//   } catch (err: any) {
//     console.error('Error completing lesson:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

/**
 * [PUBLIC] Get course reviews
 * @route GET /api/courses/:courseId/reviews
 */
export const getCourseReviews = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const reviews = await prisma.review.findMany({
      where: { courseId },
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
          ...review,
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
/**
 * [STUDENT] Submit a review for a course
 * @route POST /api/student/courses/:courseId/reviews
 */
export const submitCourseReview = async (req: UserRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { rating, title, body } = req.body;
    const user = req.user;

    if (!user || user.role !== 'STUDENT') {
      return res.status(403).json({
        error: 'Access denied. Only students can submit reviews.'
      });
    }

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    if (!body || body.trim().length === 0) {
      return res.status(400).json({
        error: 'Review body is required'
      });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
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
        error: 'You must be enrolled in the course to review it.'
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

    // Create the review with enhanced fields
    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment: body.trim(),
        course: { connect: { id: courseId } },
        author: { connect: { id: user.id } },
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
      data: {
        ...review,
        authorName: review.author.studentProfile ?
          `${review.author.studentProfile.firstName} ${review.author.studentProfile.lastName}`.trim() :
          'Anonymous',
        authorProfilePicture: review.author.studentProfile?.profilePicture,
      },
    });
  } catch (err: any) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// /**
//  * [STUDENT] Get course lessons (for enrolled students)
//  * @route GET /api/courses/:courseId/lessons
//  */
// export const getCourseLessons = async (req: UserRequest, res: Response) => {
//   try {
//     const { courseId } = req.params;
//     const user = req.user;

//     if (!user || user.role !== 'STUDENT') {
//       return res.status(403).json({ 
//         error: 'Access denied. Only students can view course lessons.' 
//       });
//     }

//     // Check if enrolled in course
//     const enrollment = await prisma.enrollment.findFirst({
//       where: { 
//         studentId: user.id, 
//         courseId,
//         status: 'PAID',
//       },
//     });

//     if (!enrollment) {
//       return res.status(403).json({ 
//         error: 'Not enrolled in this course' 
//       });
//     }

//     // Get course with lessons
//     const course = await prisma.course.findUnique({
//       where: { id: courseId },
//       include: {
//         curriculum: {
//           include: {
//             lessons: {
//               select: {
//                 id: true,
//                 title: true,
//                 content: true,
//                 videoUrl: true,
//                 docUrl: true,
//                 isPreview: true,
//                 position: true,
//                 duration: true,
//                 type: true,
//               },
//               orderBy: { position: 'asc' },
//             },
//           },
//           orderBy: { position: 'asc' },
//         },
//       },
//     });

//     if (!course) {
//       return res.status(404).json({ error: 'Course not found' });
//     }

//     // Get student's progress for each lesson
//     const lessonsWithProgress = await Promise.all(
//       course.curricula.flatMap(curriculum => 
//         curriculum.lessons.map(async (lesson) => {
//           const progress = await prisma.progress.findFirst({
//             where: {
//               studentId: user.id,
//               lessonId: lesson.id,
//             },
//           });

//           return {
//             id: lesson.id,
//             title: lesson.title,
//             content: lesson.content,
//             videoUrl: lesson.videoUrl,
//             docUrl: lesson.docUrl,
//             isPreview: lesson.isPreview,
//             position: lesson.position,
//             duration: lesson.duration,
//             type: lesson.type,
//             completed: progress?.completed || false,
//             completedAt: progress?.completedAt,
//           };
//         })
//       )
//     );

//     res.status(200).json({
//       success: true,
//       data: {
//         courseId,
//         courseTitle: course.title,
//         lessons: lessonsWithProgress,
//         totalLessons: lessonsWithProgress.length,
//         completedLessons: lessonsWithProgress.filter(l => l.completed).length,
//       },
//     });
//   } catch (err: any) {
//     console.error('Error fetching course lessons:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
