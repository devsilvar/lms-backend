// prisma/seedProfiles.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating missing profiles...");

  // ---- STUDENT PROFILES ----
  const students = await prisma.user.findMany({ where: { role: "STUDENT" } });

  for (const student of students) {
    const existing = await prisma.studentProfile.findUnique({
      where: { userId: student.id },
    });

    if (!existing) {
      const [first, last] = student.name
        ? student.name.split(" ", 2)
        : ["Student", "User"];

      await prisma.studentProfile.create({
        data: {
          userId: student.id,
          firstName: first || "Student",
          lastName: last || "User",
          phoneNumber: "08000000000",
          location: "Unknown",
          bio: "New student profile created",
        },
      });
    }
  }

  // ---- INSTRUCTOR PROFILES ----
  const instructors = await prisma.user.findMany({ where: { role: "INSTRUCTOR" } });

  for (const instructor of instructors) {
    const existing = await prisma.instructorProfile.findUnique({
      where: { userId: instructor.id },
    });

    if (!existing) {
      const [first, last] = instructor.name
        ? instructor.name.split(" ", 2)
        : ["Instructor", "User"];

      await prisma.instructorProfile.create({
        data: {
          userId: instructor.id,
          firstName: first || "Instructor",
          lastName: last || "User",
          expertise: "General",
          bio: "New instructor profile created",
        },
      });
    }
  }

  // ---- ADMIN PROFILES ----
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });

  const defaultPermissions = {
    manageUsers: true,
    manageCourses: true,
    viewReports: true,
  };

  for (const admin of admins) {
    const existing = await prisma.adminProfile.findUnique({
      where: { userId: admin.id },
    });

    if (!existing) {
      const displayName = admin.name?.split(" ", 2)[0] ?? "Admin";

      await prisma.adminProfile.create({
        data: {
          userId: admin.id,
          displayName,
          permissions: defaultPermissions,
        },
      });
    } else {
      // Merge permissions (future-proof)
      await prisma.adminProfile.update({
        where: { userId: admin.id },
        data: {
          permissions: {
            ...defaultPermissions,
            ...(typeof existing.permissions === "object" && existing.permissions !== null
              ? existing.permissions
              : {}),
          },
        },
      });
    }
  }

  console.log("✅ Profiles created where missing!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding profiles:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
