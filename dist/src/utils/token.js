import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/db.js";
export const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "60m", // 1 hour
    });
};
export const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "50m", // 50 minutes (less than access token)
    });
};
export const generateTokens = async (userId, role) => {
    const accessToken = generateAccessToken(userId, role);
    const refreshToken = generateRefreshToken(userId);
    // Hash refresh token before saving to DB
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    // Save refresh token in DB
    await prisma.refreshToken.create({
        data: {
            tokenHash: hashedToken,
            userId,
            expiresAt: new Date(Date.now() + 50 * 60 * 1000), // 50 minutes
        },
    });
    return { accessToken, refreshToken };
};
//# sourceMappingURL=token.js.map