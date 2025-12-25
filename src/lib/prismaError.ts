// lib/prismaError.ts
import { Prisma } from "@prisma/client";

const isDev = process.env.NODE_ENV !== "production";

export function handlePrismaError(err: any, res: any, context: string) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const errorResponse = {
      error: getLmsErrorMessage(err.code, context, err.meta),
      ...(isDev && { code: err.code, meta: err.meta, message: err.message, context })
    };

    switch (err.code) {
      // 400 Bad Request
      case "P2000": case "P2003": case "P2004": case "P2005":
      case "P2006": case "P2007": case "P2008": case "P2009":
      case "P2010": case "P2011": case "P2012": case "P2013":
      case "P2019": case "P2020": case "P2022": case "P2023":
        return res.status(400).json(errorResponse);

      // 404 Not Found
      case "P2001": case "P2014": case "P2015": case "P2018":
      case "P2021": case "P2025":
        return res.status(404).json(errorResponse);

      // 409 Conflict
      case "P2002": case "P2030":
        return res.status(409).json(errorResponse);

      // 422 Unprocessable
      case "P2016": case "P2017":
        return res.status(422).json(errorResponse);

      // 500
      case "P2026": case "P2033": case "P2034":
        return res.status(500).json(errorResponse);

      default:
        return res.status(500).json({
          error: `Unknown Prisma error while ${context}`,
          ...(isDev && { code: err.code, message: err.message })
        });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: `Validation error while ${context}`,
      ...(isDev && { message: err.message })
    });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(500).json({
      error: `Database initialization failed while ${context}`,
      ...(isDev && { message: err.message })
    });
  }

  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return res.status(500).json({
      error: `Prisma engine panic while ${context}`,
      ...(isDev && { message: err.message })
    });
  }

  return res.status(500).json({
    error: `Unexpected server error while ${context}`,
    ...(isDev && { message: err.message })
  });
}


function getLmsErrorMessage(code: string, context: string, meta?: any): string {
  switch (code) {
    case "P2002": // unique
      if (context.includes("Review")) return "You have already submitted a review for this course.";
      if (context.includes("User")) return "An account with this email already exists.";
      return "Duplicate entry. This record already exists.";

    case "P2003": // foreign key
      if (context.includes("Lesson")) return "Invalid course. The course you are adding a lesson to does not exist.";
      if (context.includes("Quiz")) return "Invalid course or lesson. Cannot create quiz.";
      return "Invalid reference. Related record not found.";

    case "P2025": // record not found
      if (context.includes("Course")) return "Course not found.";
      if (context.includes("Lesson")) return "Lesson not found.";
      if (context.includes("Quiz")) return "Quiz not found.";
      return "Record not found.";

    case "P2011": // null constraint
      if (context.includes("Lesson")) return "Lesson must have a title and content.";
      if (context.includes("Course")) return "Course must have a name.";
      return "Required field is missing.";

    default:
      return `Database error while ${context}.`;
  }
}
