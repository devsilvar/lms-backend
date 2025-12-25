// utils/checkCourseOwnership.ts
import prisma from "../../../config/db.js";
export async function checkCourseOwnership(courseId: string, user: { id: string; role: string }) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw { status: 404, message: "Course not found." };
  }

  if (user.role === "INSTRUCTOR" && course.instructorId !== user.id) {
    throw { status: 403, message: "You don't own this course." };
  }

  // Admins are always allowed
  return course;
}
