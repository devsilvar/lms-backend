import prisma from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import crypto from "crypto";
import { sendMail } from "../config/mailer.js";
import jwt from "jsonwebtoken";
// export const register = async (req: Request, res: Response) => {
//   try {
//     const { email, password, role, name } = req.body;
//     // --- 1. Check for existing user ---
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }
//     // --- 2. Hash password ---
//       const hashed = await hashPassword(password);
//     // // --- 3. Create User ---
//     // const user = await prisma.user.create({
//     //   data: { name, email, passwordHash: hashed, role },
//     // });
//     // // --- 4. Create Profile Based on Role ---
//     // const [firstName, lastName] = name
//     //   ? name.split(" ", 2)
//     //   : [role === "INSTRUCTOR" ? "Instructor" : "Student", "User"];
//     // if (role === "STUDENT") {
//     //   await prisma.studentProfile.create({
//     //     data: {
//     //       userId: user.id,
//     //       firstName: firstName || "Student",
//     //       lastName: lastName || "User",
//     //       phoneNumber: "",
//     //       location: "",
//     //       bio: "Welcome student!",
//     //     },
//     //   });
//     // }
//     // if (role === "INSTRUCTOR") {
//     //   await prisma.instructorProfile.create({
//     //     data: {
//     //       userId: user.id,
//     //       firstName: firstName || "Instructor",
//     //       lastName: lastName || "User",
//     //       expertise: "General",
//     //       bio: "Welcome instructor!",
//     //     },
//     //   });
//     // }
//     // if (role === "ADMIN") {
//     //   await prisma.adminProfile.create({
//     //     data: {
//     //       userId: user.id,
//     //       displayName: firstName || "Admin",
//     //       permissions: {
//     //         manageUsers: true,
//     //         manageCourses: true,
//     //         viewReports: true,
//     //       },
//     //     },
//     //   });
//     // }
//     // 3. Prepare user + profile creation in one transaction
//     const [firstName, lastName] = name
//       ? name.split(" ", 2)
//       : [role === "INSTRUCTOR" ? "Instructor" : "Student", "User"];
//     const result = await prisma.$transaction(async (tx) => {
//       const user = await tx.user.create({
//         data: { name, email, passwordHash: hashed, role },
//       });
//       // Profile creation based on role
//       if (role === "STUDENT") {
//         await tx.studentProfile.create({
//           data: {
//             userId: user.id,
//             firstName: firstName,
//             lastName: lastName,
//             bio: "Welcome student!",
//           },
//         });
//       } else if (role === "INSTRUCTOR") {
//         await tx.instructorProfile.create({
//           data: {
//             userId: user.id,
//             firstName: firstName,
//             lastName: lastName,
//             expertise: "General",
//             bio: "Welcome instructor!",
//           },
//         });
//       } else if (role === "ADMIN") {
//         await tx.adminProfile.create({
//           data: {
//             userId: user.id,
//             displayName: firstName,
//             permissions: {
//               manageUsers: true,
//               manageCourses: true,
//               viewReports: true,
//             },
//           },
//         });
//       }
//     // --- 5. Send Welcome Email ---
//     await sendMail(
//       user.email,
//       "Welcome to DevrecruitSchool",
//       `<p>Hi ${firstName || "there"},</p>
//        <p>Welcome to DevrecruitSchool! You can now log in and start learning right away.</p>
//        <p>Best regards,<br/>Let's go!</p>`
//     );
//     // --- 6. Generate JWT Tokens ---
//     const accessToken = generateAccessToken(user.id, user.role);
//     const refreshToken = generateRefreshToken(user.id);
//     // Save hashed refresh token in DB
//     const hashedRefreshToken = crypto
//       .createHash("sha256")
//       .update(refreshToken)
//       .digest("hex");
//     await prisma.refreshToken.create({
//       data: {
//         userId: user.id,
//         tokenHash: hashedRefreshToken,
//         expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       },
//     });
//     // --- 7. Respond with Created User + Tokens ---
//     return res.status(201).json({
//       message: "User created successfully",
//       user,
//       tokens: { accessToken, refreshToken },
//     });
//   } catch (err) {
//     console.error("❌ Registration error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };
export const register = async (req, res) => {
    try {
        console.time("🔑 Total register time");
        const { email, password, role, name } = req.body;
        console.time("1️⃣ Check existing user");
        const existingUser = await prisma.user.findUnique({ where: { email } });
        console.timeEnd("1️⃣ Check existing user");
        if (existingUser) {
            console.timeEnd("🔑 Total register time");
            return res.status(400).json({ message: "User already exists" });
        }
        console.time("2️⃣ Hash password");
        const hashed = await hashPassword(password);
        console.timeEnd("2️⃣ Hash password");
        const [firstName, lastName] = name
            ? name.split(" ", 2)
            : [role === "INSTRUCTOR" ? "Instructor" : "Student", "User"];
        console.time("3️⃣ DB Transaction (user + profile + refresh token)");
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { name, email, passwordHash: hashed, role },
            });
            if (role === "STUDENT") {
                await tx.studentProfile.create({
                    data: {
                        userId: user.id,
                        firstName: firstName,
                        lastName: lastName,
                        bio: "Welcome student!",
                    },
                });
            }
            else if (role === "INSTRUCTOR") {
                await tx.instructorProfile.create({
                    data: {
                        userId: user.id,
                        firstName: firstName,
                        lastName: lastName,
                        expertise: "General",
                        bio: "Welcome instructor!",
                    },
                });
            }
            else if (role === "ADMIN") {
                await tx.adminProfile.create({
                    data: {
                        userId: user.id,
                        displayName: firstName,
                        permissions: {
                            manageUsers: true,
                            manageCourses: true,
                            viewReports: true,
                        },
                    },
                });
            }
            const refreshToken = generateRefreshToken(user.id);
            const hashedRefreshToken = crypto
                .createHash("sha256")
                .update(refreshToken)
                .digest("hex");
            await tx.refreshToken.create({
                data: {
                    userId: user.id,
                    tokenHash: hashedRefreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            return { user, refreshToken };
        });
        console.timeEnd("3️⃣ DB Transaction (user + profile + refresh token)");
        console.time("4️⃣ Generate Access Token");
        const accessToken = generateAccessToken(result.user.id, result.user.role);
        console.timeEnd("4️⃣ Generate Access Token");
        console.time("5️⃣ Send Welcome Email (async)");
        sendMail(result.user.email, "Welcome to DevrecruitSchool", `<p>Hi ${firstName},</p>
       <p>Welcome to DevrecruitSchool! You can now log in and start learning right away.</p>
       <p>Best regards,<br/>Let's go!</p>`)
            .then(() => console.timeEnd("5️⃣ Send Welcome Email (async)"))
            .catch((err) => {
            console.timeEnd("5️⃣ Send Welcome Email (async)");
            console.error("❌ Failed to send welcome email:", err);
        });
        console.timeEnd("🔑 Total register time");
        return res.status(201).json({
            message: "User created successfully",
            user: result.user,
            tokens: { accessToken, refreshToken: result.refreshToken },
        });
    }
    catch (err) {
        console.error("❌ Registration error:", err);
        console.timeEnd("🔑 Total register time");
        return res.status(500).json({ message: "Server error" });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const valid = await comparePassword(password, user.passwordHash);
        if (!valid)
            return res.status(401).json({ message: "Invalid credentials" });
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);
        // Create a hash of the refresh token for database storage
        const hashedRefreshToken = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");
        // Save the HASHED token to the database
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: hashedRefreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
        return res.json({ accessToken, refreshToken, user: user });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
// Step 1: Request Reset
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(404).json({ message: "User not found" });
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    await prisma.passwordResetToken.create({
        data: {
            token,
            userId: user.id,
            expiresAt,
        },
    });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendMail(user.email, "Password Reset Request", `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`);
    res.json({ message: "Password reset email sent" });
};
// Step 2: Reset Password
export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    const resetRecord = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: hashed },
    });
    await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
    res.json({ message: "Password reset successful" });
};
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ message: "Refresh token required" });
        // Hash and compare
        const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
        const storedToken = await prisma.refreshToken.findUnique({
            where: { tokenHash: hashedToken },
        });
        if (!storedToken)
            return res.status(403).json({ message: "Invalid refresh token" });
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err)
                return res.status(403).json({ message: "Invalid refresh token" });
            const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, email: true, name: true, role: true, createdAt: true }, });
            if (!user)
                return res.status(404).json({ message: "User not found" });
            // ✅ Issue new access token only
            const accessToken = generateAccessToken(user.id, user.role);
            // Optional: Fetch user from DB for fresh data
            if (!user)
                return res.status(404).json({ message: "User not found" });
            // res.json(user);
            return res.json({ accessToken, user });
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};
export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token required" });
        }
        // 1. Hash the incoming plain refresh token
        const hashedRefreshToken = crypto
            .createHash("sha26")
            .update(refreshToken)
            .digest("hex");
        // 2. Use the HASHED token to find and delete the record
        await prisma.refreshToken.deleteMany({
            where: {
                tokenHash: hashedRefreshToken,
            },
        });
        return res.json({ message: "Logged out successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};
//# sourceMappingURL=authControllers.js.map