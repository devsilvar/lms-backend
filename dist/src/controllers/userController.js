import prisma from "../config/db.js";
export const getStudentProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                studentProfile: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                        location: true,
                        bio: true,
                        profilePicture: true,
                        accountStatus: true,
                    },
                },
            },
        });
        if (!user || !user.studentProfile) {
            return res.status(404).json({ message: "Student profile not found" });
        }
        res.status(200).json({
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            ...user.studentProfile, // Merge profile fields into top-level response
        });
    }
    catch (error) {
        console.error("❌ Error fetching student profile:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
export const updateStudentProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
        if (req.user?.role !== "STUDENT") {
            return res.status(403).json({ message: "Only students can update this profile" });
        }
        const { firstName, lastName, phoneNumber, location, bio, profilePicture } = req.body;
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id },
        });
        if (!profile)
            return res.status(404).json({ message: "Profile not found" });
        const newFullName = [firstName ?? profile.firstName, lastName ?? profile.lastName]
            .filter(Boolean)
            .join(" ");
        const [updatedProfile, updatedUser] = await prisma.$transaction([
            prisma.studentProfile.update({
                where: { userId: req.user.id },
                data: { firstName, lastName, phoneNumber, location, bio, profilePicture },
            }),
            prisma.user.update({
                where: { id: req.user.id },
                data: { name: newFullName },
            }),
        ]);
        res.status(200).json({
            message: "Student profile updated",
            user: updatedUser,
            profile: updatedProfile,
        });
    }
    catch (error) {
        console.error("❌ Error updating student profile:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
export const updateInstructorProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
        if (req.user?.role !== "INSTRUCTOR") {
            return res.status(403).json({ message: "Only instructors can update this profile" });
        }
        const { firstName, lastName, expertise, bio, profilePicture } = req.body;
        const profile = await prisma.instructorProfile.findUnique({
            where: { userId: req.user.id },
        });
        if (!profile)
            return res.status(404).json({ message: "Profile not found" });
        const newFullName = [firstName ?? profile.firstName, lastName ?? profile.lastName]
            .filter(Boolean)
            .join(" ");
        const [updatedProfile, updatedUser] = await prisma.$transaction([
            prisma.instructorProfile.update({
                where: { userId: req.user.id },
                data: { firstName, lastName, expertise, bio, profilePicture },
            }),
            prisma.user.update({
                where: { id: req.user.id },
                data: { name: newFullName },
            }),
        ]);
        res.status(200).json({
            message: "Instructor profile updated",
            user: updatedUser,
            profile: updatedProfile,
        });
    }
    catch (error) {
        console.error("❌ Error updating instructor profile:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
export const updateAdminProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
        if (req.user?.role !== "ADMIN") {
            return res.status(403).json({ message: "Only admins can update this profile" });
        }
        const { displayName, permissions } = req.body;
        const profile = await prisma.adminProfile.findUnique({
            where: { userId: req.user.id },
        });
        if (!profile)
            return res.status(404).json({ message: "Profile not found" });
        const [updatedProfile, updatedUser] = await prisma.$transaction([
            prisma.adminProfile.update({
                where: { userId: req.user.id },
                data: {
                    displayName,
                    permissions: permissions
                        ? { ...(typeof profile.permissions === "object" && profile.permissions !== null ? profile.permissions : {}), ...(typeof permissions === "object" && permissions !== null ? permissions : {}) }
                        : profile.permissions,
                },
            }),
            prisma.user.update({
                where: { id: req.user.id },
                data: { name: displayName ?? profile.displayName ?? "Admin" },
            }),
        ]);
        res.status(200).json({
            message: "Admin profile updated",
            user: updatedUser,
            profile: updatedProfile,
        });
    }
    catch (error) {
        console.error("❌ Error updating admin profile:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
//# sourceMappingURL=userController.js.map